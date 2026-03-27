import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Cpu, Activity } from 'lucide-react';

export default function Behavior() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/stats');
        setStats(res.data.data);
      } catch (err) {}
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="text-emerald-500" /> Behavioral Threat Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">Machine Learning Feature Extraction & State Correlation</p>
        </div>
      </div>
      
      <div className="bg-[#0a0f1c] border border-slate-700/50 rounded-lg p-8 text-center mt-12">
        <Activity size={48} className="text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-300 mb-2">Behavior Matrix Engine Active</h2>
        <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
           Behavioral analytics are currently mapped exclusively at the individual payload level (Review Alert Forensics) and evaluated automatically by the Fast-API Isolation Forest service. Global behavior correlation logic requires Redis array clustering.
        </p>
        
        {stats && stats.threat_metrics.top_attackers.length > 0 && (
          <div className="mt-8 max-w-md mx-auto text-left bg-slate-800/50 p-6 rounded border border-slate-700/80">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">High-Risk Profiles (Last 24h)</h3>
            {stats.threat_metrics.top_attackers.map((actor, idx) => (
               <div key={idx} className="flex justify-between border-b border-slate-700/50 pb-2 mb-2 font-mono text-sm last:border-0 last:mb-0 last:pb-0">
                  <span className="text-blue-400">{actor.ip}</span>
                  <span className="text-red-400">{actor.severity}</span>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
