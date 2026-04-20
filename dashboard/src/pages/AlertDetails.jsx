import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ArrowLeft, Server, Code, Activity, ShieldAlert, Crosshair, Cpu } from 'lucide-react';

export default function AlertDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await apiClient.get(`/alerts/${id}`);
      const fetchedAlert = res.data.data;
      setAlert(fetchedAlert);
      
      try {
        const behaviorRes = await apiClient.get(`/behaviors/${fetchedAlert.context.ip}`);
        setTimelineData(behaviorRes.data.data);
      } catch (e) {
        console.error(e);
        setTimelineData({ error: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!alert) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500 font-mono text-xs tracking-widest uppercase animate-pulse">Accessing Threat Archive...</div>;
  }

  const { summary, context, evidence, detections, intelligence } = alert;

  const isCritical = summary.severity === 'CRITICAL' || summary.severity === 'HIGH';
  const severityColor = isCritical ? 'text-red-500' : 'text-orange-500';
  const severityGlow = isCritical ? 'shadow-[0_0_30px_rgba(239,68,68,0.15)] border-red-500/50' : 'shadow-[0_0_30px_rgba(249,115,22,0.1)] border-orange-500/50';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-10 pb-16 px-6">
      <button 
        onClick={() => navigate('/')}
        className="text-slate-500 hover:text-white flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase transition-colors"
      >
        <ArrowLeft size={14} /> Back to Live Feed
      </button>

      <div className={`bg-[#0b101e]/80 backdrop-blur-xl border rounded-2xl overflow-hidden relative ${severityGlow}`}>
        
        {/* Sleek Top Banner */}
        <div className="bg-black/40 border-b border-slate-800/60 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-black border border-slate-800 ${severityColor} ${isCritical ? 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}>
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase font-sans">
                      {summary.threat_type}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${isCritical ? 'bg-red-950/50 text-red-400 border-red-900' : 'bg-orange-950/50 text-orange-400 border-orange-900'}`}>
                            {summary.severity} RISK
                        </span>
                        <span className="text-slate-500 text-xs font-mono tracking-wider">
                          {typeof context.timestamp === 'string' && !context.timestamp.includes('Z') && !context.timestamp.includes('T')
                            ? new Date(context.timestamp.replace(' ', 'T') + 'Z').toLocaleString()
                            : new Date(context.timestamp).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="text-right bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
               <div className="flex items-center justify-end gap-2 text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-1">
                  <Server size={12} /> Threat Origin
               </div>
               <div className="text-blue-400 font-black text-xl tracking-wider font-mono">{context.ip}</div>
            </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: 2/3 Width */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* AI Explanation Pill */}
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-5 flex gap-4 items-start">
                    <Cpu className="text-blue-500 shrink-0 mt-1" size={20} />
                    <div>
                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Automated Analysis</h4>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium">
                            {summary.explanation}
                        </p>
                    </div>
                </div>

                {/* Evidence Grid */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                      <h3 className="text-slate-500 font-bold tracking-[0.2em] uppercase mb-4 text-[10px] flex items-center gap-2">
                          <Crosshair size={14} className="text-slate-400" /> Detection Vectors
                      </h3>
                      <div className="space-y-3">
                         {detections.map((det, i) => (
                           <div key={i} className="bg-black/40 border border-slate-800 rounded-lg p-4 flex gap-4 items-center">
                              <span className="text-[10px] font-black tracking-widest px-2 py-1 bg-purple-950/50 text-purple-400 border border-purple-900 rounded">RULE</span>
                              <span className="text-slate-300 text-sm font-medium">{det.description}</span>
                           </div>
                         ))}
                         {intelligence.signals.filter(s => s.is_anomaly).map((sig, i) => (
                           <div key={i} className="bg-black/40 border border-slate-800 rounded-lg p-4 flex gap-4 items-center shadow-[inset_4px_0_0_0_rgba(16,185,129,0.5)]">
                              <span className="text-[10px] font-black tracking-widest px-2 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900 rounded">BEHAVIOR</span>
                              <span className="text-slate-300 text-sm font-medium">{sig.label}: {sig.value} (Spike anomaly detected)</span>
                           </div>
                         ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-slate-500 font-bold tracking-[0.2em] uppercase mb-4 text-[10px] flex items-center gap-2">
                          <Code size={14} className="text-slate-400" /> Captured Payload Evidence
                      </h3>
                      <div className="bg-black/80 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
                         <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-red-500"></div>
                             <span className="text-slate-400 text-xs font-mono">{context.path}</span>
                         </div>
                         <div className="p-4 overflow-x-auto">
                            <pre className="text-red-400/90 font-mono text-xs leading-relaxed">
                               {typeof evidence.payload === 'string' ? evidence.payload : JSON.stringify(evidence.payload, null, 2)}
                            </pre>
                         </div>
                      </div>
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN: 1/3 Width (Recent Activity) */}
            <div>
               <div className="bg-black/50 border border-slate-800/80 rounded-2xl h-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
                   <div className="p-5 border-b border-slate-800/60 bg-slate-900/20">
                      <h3 className="text-white font-black tracking-widest uppercase flex items-center gap-2 text-sm">
                         <Activity size={16} className={isCritical ? 'text-red-500 animate-pulse' : 'text-orange-500'} /> Recent Activity
                      </h3>
                   </div>

                   <div className="p-5 flex-1">
                      {!timelineData ? (
                         <div className="h-full flex items-center justify-center text-slate-500 font-mono text-[10px] tracking-[0.2em] uppercase animate-pulse">Syncing...</div>
                      ) : timelineData.error ? (
                         <div className="h-full flex items-center justify-center text-slate-600 font-mono text-[10px] tracking-[0.2em] text-center italic">State decayed (IP offline)</div>
                      ) : (
                         <div className="space-y-6">
                            
                            {/* Analytics Blocks */}
                            <div className="grid grid-cols-2 gap-3">
                               <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 text-center shadow-inner relative overflow-hidden">
                                  {timelineData.rolling_window?.aggregates?.[0]?.failed_auth > 0 && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></div>}
                                  <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Failed Logins</div>
                                  <div className={`text-4xl font-black font-sans tracking-tighter ${timelineData.rolling_window?.aggregates?.[0]?.failed_auth > 0 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-slate-300'}`}>
                                     {timelineData.rolling_window?.aggregates?.[0]?.failed_auth || 0}
                                  </div>
                               </div>
                               <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 text-center shadow-inner relative overflow-hidden">
                                  <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Max RPS</div>
                                  <div className="text-4xl font-black font-sans tracking-tighter text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                     {timelineData.rolling_window?.aggregates?.[0]?.max_rps || 0}
                                  </div>
                               </div>
                            </div>

                            {/* Sensor Log */}
                            <div className="bg-black/40 rounded-xl border border-slate-800/50 p-4">
                                <div className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-3 border-b border-slate-800/80 pb-2 flex justify-between">
                                   <span>Sensor Log</span>
                                   <span>(60s Window)</span>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                  {timelineData.timeline?.request_rate?.slice(0).reverse().slice(0, 10).map((req, i) => (
                                      <div key={i} className="flex justify-between text-[11px] font-mono items-center group">
                                         <span className="text-slate-600 group-hover:text-slate-400 transition-colors">[{new Date(req.ts).toLocaleTimeString()}]</span>
                                         <span className="text-slate-400 text-right group-hover:text-blue-300 transition-colors">
                                           {req.rps > 1 ? <span className="text-red-400 font-bold">{req.rps} REQ/s</span> : '1 REQ'}
                                         </span>
                                      </div>
                                  ))}
                                  {(!timelineData.timeline?.request_rate || timelineData.timeline.request_rate.length === 0) && (
                                     <div className="text-slate-600 text-[10px] italic text-center py-4">No granular timeline data</div>
                                  )}
                                </div>
                            </div>
                            
                         </div>
                      )}
                   </div>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
}
