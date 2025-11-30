import React, { useState } from 'react';
import { DisasterType, RiskPoint } from './types';
import DisasterMap from './components/DisasterMap';
import InfoPanel from './components/InfoPanel';
import { Flame, CloudRain, Mountain, Waves, Map as MapIcon, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeType, setActiveType] = useState<DisasterType>(DisasterType.FIRE);
  const [selectedPoint, setSelectedPoint] = useState<RiskPoint | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleSelectPoint = (point: RiskPoint) => {
    setSelectedPoint(point);
    if (window.innerWidth < 768) {
        setSidebarOpen(true); // Auto open sidebar on mobile when clicked
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
      <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] bg-gray-900/90 backdrop-blur border-b border-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MapIcon size={20} className="text-emerald-500" />
          <span className="tracking-tight">SUMATRA<span className="text-emerald-500">SENTINEL</span></span>
        </h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-300">
            <Menu size={24} />
        </button>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        <DisasterMap 
          activeType={activeType} 
          onSelectPoint={handleSelectPoint} 
          selectedPointId={selectedPoint?.id}
        />

        {/* Floating Controls (Disaster Type Switcher) */}
        <div className="absolute top-20 md:top-8 left-4 md:left-8 z-[500] bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-2xl p-2 shadow-2xl flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setActiveType(item.type);
                setSelectedPoint(null); // Deselect when changing layer
              }}
              className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center justify-center ${
                activeType === item.type 
                  ? `${item.color} text-white shadow-lg scale-105` 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
              title={item.label}
            >
              {item.icon}
              {/* Tooltip for desktop */}
              <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Legend / Status Bar */}
        <div className="absolute bottom-6 left-4 md:left-8 z-[500] bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg px-4 py-2 text-xs text-gray-300 pointer-events-none select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Medium</span>
            <span className="ml-2 border-l border-gray-600 pl-3">Simulasi Data Satelit Real-time</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Analysis Panel) */}
      <div 
        className={`fixed md:relative inset-y-0 right-0 w-full md:w-[400px] bg-gray-900 border-l border-gray-800 shadow-2xl z-[1100] transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'
        }`}
      >
        <InfoPanel point={selectedPoint} onClose={() => {
            setSelectedPoint(null);
            if (window.innerWidth < 768) setSidebarOpen(false);
        }} />
        
        {/* Toggle Button for Desktop Sidebar Collapse */}
        <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex absolute top-1/2 -left-3 w-6 h-12 bg-gray-900 border border-gray-700 border-r-0 rounded-l-lg items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800"
            style={{ marginTop: '-24px' }}
        >
            {isSidebarOpen ? '›' : '‹'}
        </button>
      </div>
    </div>
  );
};

export default App;
