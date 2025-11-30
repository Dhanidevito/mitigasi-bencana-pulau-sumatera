import { DisasterType, RiskPoint } from './types';

export const SUMATRA_CENTER: [number, number] = [-0.9492, 101.3485]; // Central Sumatra
export const DEFAULT_ZOOM = 6;

// Mock GIS Data (Simulating Satellite Identification)
export const MOCK_RISK_DATA: RiskPoint[] = [
  // FIRE (Kebakaran Hutan) - Riau & Jambi areas
  {
    id: 'f1',
    locationName: 'Kec. Dumai Barat, Riau',
    type: DisasterType.FIRE,
    coords: { lat: 1.6666, lng: 101.4500 },
    severity: 'Critical',
    description: 'Hotspot detected in peatland area.',
    details: {
      waterSources: [
        { lat: 1.6700, lng: 101.4600 },
        { lat: 1.6600, lng: 101.4400 }
      ]
    }
  },
  {
    id: 'f2',
    locationName: 'Kec. Betara, Jambi',
    type: DisasterType.FIRE,
    coords: { lat: -1.0500, lng: 103.3500 },
    severity: 'High',
    description: 'Active thermal anomaly near plantation.',
    details: {
      waterSources: [
        { lat: -1.0400, lng: 103.3600 }
      ]
    }
  },
  // FLOOD (Banjir) - Palembang & Aceh
  {
    id: 'fl1',
    locationName: 'Kec. Gandus, Palembang',
    type: DisasterType.FLOOD,
    coords: { lat: -3.0160, lng: 104.7200 },
    severity: 'High',
    description: 'River level rising above threshold.',
  },
  {
    id: 'fl2',
    locationName: 'Kec. Lhoksukon, Aceh Utara',
    type: DisasterType.FLOOD,
    coords: { lat: 5.0500, lng: 97.3100 },
    severity: 'Medium',
    description: 'Heavy rainfall accumulation predicted.',
  },
  // LANDSLIDE (Tanah Longsor) - West Sumatra Highlands
  {
    id: 'l1',
    locationName: 'Kec. Lembah Anai, Sumatera Barat',
    type: DisasterType.LANDSLIDE,
    coords: { lat: -0.4700, lng: 100.3700 },
    severity: 'Critical',
    description: 'Soil saturation critical along main road.',
  },
  {
    id: 'l2',
    locationName: 'Kec. Liwa, Lampung Barat',
    type: DisasterType.LANDSLIDE,
    coords: { lat: -5.0300, lng: 104.0500 },
    severity: 'Medium',
    description: 'Unstable slope detected via satellite imagery.',
  },
  // WAVE (Ombak Tinggi) - West Coast
  {
    id: 'w1',
    locationName: 'Kec. Pesisir Selatan, Sumatera Barat',
    type: DisasterType.WAVE,
    coords: { lat: -1.5000, lng: 100.5000 },
    severity: 'High',
    description: 'Significant wave height > 4m predicted.',
  },
  {
    id: 'w2',
    locationName: 'Kec. Krui, Lampung',
    type: DisasterType.WAVE,
    coords: { lat: -5.1800, lng: 103.9300 },
    severity: 'High',
    description: 'Coastal erosion warning active.',
  }
];

export const MAP_TILE_LAYER = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
