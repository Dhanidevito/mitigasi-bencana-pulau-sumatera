
import { DisasterType, RiskPoint } from '../types';
import { MOCK_RISK_DATA } from '../constants';

const AGGREGATOR_URL = "/api/disasters/aggregate";
const TIMEOUT_MS = 15000;
const CACHE_KEY = "disaster_data_persistent_cache"; // Changed key for persistent storage
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
    // Use localStorage instead of sessionStorage for offline persistence across sessions
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    // Even if expired, we might return it if offline, but here we just check validity
    if (Date.now() - new Date(parsed.lastChecked).getTime() < CACHE_DURATION_MS) {
      return { ...parsed, lastChecked: new Date(parsed.lastChecked) };
    }
  } catch (e) { console.warn("Cache parsing error", e); }
  return null;
};

const setCache = (data: SatelliteResponse) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
};

// --- MAIN FETCHER ---
export const fetchSatelliteData = async (): Promise<SatelliteResponse> => {
  // 1. Check Cache
  const cached = getCache();
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(AGGREGATOR_URL, { signal: controller.signal });
    clearTimeout(id);

    if (!response.ok) throw new Error(`Backend Error ${response.status}`);

    const json = await response.json();
    const livePoints: RiskPoint[] = json.data || [];

    // Fallback to simulation if no live events
    if (livePoints.length === 0) {
      console.log("No live data returned from aggregator. Using simulation.");
      const simResponse: SatelliteResponse = {
        data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
        source: 'simulation',
        lastChecked: new Date()
      };
      return simResponse;
    }

    const result: SatelliteResponse = {
      data: livePoints,
      source: 'agency_api',
      lastChecked: new Date()
    };
    
    setCache(result);
    return result;

  } catch (error: any) {
    console.error("Satellite Service Error:", error);
    
    // OFFLINE FALLBACK: Try to read stale cache from localStorage if network fails
    const staleCache = localStorage.getItem(CACHE_KEY);
    if (staleCache) {
       console.log("Network failed, loading stale cache for offline mode.");
       const parsed = JSON.parse(staleCache);
       return { 
         ...parsed, 
         lastChecked: new Date(parsed.lastChecked),
         error: "Offline Mode (Cached Data)" 
       };
    }

    // Final Fallback: Simulation
    return {
      data: MOCK_RISK_DATA.map(d => ({...d, source: 'simulation'})),
      source: 'simulation',
      error: error.message || 'Connection failed',
      lastChecked: new Date()
    };
  }
};
