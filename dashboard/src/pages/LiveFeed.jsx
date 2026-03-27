import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { apiClient } from '../api/client';
import { Activity, ShieldCheck } from 'lucide-react';

export default function LiveFeed() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000); // Polling every 2s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/alerts?limit=100');
      setAlerts(res.data.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'text-purple-400 bg-purple-900/20 border-purple-800';
      case 'HIGH': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'MEDIUM': return 'text-orange-400 bg-orange-900/20 border-orange-800';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-red-500" /> Live Threat Stream
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time ingestion pipeline from SentinelWeb Core Engine</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono bg-emerald-900/20 px-3 py-1 rounded border border-emerald-800">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          STREAM ACTIVE
        </div>
      </div>

      <div className="bg-[#0a0f1c] rounded-lg border border-slate-800 shadow-2xl overflow-hidden font-mono text-sm leading-relaxed">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex text-slate-500 text-xs tracking-wider">
          <div className="w-24">TIMESTAMP</div>
          <div className="w-28">SEVERITY</div>
          <div className="w-20">SOURCE</div>
          <div className="w-48">THREAT SIGNATURE</div>
          <div className="w-40">ACTOR IP</div>
          <div className="flex-1">TARGET VECTOR</div>
        </div>
        
        <div className="max-h-[750px] overflow-y-auto p-2">
          {loading ? (
            <div className="text-slate-500 p-4 text-center">Initializing secure socket connection...</div>
          ) : alerts.length === 0 ? (
            <div className="text-slate-500 p-4 text-center flex items-center justify-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> No active threats detected in queue.
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => navigate(`/alerts/${alert.id}`)}
                className="flex items-center px-2 py-2.5 hover:bg-slate-800/50 cursor-pointer rounded transition-colors group border-b border-slate-800/50 last:border-0"
              >
                <div className="w-24 text-slate-500">
                  [{format(new Date(alert.timestamp), 'HH:mm:ss')}]
                </div>
                <div className="w-28">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="w-20">
                   {alert.source === 'HYBRID' ? (
                     <span className="text-emerald-400 bg-emerald-900/20 px-1.5 py-0.5 rounded text-xs border border-emerald-800">ML/AI</span>
                   ) : (
                     <span className="text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded text-xs border border-slate-700">RULE</span>
                   )}
                </div>
                <div className="w-48 text-slate-300 font-semibold group-hover:text-white transition-colors">
                  {alert.threat_type}
                </div>
                <div className="w-40 text-blue-400/80">
                  {alert.ip}
                </div>
                <div className="flex-1 text-slate-400 truncate pr-4">
                  {alert.path || '/unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
