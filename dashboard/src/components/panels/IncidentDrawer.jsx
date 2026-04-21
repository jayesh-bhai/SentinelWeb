import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { X, Code, Crosshair, Cpu, ShieldAlert, Target, History } from 'lucide-react';
import { format } from 'date-fns';

export default function IncidentDrawer({ alertId, onClose, recentAlerts, onSelectAlert }) {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (alertId) {
      setLoading(true);
      fetchDetails(alertId);
    }
  }, [alertId]);

  const fetchDetails = async (id) => {
    try {
      const res = await apiClient.get(`/alerts/${id}`);
      setAlert(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseSqliteDate = (ts) => {
    if (!ts) return new Date();
    if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('T')) {
      return new Date(ts.replace(' ', 'T') + 'Z');
    }
    return new Date(ts);
  };

  if (loading || !alert) {
    return (
      <div className="h-full bg-[#0b101e]/90 backdrop-blur-3xl border border-slate-800/80 shadow-2xl rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
        <div className="animate-spin text-blue-500 mb-4"><Target size={32} /></div>
        <div className="text-slate-500 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">Running Forensic Extraction...</div>
      </div>
    );
  }

  const { summary, context, evidence, detections, intelligence } = alert;

  const isCritical = summary.severity === 'CRITICAL' || summary.severity === 'HIGH';
  const severityColor = isCritical ? 'text-red-500' : 'text-orange-500';
  const severityBorder = isCritical ? 'border-red-500/30' : 'border-orange-500/30';
  const severityBg = isCritical ? 'bg-red-500/5' : 'bg-orange-500/5';
  
  return (
    <div className={`h-full bg-[#0b101e]/90 backdrop-blur-2xl border flex flex-col relative shadow-[inset_0_0_80px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl ${severityBorder}`}>
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none ${isCritical ? 'bg-red-500/10' : 'bg-orange-500/10'}`}></div>

      {/* Header */}
      <div className={`p-5 flex items-start justify-between border-b ${severityBorder} ${severityBg} relative z-10`}>
        <div className="flex gap-4">
           <div className={`mt-1 bg-black p-2 rounded-lg border border-slate-800 ${severityColor} ${isCritical ? 'shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : ''}`}>
              <ShieldAlert size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1">{summary.threat_type}</h2>
              <div className="flex items-center gap-2">
                 <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border border-slate-700/50 ${isCritical ? 'bg-red-950 text-red-500' : 'bg-orange-950 text-orange-400'}`}>
                    {summary.severity} RISK
                 </span>
                 <span className="text-slate-500 text-[10px] font-mono tracking-wider">{format(parseSqliteDate(context.timestamp), 'dd/MM/yyyy, HH:mm:ss')}</span>
              </div>
           </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
           <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 hover:scrollbar-thumb-slate-700">
        
        {/* Origin Target */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800/60">
           <span className="text-slate-500 text-[10px] font-mono tracking-[0.2em] uppercase flex items-center gap-2">
              <Target size={12} className="text-slate-400" /> Origin IP
           </span>
           <span className="text-blue-400 font-mono text-sm tracking-wider font-bold">{context.ip}</span>
        </div>

        {/* AI Analysis */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 flex gap-4 items-start shadow-inner">
            <Cpu className="text-blue-500/80 shrink-0 mt-0.5" size={18} />
            <div>
                <h4 className="text-blue-500/80 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Automated Analysis</h4>
                <p className="text-blue-100 text-xs leading-relaxed opacity-90">
                    {summary.explanation}
                </p>
            </div>
        </div>

        {/* Detection Vectors */}
        <div className="space-y-3">
            <h3 className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px] flex items-center gap-2">
                <Crosshair size={12} className="text-slate-400" /> Detection Vectors
            </h3>
            {detections.length === 0 && intelligence.signals.length === 0 && (
                <div className="text-xs text-slate-600 italic font-mono">No direct signals identified</div>
            )}
            {detections.map((det, i) => (
                <div key={i} className="bg-black/60 border border-slate-800 rounded-lg p-3 flex gap-3 items-center">
                    <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-900/50 rounded">RULE</span>
                    <span className="text-slate-300 text-xs">{det.description}</span>
                </div>
            ))}
            {intelligence.signals.filter(s => s.is_anomaly).map((sig, i) => (
                <div key={i} className="bg-black/60 border border-slate-800 rounded-lg p-3 flex gap-3 items-center shadow-[inset_2px_0_0_0_rgba(16,185,129,0.5)]">
                    <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded">BEHAVIOR</span>
                    <span className="text-slate-300 text-xs">{sig.label}: {sig.value} (Spike anomaly detected)</span>
                </div>
            ))}
        </div>

        {/* Captured Payload */}
        <div className="space-y-3">
            <h3 className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[10px] flex items-center gap-2">
                <Code size={12} className="text-slate-400" /> Captured Payload Evidence
            </h3>
            <div className="bg-[#05080f] rounded-xl border border-slate-800 overflow-hidden shadow-inner font-mono">
                <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <span className="text-slate-400 text-[10px]">{context.path}</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-red-400/90 text-[11px] leading-relaxed block overflow-x-auto whitespace-pre-wrap word-break-all">
                        {typeof evidence.payload === 'string' ? evidence.payload : JSON.stringify(evidence.payload, null, 2)}
                    </pre>
                </div>
            </div>
        </div>

      </div>

      {/* Historical Incidents Timeline footer */}
      <div className="bg-black border-t border-slate-800/80 p-4 relative z-10 shrink-0">
          <h3 className="text-slate-500 font-bold tracking-[0.2em] uppercase text-[9px] flex items-center gap-2 mb-3">
              <History size={12} className="text-slate-400" /> Recent Timeline
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
             {recentAlerts.map(rec => {
                 const isCrit = rec.severity === 'CRITICAL' || rec.severity === 'HIGH';
                 const isActive = rec.id === alertId;
                 return (
                 <div 
                   key={rec.id}
                   onClick={() => onSelectAlert(rec.id)}
                   className={`flex-shrink-0 w-40 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                     isActive 
                     ? 'bg-blue-900/20 border-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' 
                     : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80'
                   }`}
                 >
                     <div className="flex items-center justify-between mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCrit ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-[9px] font-mono text-slate-500">{format(parseSqliteDate(rec.timestamp), 'HH:mm:ss')}</span>
                     </div>
                     <div className={`text-[10px] font-bold tracking-wider uppercase truncate ${isActive ? 'text-blue-300' : 'text-slate-300'}`}>
                         {rec.detection?.type || 'UNKNOWN'}
                     </div>
                 </div>
                 )
             })}
          </div>
      </div>
    </div>
  );
}
