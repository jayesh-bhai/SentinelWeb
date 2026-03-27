import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { LayoutDashboard, Activity, ShieldAlert, Crosshair, Users, ShieldX } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading Sentinel API Metrics...</div>;
  }

  // Transform distribution object for Recharts
  const distributionData = Object.keys(stats.threat_metrics.distribution).map(key => ({
    name: key.replace('_001', '').replace('_', ' '), 
    count: stats.threat_metrics.distribution[key]
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" /> SentinelWeb Overview
          </h1>
          <p className="text-slate-400 text-sm mt-1">Unified Security Intelligence & SIEM Aggregation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">1 Hour Trajectory</p>
              <h3 className="text-3xl font-bold mt-2">{stats.threat_metrics.total_1h}</h3>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400 border border-blue-900">
               <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">24 Hour Volume</p>
              <h3 className="text-3xl font-bold mt-2">{stats.threat_metrics.total_24h}</h3>
            </div>
            <div className="p-3 bg-purple-900/20 rounded-lg text-purple-400 border border-purple-900">
               <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Threat Scopes</p>
              <h3 className="text-3xl font-bold mt-2 text-red-400">{stats.threat_metrics.active_threat_actors}</h3>
            </div>
            <div className="p-3 bg-red-900/20 rounded-lg text-red-400 border border-red-900">
               <Crosshair size={24} />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Primary Target Origin</p>
              <h3 className="text-xl font-mono mt-2 truncate text-amber-400">
                {stats.threat_metrics.top_attackers.length > 0 ? stats.threat_metrics.top_attackers[0].ip : 'N/A'}
              </h3>
            </div>
            <div className="p-3 bg-amber-900/20 rounded-lg text-amber-400 border border-amber-900">
               <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <ShieldX className="text-slate-400" /> Attack Vector Distribution (24h)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} 
                  itemStyle={{ color: '#f8fafc' }}
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
          <h2 className="text-lg font-bold mb-6">Highest Threat Origins</h2>
          <div className="space-y-4">
            {stats.threat_metrics.top_attackers.length === 0 ? (
               <div className="text-slate-500 text-sm text-center py-8">No malicious origins tracked recently.</div>
            ) : (
               stats.threat_metrics.top_attackers.map((actor, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
                   <div>
                     <div className="font-mono text-blue-400 text-sm">{actor.ip}</div>
                     <div className="text-xs text-slate-500 mt-1">{actor.count} Payloads Blocked</div>
                   </div>
                   <div className="text-right">
                     <span className={`text-xs font-bold px-2 py-1 rounded border ${actor.severity === 'CRITICAL' || actor.severity === 'HIGH' ? 'bg-red-900/20 text-red-400 border-red-800' : 'bg-orange-900/20 text-orange-400 border-orange-800'}`}>
                       {actor.severity}
                     </span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
