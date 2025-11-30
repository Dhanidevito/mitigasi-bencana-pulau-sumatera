import { DisasterType, RiskPoint } from '../types';
import { MOCK_RISK_DATA } from '../constants';

// Configuration from Environment or Defaults
const API_URL = process.env.REACT_APP_SAT_API_URL || "https://eonet.gsfc.nasa.gov/api/v3/events";
const API_KEY = process.env.REACT_APP_SAT_API_KEY || ""; 
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;

// Sumatra Bounding Box
const SUMATRA_BBOX = "95.0,-6.0,108.0,6.0"; 

const CATEGORY_MAP: Record<string, DisasterType> = {
  'wildfires': DisasterType.FIRE,
  'floods': DisasterType.FLOOD,
  'severeStorms': DisasterType.WAVE, 
  'landslides': DisasterType.LANDSLIDE,
  'volcanoes': DisasterType.LANDSLIDE, 
};

export interface SatelliteResponse {
  data: RiskPoint[];
  source: 'satellite' | 'simulation';
  error?: string;
  lastChecked: Date;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const response = await fetch(url, { 
      signal: controller.signal,
      headers
    });
    
    clearTimeout(id);

    if (!response.ok) {
      // 4xx errors usually shouldn't be retried immediately (client error), but 5xx should.
      // For simplicity in this demo, we throw to trigger retry.
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (err: any) {
    if (retries > 0 && err.name !== 'AbortError') {
      const delay = Math.pow(2, MAX_RETRIES - retries) * 1000; // Exponential backoff: 1s, 2s, 4s...
      console.warn(`Fetch failed, retrying in ${delay}ms... (${retries} attempts left)`);
      await sleep(delay);
      return fetchWithRetry(url, retries - 1);
    }
    throw err;
  }
};

export const fetchSatelliteData = async (): Promise<SatelliteResponse> => {
  const url = `${API_URL}?bbox=${SUMATRA_BBOX}&status=open`;

  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();

    // Validate data structure
    if (!data.events) {
       throw new Error("Invalid API response structure");
    }

    if (data.events.length === 0) {
      console.log("No active satellite events found for Sumatra. Switching to simulation.");
      return {
        data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
        source: 'simulation',
        lastChecked: new Date()
      };
    }

    const mappedPoints: RiskPoint[] = data.events
      .map((event: any) => {
        const category = event.categories.find((c: any) => CATEGORY_MAP[c.id]);
        if (!category) return null;

        const geometry = event.geometry[event.geometry.length - 1];
        if (!geometry || geometry.type !== 'Point') return null;

        return {
          id: event.id,
          locationName: event.title,
          type: CATEGORY_MAP[category.id],
          coords: {
            lat: geometry.coordinates[1],
            lng: geometry.coordinates[0]
          },
          severity: 'High', 
          description: `Deteksi Satelit Real-time: ${event.title}.`,
          lastOccurrence: new Date(geometry.date).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }),
          source: 'satellite'
        } as RiskPoint;
      })
      .filter((p: RiskPoint | null) => p !== null);

    // Fallback if mapping resulted in empty set (e.g. unsupported categories)
    if (mappedPoints.length === 0) {
       return {
          data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
          source: 'simulation',
          lastChecked: new Date()
       };
    }

    return {
      data: mappedPoints,
      source: 'satellite',
      lastChecked: new Date()
    };

  } catch (error: any) {
    console.error("Satellite Service Error:", error);
    return {
      data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})), // Keep showing data (simulation) on error
      source: 'simulation',
      error: error.name === 'AbortError' ? "Connection Timeout" : error.message,
      lastChecked: new Date()
    };
  }
};