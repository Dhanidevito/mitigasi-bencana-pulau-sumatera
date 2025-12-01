
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
  lastOccurrence?: string; // Date string
  source?: 'satellite' | 'simulation' | 'agency_api'; // Updated source types
  externalLink?: string; // URL to official report (BMKG/BNPB)
  details?: {
    waterSources?: Coordinates[]; // For fires
    elevation?: number;
    populationDensity?: string;
    magnitude?: number; // For earthquakes
    depth?: number; // For earthquakes
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
