import React, { useState, useEffect } from 'react';
import { DisasterType, RiskPoint } from './types';
import DisasterMap from './components/DisasterMap';
import InfoPanel from './components/InfoPanel';
import { fetchSatelliteData } from './services/satelliteService';
import { Flame, CloudRain, Mountain, Waves, Map as MapIcon, Menu, Satellite, RefreshCw, WifiOff, Clock, Wifi } from 'lucide-react';

// Connection Status Component for cleaner App code
const ConnectionStatusIndicator: React.FC<{
  isLoading: boolean;
  isLive: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}> = ({ isLoading, isLive, error, lastUpdated, onRefresh }) => {
  return (
    <div className="absolute top-20 right-4 md:top-8 md:right-24 z-[500] flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
            error
            ? 'bg-amber-900/90 border-amber-500 text-amber-200'
            : isLive 
            ? 'bg-red-900/90 border-red-500 text-red-100 animate-pulse' 
            : 'bg-blue-900/90 border-blue-500 text-blue-200'
        }`}>
            {error ? <WifiOff size={14} /> : isLive ? <Satellite size={14} /> : <Wifi size={14} />}
            <span>
              {isLoading ? 'SYNCING...' : error ? 'OFFLINE MODE' : isLive ? 'LIVE DATA' : 'SIMULATION'}
            </span>
        </div>
        <button 
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-1.5 bg-gray-900/80 border border-gray-600 rounded-full text-gray-300 transition-colors ${isLoading ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-800 hover:text-white'}`}
            title="Force Refresh"
        >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {/* Detail Bar */}
      <div className="bg-gray-950/90 backdrop-blur rounded px-3 py-1.5 text-[10px] text-gray-400 border border-gray-800 shadow-xl flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1.5">
          <Clock size={10} />
          <span>Last Check: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : '-'}</span>
        </div>
        {error && (
          <span className="text-amber-500 font-medium">Error: {error}</span>
        )}
        <span className="text-gray-600 italic">
          Source: {isLive ? 'NASA EONET' : 'Historical Archive'}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeType, setActiveType] = useState<DisasterType>(DisasterType.FIRE);
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [riskData, setRiskData] = useState<RiskPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    // Add artificial delay for UX if response is too fast during refresh
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));
    const dataPromise = fetchSatelliteData();
    
    const [_, result] = await Promise.all([minLoadTime, dataPromise]);
    
    setRiskData(result.data);
    setIsLive(result.source === 'satellite');
    
    // Logic: Only show error if we are stuck on simulation AND there was an actual error
    // If we just fell back to simulation because there were no events, that's not an error.
    if (result.error && result.source === 'simulation') {
      setConnectionError(result.error);
    } else {
      setConnectionError(null);
    }
    
    setLastUpdated(result.lastChecked);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Polling interval from env or default 60s
    const pollInterval = parseInt(process.env.REACT_APP_POLL_INTERVAL || '60000', 10);
    const intervalId = setInterval(() => {
      loadData();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, []);

  const handleSelectPoint = (point: RiskPoint) => {
    setSelectedPoint(point);
    if (window.innerWidth < 768) {
        setSidebarOpen(true); 
    }
  };

  const navItems = [
    { type: DisasterType.FIRE, label: 'Kebakaran', icon: <Flame size={20} />, color: 'bg-red-500' },
    { type: DisasterType.FLOOD, label: 'Banjir', icon: <CloudRain size={20} />, color: 'bg-blue-500' },
    { type: DisasterType.LANDSLIDE, label: 'Longsor', icon: <Mountain size={20} />, color: 'bg-yellow-500' },
    { type: DisasterType.WAVE, label: 'Ombak Tinggi', icon: <Waves size={20} />, color: 'bg-cyan-500' },
  ];

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] bg-gray-900/90 backdrop-blur border-b border-gray-800 p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MapIcon size={20} className="text-emerald-500" />
          <span className="tracking-tight">SUMATRA<span className="text-emerald-500">SENTINEL</span></span>
        </h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300 hover:text-white">
            <Menu size={24} />
        </button>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <DisasterMap 
          data={riskData}
          activeType={activeType} 
          onSelectPoint={handleSelectPoint} 
          selectedPointId={selectedPoint?.id}
        />

        {/* Connection Status Indicator */}
        <ConnectionStatusIndicator 
          isLoading={isLoading}
          isLive={isLive}
          error={connectionError}
          lastUpdated={lastUpdated}
          onRefresh={loadData}
        />

        {/* Floating Controls (Disaster Type Switcher) */}
        <div className="absolute top-20 md:top-8 left-4 md:left-8 z-[500] bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setActiveType(item.type);
                setSelectedPoint(null); 
              }}
              className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center ${
                activeType === item.type 
                  ? `${item.color} text-white shadow-lg scale-105` 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={item.label}
            >
              {item.icon}
              <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 shadow-xl z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Legend / Status Bar */}
        <div className="absolute bottom-24 md:bottom-6 left-4 md:left-8 z-[500] bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-300 pointer-events-none select-none hidden md:block shadow-lg">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Medium</span>
            <span className="ml-2 border-l border-gray-600 pl-3 text-emerald-400/80">
                System Operational
            </span>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Analysis Panel) */}
      <div 
        className={`
          fixed z-[1100] bg-gray-900 shadow-2xl transition-all duration-300 ease-in-out
          bottom-0 left-0 right-0 h-[60vh] rounded-t-2xl border-t border-gray-700
          md:relative md:inset-y-0 md:right-0 md:h-full md:rounded-none md:border-t-0 md:border-l md:border-gray-800
          ${isSidebarOpen 
            ? 'translate-y-0 md:w-[400px] md:translate-x-0' 
            : 'translate-y-full md:translate-y-0 md:w-0 md:overflow-hidden'
          }
        `}
      >
        <InfoPanel point={selectedPoint} onClose={() => {
            setSelectedPoint(null);
            if (window.innerWidth < 768) setSidebarOpen(false);
        }} />
        
        {/* Toggle Button for Desktop Sidebar Collapse */}
        <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex absolute top-1/2 -left-3 w-6 h-12 bg-gray-900 border border-gray-700 border-r-0 rounded-l-lg items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 shadow-md transition-colors"
            style={{ marginTop: '-24px' }}
        >
            {isSidebarOpen ? '›' : '‹'}
        </button>
      </div>
    </div>
  );
};

export default App;