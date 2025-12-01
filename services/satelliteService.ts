
import { DisasterType, RiskPoint } from '../types';
import { MOCK_RISK_DATA } from '../constants';

// Configuration
const NASA_API_URL = process.env.REACT_APP_SAT_API_URL || "https://eonet.gsfc.nasa.gov/api/v3/events";
const BMKG_PROXY_URL = "/api/bmkg/quakes"; // Local proxy to avoid CORS
const USGS_API_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson"; // Major quakes last 30 days
const TIMEOUT_MS = 10000;
const CACHE_KEY = "disaster_data_cache";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes

// Sumatra Bounding Box (Roughly)
const SUMATRA_BOUNDS = {
  minLat: -6.5,
  maxLat: 6.0,
  minLng: 95.0,
  maxLng: 109.0
};

const NASA_CATEGORY_MAP: Record<string, DisasterType> = {
  'wildfires': DisasterType.FIRE,
  'floods': DisasterType.FLOOD,
  'severeStorms': DisasterType.WAVE, 
  'landslides': DisasterType.FLOOD, 
  'volcanoes': DisasterType.VOLCANO,
  'earthquakes': DisasterType.EARTHQUAKE,
};

export interface SatelliteResponse {
  data: RiskPoint[];
  source: 'satellite' | 'simulation' | 'agency_api';
  error?: string;
  lastChecked: Date;
}

// --- UTILITIES ---

const isInsideSumatra = (lat: number, lng: number): boolean => {
  return lat >= SUMATRA_BOUNDS.minLat && 
         lat <= SUMATRA_BOUNDS.maxLat && 
         lng >= SUMATRA_BOUNDS.minLng && 
         lng <= SUMATRA_BOUNDS.maxLng;
};

const getCache = (): SatelliteResponse | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const age = Date.now() - new Date(parsed.lastChecked).getTime();
    
    if (age < CACHE_DURATION_MS) {
      console.log("Serving disaster data from cache");
      return { ...parsed, lastChecked: new Date(parsed.lastChecked) }; // Hydrate date
    }
  } catch (e) {
    console.warn("Cache parsing error", e);
  }
  return null;
};

const setCache = (data: SatelliteResponse) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Cache write error", e);
  }
};

// --- FETCHERS ---

// 1. NASA EONET Fetcher
const fetchNASAEvents = async (): Promise<RiskPoint[]> => {
  try {
    const bboxStr = `${SUMATRA_BOUNDS.minLng},${SUMATRA_BOUNDS.minLat},${SUMATRA_BOUNDS.maxLng},${SUMATRA_BOUNDS.maxLat}`;
    const url = `${NASA_API_URL}?bbox=${bboxStr}&status=open`;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.events) return [];

    return data.events
      .map((event: any) => {
        const category = event.categories.find((c: any) => NASA_CATEGORY_MAP[c.id]);
        if (!category) return null;

        const geometry = event.geometry[event.geometry.length - 1];
        if (!geometry || geometry.type !== 'Point') return null;

        return {
          id: `nasa-${event.id}`,
          locationName: event.title,
          type: NASA_CATEGORY_MAP[category.id],
          coords: { lat: geometry.coordinates[1], lng: geometry.coordinates[0] },
          severity: 'High',
          description: `NASA Satellite Detection: ${event.title}`,
          lastOccurrence: new Date(geometry.date).toLocaleDateString('id-ID'),
          source: 'satellite',
          externalLink: event.link
        } as RiskPoint;
      })
      .filter((p: RiskPoint | null) => p !== null);
  } catch (err) {
    console.warn("NASA API fetch failed (non-critical):", err);
    return [];
  }
};

// 2. BMKG Earthquake Fetcher
const fetchBMKGQuakes = async (): Promise<RiskPoint[]> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Call our local proxy
    const response = await fetch(BMKG_PROXY_URL, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) return [];

    const data = await response.json();
    // Data structure: data.Infogempa.gempa[]
    const quakes = data?.Infogempa?.gempa || [];

    return quakes
      .map((q: any) => {
        const [lat, lng] = q.Coordinates.split(',').map(Number);
        
        // Filter: Must be in Sumatra
        if (!isInsideSumatra(lat, lng)) return null;

        const magnitude = parseFloat(q.Magnitude);
        const depth = parseFloat(q.Kedalaman.replace(' km', ''));
        
        // Default to EARTHQUAKE
        let type = DisasterType.EARTHQUAKE;
        let desc = `Gempa Mag ${magnitude}, Kedalaman ${q.Kedalaman}.`;

        // Add nuance to description
        if (depth < 60 && magnitude > 5.5) {
             desc += " (Dangkal). Waspada potensi kerusakan struktur.";
        } else if (magnitude > 6.5) {
             desc += " Potensi gempa susulan kuat.";
        }

        return {
          id: `bmkg-${q.DateTime}`, // Using datetime as ID since parsing strictly is hard
          locationName: `Pusat Gempa: ${q.Wilayah}`,
          type: type,
          coords: { lat, lng },
          severity: magnitude > 6.0 ? 'Critical' : 'High',
          description: desc,
          lastOccurrence: `${q.Tanggal} ${q.Jam}`,
          source: 'agency_api',
          details: {
            magnitude,
            depth
          },
          externalLink: "https://warning.bmkg.go.id"
        } as RiskPoint;
      })
      .filter((p: RiskPoint | null) => p !== null);

  } catch (err) {
    console.warn("BMKG API fetch failed (non-critical):", err);
    return [];
  }
};

// 3. USGS Earthquake Fetcher (Global Significant - Last 30 Days)
const fetchUSGSQuakes = async (): Promise<RiskPoint[]> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(USGS_API_URL, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.features) return [];

    return data.features
      .map((f: any) => {
        const [lng, lat, depth] = f.geometry.coordinates;
        
        // Filter: Must be in Sumatra
        if (!isInsideSumatra(lat, lng)) return null;

        const props = f.properties;
        const date = new Date(props.time);

        return {
          id: `usgs-${f.id}`,
          locationName: props.place,
          type: DisasterType.EARTHQUAKE,
          coords: { lat, lng },
          severity: props.mag > 6.0 ? 'Critical' : 'High',
          description: `USGS Report: Mag ${props.mag} Earthquake. ${props.title}`,
          lastOccurrence: date.toLocaleDateString('id-ID'),
          source: 'agency_api',
          details: {
            magnitude: props.mag,
            depth: depth
          },
          externalLink: props.url,
          headlines: [`BREAKING: Gempa M${props.mag} guncang ${props.place}`, `USGS mencatat aktivitas seismik signifikan`]
        } as RiskPoint;
      })
      .filter((p: RiskPoint | null) => p !== null);
  } catch (err) {
    console.warn("USGS API fetch failed:", err);
    return [];
  }
};

// --- MAIN AGGREGATOR ---

export const fetchSatelliteData = async (): Promise<SatelliteResponse> => {
  // 1. Check Cache
  const cached = getCache();
  if (cached) return cached;

  try {
    // 2. Parallel Fetch (Added USGS)
    const [nasaPoints, bmkgPoints, usgsPoints] = await Promise.all([
      fetchNASAEvents(),
      fetchBMKGQuakes(),
      fetchUSGSQuakes()
    ]);

    // Merge logic: Prioritize BMKG for local details, but use USGS for major history not in BMKG feed
    const allRealPoints = [...nasaPoints, ...bmkgPoints];
    
    // Add USGS points only if they don't overlap spatially/temporally with BMKG points (simple dedupe)
    usgsPoints.forEach(usgsPt => {
        const isDuplicate = bmkgPoints.some(bmkgPt => {
            const latDiff = Math.abs(bmkgPt.coords.lat - usgsPt.coords.lat);
            const lngDiff = Math.abs(bmkgPt.coords.lng - usgsPt.coords.lng);
            return latDiff < 0.1 && lngDiff < 0.1; // Roughly same location
        });
        if (!isDuplicate) {
            allRealPoints.push(usgsPt);
        }
    });

    if (allRealPoints.length === 0) {
      console.log("No live data found in Sumatra. Returning simulation.");
      const simResponse: SatelliteResponse = {
        data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
        source: 'simulation',
        lastChecked: new Date()
      };
      return simResponse;
    }

    // 3. Merge & Format Response
    const response: SatelliteResponse = {
      data: allRealPoints,
      source: 'agency_api', // Dominant source
      lastChecked: new Date()
    };

    // 4. Update Cache
    setCache(response);

    return response;

  } catch (error: any) {
    console.error("Data Aggregator Error:", error);
    return {
      data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
      source: 'simulation',
      error: error.message,
      lastChecked: new Date()
    };
  }
};
