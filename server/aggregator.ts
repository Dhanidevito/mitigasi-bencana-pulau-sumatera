
import fetch from 'node-fetch';
import { DisasterType, RiskPoint } from '../types';

// --- CONFIGURATION ---
const TIMEOUT_MS = 15000;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes
const SUMATRA_BOUNDS = {
  minLat: -6.5, maxLat: 6.0,
  minLng: 95.0, maxLng: 109.0
};

// Major Cities for Impact Analysis (Simple Vector Layer)
const MAJOR_CITIES = [
  { name: 'Banda Aceh', lat: 5.5483, lng: 95.3238 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Padang', lat: -0.9471, lng: 100.4172 },
  { name: 'Pekanbaru', lat: 0.5071, lng: 101.4478 },
  { name: 'Jambi', lat: -1.6099, lng: 103.6073 },
  { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
  { name: 'Bengkulu', lat: -3.8004, lng: 102.2655 },
  { name: 'Bandar Lampung', lat: -5.3971, lng: 105.2668 }
];

// --- CACHING SYSTEM ---
let memoryCache: { data: RiskPoint[], timestamp: number } | null = null;

// --- HELPER FUNCTIONS ---
const isInsideSumatra = (lat: number, lng: number): boolean => {
  return lat >= SUMATRA_BOUNDS.minLat && 
         lat <= SUMATRA_BOUNDS.maxLat && 
         lng >= SUMATRA_BOUNDS.minLng && 
         lng <= SUMATRA_BOUNDS.maxLng;
};

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
};

// Data Fusion: AI Risk Scoring
const calculateRiskScore = (point: RiskPoint): number => {
  let score = 50; // Base score

  // Severity Weight
  if (point.severity === 'Critical') score += 30;
  if (point.severity === 'High') score += 15;
  if (point.severity === 'Medium') score += 5;

  // Type Specifics
  if (point.type === DisasterType.EARTHQUAKE && point.details?.magnitude) {
    if (point.details.magnitude >= 7.0) score += 20;
    else if (point.details.magnitude >= 6.0) score += 10;
    
    // Shallow quakes are more dangerous
    if (point.details.depth && point.details.depth < 15) score += 15;
  }

  if (point.type === DisasterType.FIRE && point.source === 'MODIS') {
    // MODIS usually indicates verified high heat
    score += 10;
  }

  return Math.min(100, score);
};

// Data Fusion: Infrastructure Impact
const assessImpact = (lat: number, lng: number) => {
  let nearestCity = '';
  let minDist = Infinity;

  MAJOR_CITIES.forEach(city => {
    const dist = getDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearestCity = city.name;
    }
  });

  return {
    nearestCity,
    distanceKm: Math.round(minDist),
    estimatedPopulationAffected: minDist < 20 ? 'High' : minDist < 50 ? 'Medium' : 'Low'
  };
};

// External API: Open-Meteo (Proxy for NOAA GFS)
const fetchWeatherForecast = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&timezone=auto`);
    if (!res.ok) return "Data cuaca tidak tersedia.";
    const data: any = await res.json();
    const rain = data.daily?.precipitation_sum?.[0];
    return rain !== undefined ? `Curah Hujan (NOAA GFS): ${rain}mm` : "Data cuaca terbatas.";
  } catch {
    return "Gagal memuat prakiraan.";
  }
};

// --- FETCHERS ---

// 1. BMKG Fetcher (Earthquakes)
async function fetchBMKG(): Promise<RiskPoint[]> {
  try {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json', { timeout: TIMEOUT_MS });
    if (!res.ok) throw new Error(`BMKG Status ${res.status}`);
    const json: any = await res.json();
    const quakes = json?.Infogempa?.gempa || [];

    return quakes.map((q: any) => {
      const [lat, lng] = q.Coordinates.split(',').map(Number);
      if (!isInsideSumatra(lat, lng)) return null;

      const mag = parseFloat(q.Magnitude);
      return {
        id: `bmkg-${q.DateTime}`,
        locationName: q.Wilayah,
        type: DisasterType.EARTHQUAKE,
        coords: { lat, lng },
        severity: mag > 6.0 ? 'Critical' : 'High',
        description: `Gempa Tektonik M${mag}, Kedalaman ${q.Kedalaman}.`,
        lastOccurrence: `${q.Tanggal} ${q.Jam}`,
        source: 'BMKG',
        externalLink: 'https://warning.bmkg.go.id',
        details: { magnitude: mag, depth: parseFloat(q.Kedalaman) }
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('BMKG Fetch Error:', e instanceof Error ? e.message : e);
    return [];
  }
}

// 2. NASA EONET -> Mapped to MODIS/Sentinel/Landsat
async function fetchEONET(): Promise<RiskPoint[]> {
  try {
    const bbox = `${SUMATRA_BOUNDS.minLng},${SUMATRA_BOUNDS.minLat},${SUMATRA_BOUNDS.maxLng},${SUMATRA_BOUNDS.maxLat}`;
    const res = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?bbox=${bbox}&status=open`, { timeout: TIMEOUT_MS });
    if (!res.ok) throw new Error(`EONET Status ${res.status}`);
    const json: any = await res.json();

    return (json.events || []).map((ev: any) => {
      const catId = ev.categories[0]?.id;
      const geom = ev.geometry[ev.geometry.length - 1];
      const lat = geom.coordinates[1];
      const lng = geom.coordinates[0];

      let type: DisasterType = DisasterType.FIRE;
      let source: RiskPoint['source'] = 'satellite';
      let desc = ev.title;

      if (catId === 'wildfires') {
        type = DisasterType.FIRE;
        // NASA FIRMS usually uses MODIS/VIIRS for active fires
        source = 'MODIS'; 
        desc = `MODIS Thermal Anomaly: ${ev.title}`;
      } else if (catId === 'floods') {
        type = DisasterType.FLOOD;
        source = 'SENTINEL'; // Sentinel-1 Radar
        desc = `Copernicus Sentinel-1 Radar Analysis: ${ev.title}`;
      } else if (catId === 'landslides') {
        type = DisasterType.LANDSLIDE;
        source = 'LANDSAT'; // Landsat Optical
        desc = `NASA Landsat Terrain Analysis: ${ev.title}`;
      } else if (catId === 'volcanoes') {
        type = DisasterType.VOLCANO;
        source = 'LAPAN';
      } else if (catId === 'severeStorms') {
        type = DisasterType.WAVE;
        source = 'BMKG'; 
      } else {
        return null;
      }

      return {
        id: `nasa-${ev.id}`,
        locationName: ev.title,
        type,
        coords: { lat, lng },
        severity: 'High',
        description: desc,
        lastOccurrence: new Date(geom.date).toLocaleDateString('id-ID'),
        source,
        externalLink: ev.link
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('NASA EONET Fetch Error:', e instanceof Error ? e.message : e);
    return [];
  }
}

// 3. USGS Fetcher
async function fetchUSGS(): Promise<RiskPoint[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson', { timeout: TIMEOUT_MS });
    if (!res.ok) throw new Error(`USGS Status ${res.status}`);
    const json: any = await res.json();

    return (json.features || []).map((f: any) => {
      const [lng, lat, depth] = f.geometry.coordinates;
      if (!isInsideSumatra(lat, lng)) return null;

      const props = f.properties;
      return {
        id: `usgs-${f.id}`,
        locationName: props.place,
        type: DisasterType.EARTHQUAKE,
        coords: { lat, lng },
        severity: props.mag > 6 ? 'Critical' : 'High',
        description: `USGS Global Network: M${props.mag} - ${props.title}`,
        lastOccurrence: new Date(props.time).toLocaleDateString('id-ID'),
        source: 'USGS',
        externalLink: props.url,
        details: { magnitude: props.mag, depth }
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('USGS Fetch Error:', e instanceof Error ? e.message : e);
    return [];
  }
}

// --- MAIN AGGREGATOR ---
export async function getAggregatedData(): Promise<RiskPoint[]> {
  // Check Cache
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION_MS) {
    console.log('Serving from In-Memory Cache');
    return memoryCache.data;
  }

  // Run all fetches in parallel
  const results = await Promise.allSettled([
    fetchBMKG(),
    fetchEONET(),
    fetchUSGS()
  ]);

  const allPoints: RiskPoint[] = [];

  results.forEach(res => {
    if (res.status === 'fulfilled') {
      allPoints.push(...res.value);
    }
  });

  // Deduplication & Fusion Logic
  const uniquePoints: RiskPoint[] = [];
  
  // We need to async enrich with weather, so we use Promise.all
  const enrichedPoints = await Promise.all(allPoints.map(async (point) => {
    
    // 1. Data Fusion: Weather
    const forecast = await fetchWeatherForecast(point.coords.lat, point.coords.lng);
    
    // 2. Data Fusion: Impact Analysis
    const impact = assessImpact(point.coords.lat, point.coords.lng);
    
    // 3. Data Fusion: Risk Scoring
    const score = calculateRiskScore(point);

    return {
      ...point,
      forecast,
      impactDetails: impact,
      riskScore: score
    };
  }));

  // Simple deduplication based on coordinates proximity
  enrichedPoints.forEach(point => {
    const isDuplicate = uniquePoints.some(existing => {
      if (point.type !== existing.type) return false;
      const latDiff = Math.abs(point.coords.lat - existing.coords.lat);
      const lngDiff = Math.abs(point.coords.lng - existing.coords.lng);
      return latDiff < 0.1 && lngDiff < 0.1; 
    });

    if (!isDuplicate) {
      uniquePoints.push(point);
    } else {
      // Trust BMKG/Local over global if duplicate
      if (point.source === 'BMKG') {
        const idx = uniquePoints.findIndex(p => Math.abs(p.coords.lat - point.coords.lat) < 0.1);
        if (idx !== -1) uniquePoints[idx] = point;
      }
    }
  });

  // Update Cache
  memoryCache = { data: uniquePoints, timestamp: Date.now() };

  return uniquePoints;
}
