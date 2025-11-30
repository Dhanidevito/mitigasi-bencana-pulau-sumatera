
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { DisasterType, RiskPoint } from '../types';
import { MOCK_RISK_DATA, SUMATRA_CENTER, DEFAULT_ZOOM, MAP_TILE_LAYER, MAP_ATTRIBUTION } from '../constants';

// Removed the 'DefaultIcon' prototype override which can cause crashes in some environments.
// We now explicitly use custom icons for all markers.

// Custom Icons for different disasters
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${color};"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

const WaterIcon = L.divIcon({
  className: 'water-icon',
  html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #3b82f6;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface DisasterMapProps {
  activeType: DisasterType;
  onSelectPoint: (point: RiskPoint) => void;
  selectedPointId?: string;
}

// Helper to update map view when selection changes
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 10, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const DisasterMap: React.FC<DisasterMapProps> = ({ activeType, onSelectPoint, selectedPointId }) => {
  
  const filteredData = MOCK_RISK_DATA.filter(d => d.type === activeType);
  const selectedPoint = MOCK_RISK_DATA.find(d => d.id === selectedPointId);

  const getColor = (type: DisasterType) => {
    switch (type) {
      case DisasterType.FIRE: return '#ef4444'; // Red
      case DisasterType.FLOOD: return '#3b82f6'; // Blue
      case DisasterType.LANDSLIDE: return '#eab308'; // Yellow
      case DisasterType.WAVE: return '#06b6d4'; // Cyan
      default: return '#ffffff';
    }
  };

  const getRadius = (severity: string) => {
    switch(severity) {
      case 'Critical': return 5000;
      case 'High': return 3500;
      case 'Medium': return 2000;
      default: return 1000;
    }
  }

  return (
    <MapContainer 
      center={SUMATRA_CENTER} 
      zoom={DEFAULT_ZOOM} 
      style={{ height: "100%", width: "100%", zIndex: 0, background: '#0f172a' }}
      zoomControl={false}
    >
      <TileLayer
        url={MAP_TILE_LAYER}
        attribution={MAP_ATTRIBUTION}
      />

      {filteredData.map((point) => (
        <React.Fragment key={point.id}>
          {/* Risk Zone Circle */}
          <Circle 
            center={[point.coords.lat, point.coords.lng]}
            radius={getRadius(point.severity)}
            pathOptions={{ 
              color: getColor(point.type), 
              fillColor: getColor(point.type), 
              fillOpacity: 0.2,
              weight: 1
            }}
          />

          {/* Main Risk Marker */}
          <Marker 
            position={[point.coords.lat, point.coords.lng]}
            icon={createCustomIcon(getColor(point.type))}
            eventHandlers={{
              click: () => onSelectPoint(point),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
              <div className="text-center">
                <span className="font-bold text-xs block">{point.locationName}</span>
                <span className="text-[10px] uppercase text-gray-500">{point.severity}</span>
              </div>
            </Tooltip>
          </Marker>

          {/* Special Feature: Water Sources for Fire */}
          {activeType === DisasterType.FIRE && point.details?.waterSources && selectedPointId === point.id && (
            point.details.waterSources.map((ws, idx) => (
               <Marker 
                key={`ws-${point.id}-${idx}`}
                position={[ws.lat, ws.lng]}
                icon={WaterIcon}
              >
                <Tooltip direction="bottom" offset={[0, 5]}>
                  <span className="text-xs font-semibold text-blue-600">Sumber Air</span>
                </Tooltip>
              </Marker>
            ))
          )}
        </React.Fragment>
      ))}

      {selectedPoint && (
        <MapUpdater center={[selectedPoint.coords.lat, selectedPoint.coords.lng]} />
      )}
    </MapContainer>
  );
};

export default DisasterMap;
