
import React, { useEffect, useState } from 'react';
import { RiskPoint, MitigationPlan } from '../types';
import { generateMitigationPlan } from '../services/geminiService';
import { AlertTriangle, Droplets, Mountain, Waves, Loader2, CheckCircle2, AlertOctagon, Info, Megaphone, Calendar, MessageSquare, Flame, ExternalLink, Activity, LifeBuoy, Satellite, BarChart3, CloudLightning, Users, Leaf, Wind } from 'lucide-react';

interface InfoPanelProps {
  point: RiskPoint | null;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ point, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<MitigationPlan | null>(null);

  useEffect(() => {
    if (point) {
      setLoading(true);
      generateMitigationPlan(point).then(result => {
        setPlan(result);
        setLoading(false);
      });
    } else {
      setPlan(null);
    }
  }, [point]);

  if (!point) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-gray-900 md:bg-transparent md:rounded-none rounded-t-2xl">
         {/* Mobile Handle */}
         <div className="md:hidden w-12 h-1.5 bg-gray-700 rounded-full mb-8" onClick={onClose}></div>

        <div className="bg-gray-800 p-4 rounded-full mb-4">
          <Info size={32} className="text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-300">Sistem Mitigasi Cerdas</h3>
        <p className="text-sm mt-2">Pilih titik hotspot pada peta untuk melihat analisis AI real-time dan rencana mitigasi.</p>
        
        {/* Dedication Card */}
        <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-xl max-w-xs">
          <div className="flex justify-center text-pink-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <p className="text-xs text-gray-400 italic leading-relaxed">
            "Aplikasi ini didedikasikan untuk korban bencana siklon di Utara Sumatera."
          </p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">
            MIT LICENSE • OPEN SOURCE
          </p>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    switch (point.type) {
      case 'FIRE': return <AlertTriangle className="text-red-500" />;
      case 'FLOOD': return <Droplets className="text-blue-500" />;
      case 'LANDSLIDE': return <Mountain className="text-yellow-500" />;
      case 'WAVE': return <Waves className="text-cyan-500" />;
      case 'VOLCANO': return <Flame className="text-orange-500" />;
      case 'EARTHQUAKE': return <Activity className="text-purple-500" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'Critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'High': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  const getSourceBadge = () => {
    let label = 'SIMULATION';
    let color = 'text-gray-400 border-gray-700 bg-gray-800';
    let icon = <Satellite size={10} />;

    if (point.source === 'BMKG') { label = 'BMKG INDONESIA'; color = 'text-green-400 border-green-800 bg-green-900/30'; icon = <Activity size={10} />; }
    else if (point.source === 'LAPAN') { label = 'LAPAN/BRIN (MODIS)'; color = 'text-orange-400 border-orange-800 bg-orange-900/30'; icon = <Flame size={10} />; }
    else if (point.source === 'SENTINEL') { label = 'COPERNICUS SENTINEL-1'; color = 'text-blue-400 border-blue-800 bg-blue-900/30'; icon = <Waves size={10} />; }
    else if (point.source === 'LANDSAT') { label = 'NASA LANDSAT 8/9'; color = 'text-emerald-400 border-emerald-800 bg-emerald-900/30'; icon = <Leaf size={10} />; }
    else if (point.source === 'USGS') { label = 'USGS GLOBAL'; color = 'text-purple-400 border-purple-800 bg-purple-900/30'; }
    else if (point.source === 'MODIS') { label = 'NASA MODIS'; color = 'text-red-400 border-red-800 bg-red-900/30'; icon = <Flame size={10} />; }
    else if (point.source === 'agency_api') { label = 'OFFICIAL API'; color = 'text-blue-200 border-blue-700 bg-blue-900/50'; }

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${color}`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white overflow-hidden md:rounded-none rounded-t-2xl">
      
      {/* Mobile Handle */}
      <div className="md:hidden w-full flex justify-center pt-3 pb-1 bg-gray-900 cursor-pointer" onClick={onClose}>
         <div className="w-12 h-1.5 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"></div>
      </div>

      {/* Header */}
      <div className="p-6 pt-2 md:pt-6 border-b border-gray-800 flex-shrink-0 bg-gray-900/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gray-800 rounded-lg">{getIcon()}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${getSeverityColor(point.severity)}`}>
              {point.severity.toUpperCase()}
            </span>
            {getSourceBadge()}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <h2 className="text-xl font-bold leading-tight">{point.locationName}</h2>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="text-xs text-gray-400 font-mono bg-black/20 p-1.5 rounded inline-flex items-center gap-1">
            DATA SATELIT: {point.coords.lat.toFixed(4)}, {point.coords.lng.toFixed(4)}
          </div>
          {point.lastOccurrence && (
            <div className="text-xs text-orange-300 font-sans bg-orange-900/20 border border-orange-500/20 p-1.5 rounded inline-flex items-center gap-1">
              <Calendar size={12} />
              {point.lastOccurrence}
            </div>
          )}
          {point.externalLink && (
            <a 
              href={point.externalLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-300 hover:text-white hover:underline font-sans bg-blue-900/20 border border-blue-500/20 p-1.5 rounded inline-flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={12} />
              Sumber Resmi
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        
        {/* NEW: Analytics & Fusion Dashboard */}
        {(point.riskScore !== undefined || point.forecast) && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700/50 shadow-inner">
             <div className="flex items-center gap-2 mb-3 text-emerald-400 border-b border-gray-700 pb-2">
                <BarChart3 size={16} />
                <h3 className="font-bold text-xs uppercase tracking-wider">Risk Analytics (Data Fusion)</h3>
             </div>
             <div className="grid grid-cols-2 gap-4">
                {point.riskScore !== undefined && (
                   <div className="bg-black/30 p-3 rounded-lg text-center">
                     <span className="text-[10px] text-gray-400 uppercase block mb-1">AI Risk Score</span>
                     <div className={`text-2xl font-bold ${point.riskScore > 75 ? 'text-red-500' : point.riskScore > 50 ? 'text-orange-500' : 'text-emerald-500'}`}>
                       {point.riskScore}<span className="text-sm font-normal text-gray-600">/100</span>
                     </div>
                   </div>
                )}
                <div className="bg-black/30 p-3 rounded-lg">
                   <div className="flex items-center gap-1 text-gray-400 mb-1">
                      <CloudLightning size={10} />
                      <span className="text-[10px] uppercase">NOAA GFS Weather</span>
                   </div>
                   <p className="text-xs text-blue-200">{point.forecast || "Data tidak tersedia"}</p>
                </div>
             </div>
             
             {/* Infrastructure Impact */}
             {point.impactDetails && (
               <div className="mt-3 pt-3 border-t border-gray-700/50">
                 <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-400"><Users size={12}/> Impact Analysis:</span>
                    <span className="text-gray-200">{point.impactDetails.distanceKm}km from {point.impactDetails.nearestCity}</span>
                 </div>
               </div>
             )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-sm text-emerald-400/80 animate-pulse">Gemini 2.5 Flash sedang menganalisis data...</p>
            <p className="text-xs text-gray-500">Mengambil konteks dari {point.source}...</p>
          </div>
        ) : plan ? (
          <>
             {/* Title */}
             <div className="mb-2">
                <h3 className="text-lg font-semibold text-emerald-400">{plan.title}</h3>
                <p className="text-sm text-gray-400 mt-1 italic">"{plan.rawAnalysis}"</p>
             </div>

            {/* Social Media News (NEW) */}
            {(plan.socialNews?.length > 0 || point.headlines?.length) && (
              <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <MessageSquare size={16} />
                  <h3 className="font-bold text-xs uppercase tracking-wider">Berita & Media Sosial</h3>
                </div>
                <div className="space-y-2">
                  {(point.headlines || []).map((head, i) => (
                     <div key={`head-${i}`} className="text-xs text-white font-bold bg-blue-900/30 p-2 rounded animate-pulse border border-blue-500/30">
                      [BREAKING] {head}
                     </div>
                  ))}
                  {plan.socialNews?.map((news, i) => (
                    <div key={i} className="text-xs text-gray-300 italic bg-black/20 p-2 rounded">
                      "{news}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Preventative (Before) */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-blue-400 border-b border-blue-500/30 pb-2">
                <CheckCircle2 size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Pra-Bencana (Pencegahan)</h3>
              </div>
              <ul className="space-y-2">
                {plan.preventativeMeasures.map((measure, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-blue-500 mt-0.5">•</span>
                    {measure}
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. During Disaster */}
            <div className="bg-red-950/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 text-red-400 animate-pulse">
                <Megaphone size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">SAAT KEJADIAN (RESPON AKTIF)</h3>
              </div>
              <ul className="space-y-2">
                {plan.duringDisasterActions?.map((action, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white font-medium">
                    <span className="text-red-500 font-bold">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Immediate Actions (After/Recovery) */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-yellow-400 border-b border-yellow-500/30 pb-2">
                <AlertOctagon size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wider">Pasca Kejadian (Pemulihan)</h3>
              </div>
              <ul className="space-y-2">
                {plan.immediateActions.map((action, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-yellow-500 mt-0.5">→</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. Survival Tips (Survival Kita) */}
            {plan.survivalTips && plan.survivalTips.length > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-3 text-emerald-400">
                  <LifeBuoy size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">Tips Survival & Lifehacks</h3>
                </div>
                <ul className="space-y-2">
                  {plan.survivalTips.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-200">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resource Allocation */}
            <div className="bg-gray-800 rounded-lg p-4 text-xs">
              <span className="text-gray-500 uppercase font-bold block mb-1">Logistik & Sumber Daya:</span>
              <p className="text-gray-300">{plan.resourceAllocation}</p>
            </div>
            
            {point.type === 'FIRE' && (
              <div className="mt-2 p-3 bg-blue-900/20 border border-blue-500/20 rounded text-xs text-blue-200 flex items-center gap-3">
                 <Droplets size={16} className="flex-shrink-0" />
                 <span>Info Saluran Air: Lihat titik biru pada peta untuk lokasi pengambilan air pemadaman (Water Bombing/Pompa).</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-red-400 p-4 border border-red-500/30 rounded bg-red-900/10">
            Gagal memuat data mitigasi.
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
