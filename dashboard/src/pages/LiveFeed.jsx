import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { apiClient } from '../api/client';
import { ShieldCheck, Zap } from 'lucide-react';
import ActiveAttackerPanel from '../components/panels/ActiveAttackerPanel';

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
      const res = await apiClient.get('/alerts?limit=50');
      setAlerts(res.data.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'text-purple-400 bg-purple-900/20 border-purple-800 animate-pulse';
      case 'HIGH': return 'text-red-400 bg-red-900/20 border-red-800';
      case 'MEDIUM': return 'text-orange-400 bg-orange-900/20 border-orange-800';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-800';
    }
  };

  const simplifyReason = (reason, type) => {
    if (!type) return 'Malicious payload intercepted';
    const t = type.toUpperCase();
    if (t.startsWith('SQLI')) return 'SQL Injection Detected';
    if (t.startsWith('XSS')) return 'Cross-Site Scripting Detected';
    if (t.includes('BRUTE_FORCE')) return 'Multiple Failed Logins';
    if (t.includes('RATE')) return 'Request Burst Detected';
    if (t.includes('SESSION_HIJACK')) return 'Session Hijack Attempt';
    if (reason && (reason.includes('ANOMALY') || reason.includes('anomaly'))) return 'Behavioral Anomaly Blocked';
    return 'Malicious payload intercepted';
  };

  return (
    <div className="h-full flex gap-8 py-2">
      {/* 70% Log Stream */}
      <div className="flex-[2] flex flex-col h-full border border-slate-800/50 rounded-xl bg-slate-900/20 shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3 opacity-90">
                <Zap className="text-blue-500 fill-blue-500/20" size={28} /> Defense Grid
              </h1>
              <p className="text-slate-500 text-xs font-mono mt-1 tracking-widest">REAL-TIME TRAFFIC INSPECTION</p>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-mono font-bold tracking-widest bg-black px-4 py-2 rounded-lg border border-slate-800">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div> FEED (2s)
          </div>
        </div>

        <div className="flex-1 bg-black rounded-lg border border-slate-800 overflow-hidden font-mono flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex text-slate-500 text-[10px] tracking-widest uppercase font-bold sticky top-0 z-10">
            <div className="w-28 shadow-sm">TIME</div>
            <div className="w-28">RISK</div>
            <div className="w-56">THREAT VECTOR</div>
            <div className="w-32">ORIGIN IP</div>
            <div className="flex-1 text-right">MITIGATION REASON</div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-black p-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600 font-mono text-xs uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
                  Initializing Sensors...
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full m-8 rounded-xl border border-blue-900/50 bg-gradient-to-b from-slate-900/20 to-blue-950/20 shadow-[inset_0_0_50px_rgba(30,58,138,0.1)]">
                 <ShieldCheck size={48} className="text-blue-500 mb-4 opacity-80" />
                 <h2 className="text-3xl font-black text-blue-400 tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                    System Secure
                 </h2>
                 <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
                    Continuous Monitoring Active
                 </p>
                 <div className="mt-8 flex items-center justify-center gap-2 text-emerald-500/70 text-[10px] font-mono tracking-widest bg-emerald-950/30 px-3 py-1 rounded border border-emerald-900/50">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    No anomalies detected
                 </div>
              </div>
            ) : (
              alerts.map((alert, index) => {
                // If it's the very first row and is high severity, flash it aggressively for demo impact
                const isNewCritical = index === 0 && (alert.severity === 'CRITICAL' || alert.severity === 'HIGH');
                
                return (
                  <div 
                    key={alert.id}
                    onClick={() => navigate(`/alerts/${alert.id}`)}
                    className={`flex items-center px-4 py-3 cursor-pointer transition-all border-b border-slate-800/40 last:border-0 group 
                      ${isNewCritical 
                        ? 'bg-red-950/50 border-l-4 border-l-red-500 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-900/60' 
                        : 'hover:bg-slate-900/80 hover:shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)] border-l-4 border-l-transparent'
                      }`}
                  >
                    <div className="w-28 text-slate-500 text-xs font-mono tracking-wider">
                      {format(new Date(alert.timestamp), 'HH:mm:ss.SSS')}
                    </div>
                    <div className="w-28">
                      <span className={`px-2 py-[2px] rounded text-[10px] tracking-widest font-black uppercase border ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className={`w-56 font-bold truncate text-xs uppercase transition-colors ${isNewCritical ? 'text-red-100' : 'text-slate-300 group-hover:text-white'}`}>
                      {alert.detection?.type || alert.threat_type || 'UNKNOWN'}
                    </div>
                    <div className={`w-32 font-bold text-xs opacity-90 transition-all ${isNewCritical ? 'text-red-300' : 'text-blue-400 group-hover:opacity-100'}`}>
                      {alert.ip}
                    </div>
                    <div className="flex-1 text-right max-w-full">
                      <span className={`px-3 py-1 rounded inline-block text-xs font-mono font-bold transition-all ${isNewCritical ? 'bg-red-900/60 text-red-200 border border-red-500/30' : 'bg-slate-900/80 text-slate-400 group-hover:text-slate-200 border border-slate-800'}`}>
                          {simplifyReason(alert.detection?.reasoning || '', alert.detection?.type || alert.threat_type)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 30% Active Tracker */}
      <div className="flex-[1] h-full">
        <ActiveAttackerPanel />
      </div>
    </div>
  );
}
