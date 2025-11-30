
import React, { useEffect, useState } from 'react';
import { RiskPoint, MitigationPlan } from '../types';
import { generateMitigationPlan } from '../services/geminiService';
import { AlertTriangle, Droplets, Mountain, Waves, Loader2, CheckCircle2, AlertOctagon, Info, Megaphone, Calendar, MessageSquare } from 'lucide-react';

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
      </div>
    );
  }

  const getIcon = () => {
    switch (point.type) {
      case 'FIRE': return <AlertTriangle className="text-red-500" />;
      case 'FLOOD': return <Droplets className="text-blue-500" />;
      case 'LANDSLIDE': return <Mountain className="text-yellow-500" />;
      case 'WAVE': return <Waves className="text-cyan-500" />;
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
              Terakhir Terjadi: {point.lastOccurrence}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-sm text-emerald-400/80 animate-pulse">Gemini 2.5 Flash sedang menganalisis data...</p>
          </div>
        ) : plan ? (
          <>
             {/* Title */}
             <div className="mb-2">
                <h3 className="text-lg font-semibold text-emerald-400">{plan.title}</h3>
                <p className="text-sm text-gray-400 mt-1 italic">"{plan.rawAnalysis}"</p>
             </div>

            {/* Social Media News (NEW) */}
            {plan.socialNews && plan.socialNews.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <MessageSquare size={16} />
                  <h3 className="font-bold text-xs uppercase tracking-wider">Update Media Sosial & Berita</h3>
                </div>
                <div className="space-y-2">
                  {plan.socialNews.map((news, i) => (
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
