import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { ArrowLeft, Code, Activity } from 'lucide-react';

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
      
      // Instantly load behavior context for the demo
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
    return <div className="p-12 text-slate-500 font-mono text-center">ACCESSING THREAT ARCHIVE...</div>;
  }

  const { summary, context, evidence, detections, intelligence } = alert;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-12 pb-12">
      <button 
        onClick={() => navigate('/')}
        className="text-slate-500 hover:text-white flex items-center gap-2 font-mono text-sm tracking-widest uppercase transition-colors"
      >
        <ArrowLeft size={16} /> Close Tracker
      </button>

      {/* CORE THREAT CARD */}
      <div className="bg-slate-900 border border-red-500/30 rounded-xl overflow-hidden shadow-2xl relative">
        <div className={`absolute top-0 left-0 w-2 h-full ${summary.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
        
        <div className="p-8 pl-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-1">
                  {summary.threat_type}
                </h1>
                <p className="text-lg text-slate-400 font-bold opacity-80">
                  {summary.explanation}
                </p>
              </div>
              <div className="text-right">
                <div className="text-slate-500 font-mono text-sm uppercase">Threat Origin</div>
                <div className="text-blue-400 font-black text-2xl tracking-widest">{context.ip}</div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
               {/* LEFT COLUMN: WHY & PAYLOAD */}
               <div className="flex-1 space-y-6">
                  <div>
                    <h3 className="text-slate-500 font-black tracking-widest uppercase mb-3 text-xs border-b border-slate-800 pb-2">Why Detected</h3>
                    <ul className="space-y-2 font-mono text-sm">
                      {detections.map((det, i) => (
                        <li key={i} className="flex gap-4">
                           <span className="text-purple-400 w-20">RULE</span>
                           <span className="text-slate-300">{det.description}</span>
                        </li>
                      ))}
                      {intelligence.signals.filter(s => s.is_anomaly).map((sig, i) => (
                         <li key={i} className="flex gap-4">
                           <span className="text-emerald-400 w-20">BEHAVIOR</span>
                           <span className="text-slate-300">{sig.label}: {sig.value} (Spike)</span>
                         </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-slate-500 font-black tracking-widest uppercase mb-3 text-xs border-b border-slate-800 pb-2 flex items-center gap-2">
                       <Code size={14} className="text-red-400" /> Captured Payload & Target
                    </h3>
                    <div className="bg-black p-4 rounded border border-slate-800 space-y-3">
                       <div>
                         <span className="text-slate-500 text-xs font-mono uppercase mr-2">URI:</span>
                         <span className="text-slate-300 font-mono text-sm">{context.path}</span>
                       </div>
                       <div>
                         <span className="text-slate-500 text-xs font-mono uppercase block mb-1">Raw Evidence:</span>
                         <pre className="text-red-300/80 font-mono text-xs overflow-x-auto selection:bg-red-500/30">
                           {typeof evidence.payload === 'string' ? evidence.payload : JSON.stringify(evidence.payload, null, 2)}
                         </pre>
                       </div>
                    </div>
                  </div>
               </div>

               {/* RIGHT COLUMN: INSTANT BEHAVIOR TIMELINE (Option A Implemented) */}
               <div className="w-full md:w-[400px]">
                  <div className="bg-black/60 border border-slate-800 rounded-lg p-5 h-full relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20"></div>
                     <h3 className="text-white font-black tracking-widest uppercase flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-red-500" /> Recent Activity
                     </h3>

                     {!timelineData ? (
                        <div className="text-slate-500 font-mono text-xs animate-pulse">Syncing local memory...</div>
                     ) : timelineData.error ? (
                        <div className="text-slate-500 font-mono text-xs italic">Volumetric state decayed (IP offline)</div>
                     ) : (
                        <div className="space-y-4 font-mono text-sm">
                           <div className="bg-slate-900/50 rounded border border-slate-800 p-3 space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-500">FAILED LOGINS:</span>
                                <span className="text-red-400 font-bold">{timelineData?.summary?.failed_logins || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">REQUEST RATE:</span>
                                <span className="text-orange-400 font-bold">
                                  {timelineData?.summary?.rate_multiplier ? `${timelineData.summary.rate_multiplier}x (HIGH)` : 'NORMAL'}
                                </span>
                              </div>
                           </div>

                           <div className="space-y-1">
                             <div className="text-slate-500 text-[10px] uppercase tracking-widest mb-2 border-b border-slate-800 pb-1">Sensor Log</div>
                             {timelineData.timeline?.request_rate?.slice(0, 5).map((req, i) => (
                                <div key={i} className="flex gap-4 text-xs font-mono group">
                                   <span className="text-slate-600">[{req.time}]</span>
                                   <span className="text-slate-400 group-hover:text-red-300 transition-colors">
                                     {req.count > 1 ? `${req.count} POST /api (burst)` : `POST /api`}
                                   </span>
                                </div>
                             ))}
                             {(!timelineData.timeline?.request_rate || timelineData.timeline.request_rate.length === 0) && (
                               <div className="text-slate-600 text-xs italic">No additional timeline data</div>
                             )}
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
