
export enum DisasterType {
  FIRE = 'FIRE',
  FLOOD = 'FLOOD',
  LANDSLIDE = 'LANDSLIDE',
  WAVE = 'WAVE'
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
  details?: {
    waterSources?: Coordinates[]; // For fires
    elevation?: number;
    populationDensity?: string;
  }
}

export interface MitigationPlan {
  title: string;
  preventativeMeasures: string[]; // Sebelum Bencana
  duringDisasterActions: string[]; // Saat Bencana (NEW)
  immediateActions: string[]; // Tanggap Darurat / Setelah Bencana
  resourceAllocation: string;
  rawAnalysis: string;
}
