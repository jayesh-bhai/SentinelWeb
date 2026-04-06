import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { ShieldCheck, Target, Activity } from 'lucide-react';
import { useEngineStatus } from '../../contexts/EngineStatusContext';

export default function ActiveAttackerPanel() {
  const [activeData, setActiveData] = useState({ count: 0, actors: [] });
  const { engine } = useEngineStatus();

  useEffect(() => {
    if (!engine.collectorOnline) {
      setActiveData({ count: 0, actors: [] });
      return undefined;
    }

    fetchActive();
    const interval = setInterval(fetchActive, 2000);
    return () => clearInterval(interval);
  }, [engine.collectorOnline]);

  const fetchActive = async () => {
    try {
      const res = await apiClient.get('/active-threats');
      setActiveData(res.data.data);
    } catch (e) {
      setActiveData({ count: 0, actors: [] });
      console.error(e);
    }
  };

  const isUnderAttack = activeData.count > 0;

  if (!isUnderAttack) {
    return (
      <div className="h-full bg-slate-900/20 border-2 border-slate-800/80 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-700 relative overflow-hidden">
        {/* Subtle background pulse for Idle state */}
        <div className="absolute inset-0 bg-blue-900/5 animate-[pulse_4s_ease-in-out_infinite]"></div>
        
        <ShieldCheck size={56} className="text-blue-500/60 mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
        <h3 className="text-blue-400 font-black uppercase tracking-[0.3em] text-lg mb-2">System Secure</h3>
          <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">No volumetric anomalies</p>
        
        <div className="absolute bottom-6 left-0 w-full flex justify-center">
           <div className={`flex items-center gap-2 bg-black/40 px-3 py-1 rounded border text-[10px] font-mono tracking-widest uppercase ${
             engine.tone === 'online'
               ? 'border-slate-800 text-slate-500'
               : engine.tone === 'idle'
                 ? 'border-amber-900/40 text-amber-300'
                 : 'border-red-900/40 text-red-300'
           }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                engine.tone === 'online'
                  ? 'bg-blue-500 animate-pulse'
                  : engine.tone === 'idle'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-500'
              }`}></div> {engine.detailLabel}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in zoom-in-95 slide-in-from-right-4 duration-300">
      <div className="bg-red-950/80 border-t-2 border-x-2 border-red-600 rounded-t-xl p-5 flex items-center justify-between shadow-[0_0_40px_rgba(239,68,68,0.3)] relative overflow-hidden">
        {/* Aggressive attack flash */}
        <div className="absolute inset-0 bg-red-500/10 animate-[pulse_1s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <Activity className="text-red-500 animate-pulse" size={24} />
          <h2 className="text-red-400 font-black tracking-widest uppercase text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            Active Attacks: {activeData.count}
          </h2>
        </div>
        <div className="px-3 py-1 bg-red-600/20 border border-red-500 text-red-500 font-bold font-mono text-xs rounded animate-[pulse_0.5s_ease-in-out_infinite] z-10 tracking-widest">
          🔴 ENGAGED
        </div>
      </div>

      <div className="flex-1 bg-black border-x-2 border-b-2 border-red-900/50 rounded-b-xl overflow-y-auto p-4 space-y-4 shadow-[inset_0_0_30px_rgba(239,68,68,0.05)]">
        {activeData.actors.map((actor, idx) => (
          <div key={idx} className="bg-black/50 border border-slate-800 rounded-lg p-4 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-red-400" />
                <span className="font-mono text-blue-400 font-bold">{actor.ip}</span>
              </div>
              <span className={`text-[10px] uppercase font-black px-2 py-1 rounded border ${actor.severity === 'CRITICAL' ? 'bg-red-900/40 text-red-500 border-red-800' : 'bg-orange-900/40 text-orange-400 border-orange-800'}`}>
                {actor.severity} RISK
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-slate-300 text-xs italic opacity-90 leading-tight">
                " {actor.reason} "
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <span className="text-slate-600 text-[9px] font-mono tracking-widest">
                LATEST: {new Date(actor.last_seen).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
