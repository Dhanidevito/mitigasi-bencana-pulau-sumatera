
export enum DisasterType {
  FIRE = 'FIRE',
  FLOOD = 'FLOOD',
  LANDSLIDE = 'LANDSLIDE',
  WAVE = 'WAVE',
  VOLCANO = 'VOLCANO',
  EARTHQUAKE = 'EARTHQUAKE'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RiskPoint {
  id: string;
  locationName: string; // Kecamatan or District
  type: DisasterType;
  coords: Coordinates;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  lastOccurrence?: string; // Human readable date string
  timestamp?: number; // Raw epoch timestamp (ms) for time-based filtering
  source?: 'satellite' | 'simulation' | 'agency_api' | 'BMKG' | 'LAPAN' | 'SENTINEL' | 'LANDSAT' | 'USGS' | 'MODIS'; 
  externalLink?: string; // URL to official report (BMKG/BNPB)
  headlines?: string[];
  
  // Data Fusion & Analytics
  riskScore?: number; // 0-100 Calculated Risk Index
  forecast?: string; // Weather prediction (NOAA/OpenMeteo)
  impactDetails?: {
    nearestCity?: string;
    distanceKm?: number;
    estimatedPopulationAffected?: string;
  };

  details?: {
    waterSources?: Coordinates[]; // For fires
    elevation?: number;
    populationDensity?: string;
    magnitude?: number; // For earthquakes
    depth?: number; // For earthquakes
    rainfall?: number; // mm/day
  }
}

export interface MitigationPlan {
  title: string;
  preventativeMeasures: string[]; // Sebelum Bencana
  duringDisasterActions: string[]; // Saat Bencana
  immediateActions: string[]; // Tanggap Darurat / Setelah Bencana
  survivalTips: string[]; // Tips Survival / Lifehacks Individu
  resourceAllocation: string;
  rawAnalysis: string;
  socialNews: string[]; // Berita/Update Media Sosial
}
