
import { DisasterType, RiskPoint } from '../types';
import { MOCK_RISK_DATA } from '../constants';

const AGGREGATOR_URL = "/api/disasters/aggregate";
const TIMEOUT_MS = 15000;
const CACHE_KEY = "disaster_data_persistent_cache_v2"; // Versioned cache to invalidate old schemas
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 Minutes for client side

export interface SatelliteResponse {
  data: RiskPoint[];
  source: 'satellite' | 'simulation' | 'agency_api';
  error?: string;
  lastChecked: Date;
}

// --- CACHE UTILS ---
const getCache = (): SatelliteResponse | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Check if data is array to prevent crash from bad cache
    if (!Array.isArray(parsed.data)) return null; 
    
    if (Date.now() - new Date(parsed.lastChecked).getTime() < CACHE_DURATION_MS) {
      return { ...parsed, lastChecked: new Date(parsed.lastChecked) };
    }
  } catch (e) { console.warn("Cache parsing error", e); }
  return null;
};

const setCache = (data: SatelliteResponse) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
};

// --- SIMULATION FALLBACK GENERATOR ---
const getSimulationData = (errorMsg: string): SatelliteResponse => {
  return {
    data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
    source: 'simulation',
    error: errorMsg,
    lastChecked: new Date()
  };
};

// --- MAIN FETCHER ---
export const fetchSatelliteData = async (): Promise<SatelliteResponse> => {
  // 1. Check Cache
  const cached = getCache();
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(AGGREGATOR_URL, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(id);

    // Check content type to avoid "Unexpected token <" error if 404/500 returns HTML
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error(`Invalid content-type from server: ${contentType}`);
    }

    if (!response.ok) throw new Error(`Backend Error ${response.status}`);

    const json = await response.json();
    const livePoints: RiskPoint[] = json.data || [];

    if (livePoints.length === 0) {
      console.log("No live data returned from aggregator. Using simulation.");
      return getSimulationData("No live events found");
    }

    const result: SatelliteResponse = {
      data: livePoints,
      source: 'agency_api',
      lastChecked: new Date()
    };
    
    setCache(result);
    return result;

  } catch (error: any) {
    console.warn("Satellite Service Fetch Error:", error.message);
    
    // OFFLINE FALLBACK: Try to read stale cache from localStorage if network fails
    const staleCache = localStorage.getItem(CACHE_KEY);
    if (staleCache) {
       try {
         const parsed = JSON.parse(staleCache);
         if (Array.isArray(parsed.data)) {
            console.log("Network failed, loading stale cache.");
            return { 
              ...parsed, 
              lastChecked: new Date(parsed.lastChecked),
              error: "Offline Mode (Cached Data)" 
            };
         }
       } catch (e) {
         console.warn("Failed to parse stale cache:", e);
       }
    }

    // Final Fallback: Simulation
    return getSimulationData(error.message || 'Connection failed');
  }
};
