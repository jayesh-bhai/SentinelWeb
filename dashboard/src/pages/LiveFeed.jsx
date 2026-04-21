import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { apiClient } from '../api/client';
import { ShieldCheck, Zap } from 'lucide-react';
import IncidentDrawer from '../components/panels/IncidentDrawer';

export default function LiveFeed() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [lastTopAlertId, setLastTopAlertId] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 2000); // Polling every 2s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await apiClient.get('/alerts?limit=50');
      const fetchedAlerts = res.data.data;
      setAlerts(fetchedAlerts);
      
      if (fetchedAlerts.length > 0) {
        const latestInfo = fetchedAlerts[0];
        setLastTopAlertId(prev => {
           if (prev !== latestInfo.id) {
              if (latestInfo.severity === 'CRITICAL' || latestInfo.severity === 'HIGH') {
                 // Auto-open new High/Crit alerts natively instantly
                 setSelectedAlertId(latestInfo.id);
              }
           }
           return latestInfo.id;
        });
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity) => {
    switch(severity) {
      case 'CRITICAL': return 'text-purple-400 bg-purple-900/20 border-purple-800 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.3)]';
      case 'HIGH': return 'text-red-400 bg-red-900/20 border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
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
    if (reason && (reason.includes('ANOMALY') || reason.includes('anomaly') || type.includes('ANOMALY'))) return 'Behavioral Anomaly Blocked';
    return 'Malicious payload intercepted';
  };

  const parseSqliteDate = (ts) => {
    if (!ts) return new Date();
    if (typeof ts === 'string' && !ts.includes('Z') && !ts.includes('T')) {
      return new Date(ts.replace(' ', 'T') + 'Z');
    }
    return new Date(ts);
  };

  const isDrawerOpen = selectedAlertId !== null;

  return (
    <div className="h-full flex gap-6 py-2 relative overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
      
      {/* Dynamic Grid: 100% when drawer closed, 55% when open */}
      <div className={`flex flex-col h-full border border-slate-800/80 rounded-2xl bg-[#090e17] shadow-2xl p-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isDrawerOpen ? 'w-[55%]' : 'w-full'}`}>
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

        <div className="flex-1 bg-black/60 rounded-xl border border-slate-800/80 overflow-hidden font-mono flex flex-col shadow-inner">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex text-slate-500 text-[10px] tracking-widest uppercase font-bold sticky top-0 z-10 hidden sm:flex">
            <div className="w-28 shadow-sm">TIME</div>
            <div className="w-24">RISK</div>
            <div className="w-48">THREAT VECTOR</div>
            <div className="w-32">ORIGIN</div>
            {!isDrawerOpen && <div className="flex-1 text-right">MITIGATION REASON</div>}
          </div>
          
          <div className="flex-1 overflow-y-auto bg-black p-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600 font-mono text-xs uppercase tracking-widest">
                  <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
                  Initializing Sensors...
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full m-8 rounded-2xl border border-blue-900/50 bg-gradient-to-b from-slate-900/20 to-blue-950/20 shadow-[inset_0_0_50px_rgba(30,58,138,0.1)]">
                 <ShieldCheck size={48} className="text-blue-500 mb-4 opacity-80" />
                 <h2 className="text-3xl font-black text-blue-400 tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                    System Secure
                 </h2>
                 <p className="text-slate-500 font-mono text-xs tracking-widest uppercase">
                    Continuous Monitoring Active
                 </p>
              </div>
            ) : (
              alerts.map((alert, index) => {
                const isNewCritical = index === 0 && (alert.severity === 'CRITICAL' || alert.severity === 'HIGH');
                const isSelected = selectedAlertId === alert.id;
                
                return (
                  <div 
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`flex items-center px-4 py-3.5 cursor-pointer transition-all border-b border-slate-800/40 last:border-0 group 
                      ${isSelected ? 'bg-slate-800/40 border-l-4 border-l-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]' : 
                        isNewCritical && selectedAlertId === null
                        ? 'bg-red-950/40 border-l-4 border-l-red-500 animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)] hover:bg-red-900/60' 
                        : 'hover:bg-slate-900/80 hover:shadow-[inset_4px_0_0_0_rgba(59,130,246,0.5)] border-l-4 border-l-transparent'
                      }`}
                  >
                    <div className="w-28 text-slate-500 text-xs font-mono tracking-wider">
                      {format(parseSqliteDate(alert.timestamp), 'HH:mm:ss.SSS')}
                    </div>
                    <div className="w-24">
                      <span className={`px-2 py-[2px] rounded text-[10px] tracking-widest font-black uppercase border ${getSeverityStyle(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className={`w-48 font-bold truncate text-[11px] uppercase tracking-wider transition-colors pr-2 ${isNewCritical && !isSelected ? 'text-red-100' : 'text-slate-300 group-hover:text-white'} ${isSelected ? 'text-blue-100' : ''}`}>
                      {alert.detection?.type || alert.threat_type || 'UNKNOWN'}
                    </div>
                    <div className={`w-32 font-bold text-xs opacity-90 transition-all truncate ${isNewCritical && !isSelected ? 'text-red-300' : 'text-blue-400 group-hover:opacity-100'}`}>
                      {alert.ip}
                    </div>
                    {!isDrawerOpen && (
                      <div className="flex-1 text-right max-w-full">
                        <span className={`px-3 py-1 rounded inline-block text-[10px] tracking-wide font-mono font-bold transition-all ${isNewCritical && !isSelected ? 'bg-red-900/60 text-red-200 border border-red-500/30' : 'bg-slate-900/80 text-slate-400 group-hover:text-slate-200 border border-slate-800'}`}>
                            {simplifyReason(alert.detection?.reasoning || '', alert.detection?.type || alert.threat_type)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Sliding Drawer */}
      {isDrawerOpen && (
        <div className="w-[45%] h-full animate-in slide-in-from-right duration-500 fade-in ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform z-10 absolute right-6">
          <IncidentDrawer 
             alertId={selectedAlertId} 
             onClose={() => setSelectedAlertId(null)} 
             recentAlerts={alerts.slice(0, 10)}
             onSelectAlert={(id) => setSelectedAlertId(id)}
          />
        </div>
      )}
    </div>
  );
}

