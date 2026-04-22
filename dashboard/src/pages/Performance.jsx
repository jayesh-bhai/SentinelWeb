import React from 'react';
import { Activity, Shield, Server, TimerReset, Zap, Cpu, MemoryStick as Memory, TrendingUp } from 'lucide-react';
import { useEngineStatus } from '../contexts/EngineStatusContext';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

// Custom lightweight sparkline component for cinematic trends
function Sparkline({ data, width = 200, height = 40, color = '#3b82f6' }) {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M 0,${height} L ${points} L ${width},${height} Z`}
        fill={`url(#grad-${color})`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
        className="animate-pulse"
      />
    </svg>
  );
}

function MetricCard({ title, value, helper, icon: Icon, accent = 'text-blue-400', history = [] }) {
  return (
    <div className="group relative rounded-2xl border border-slate-800/60 bg-slate-900/20 p-6 shadow-2xl transition-all hover:border-slate-700/80 hover:bg-slate-900/40">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-2xl" />
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            {Icon && <Icon size={12} className="opacity-70" />} {title}
          </div>
          <div className={`text-3xl font-black tracking-tight ${accent} group-hover:scale-105 transition-transform origin-left duration-500`}>
            {value}
          </div>
        </div>
        {history.length > 0 && (
          <div className="mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline data={history} color={accent.includes('blue') ? '#3b82f6' : accent.includes('emerald') ? '#10b981' : accent.includes('red') ? '#ef4444' : accent.includes('amber') ? '#f59e0b' : '#a855f7'} />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-600">
        <TrendingUp size={10} className="text-slate-700" /> {helper}
      </div>
    </div>
  );
}

export default function Performance() {
  const { runtime: telemetry, engine, loading } = useEngineStatus();

  // Handle both old and new telemetry formats
  const runtime = telemetry?.latest || telemetry;
  const history = telemetry?.history || [];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
        <div className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Cryptographic Telemetry...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-8 space-y-10">
      {/* Header Section */}
      <section className="relative group overflow-hidden rounded-3xl border border-slate-800/80 bg-[#090e17] p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-blue-400">
              <Zap size={12} className="fill-current" /> Live Neural Link Established
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
              Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">Analytics</span>
            </h1>
            <p className="max-w-xl text-slate-400 text-sm leading-relaxed font-medium">
              Real-time deep-packet inspection and runtime health monitoring. This telemetry is direct-bridged from the backend agent process every 30 seconds.
            </p>
          </div>

          <div className={`p-6 rounded-2xl border backdrop-blur-xl transition-all duration-500 ${
            engine.tone === 'online' ? 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : 
            engine.tone === 'idle' ? 'border-amber-500/30 bg-amber-500/5' : 
            'border-red-500/30 bg-red-500/5'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-3 h-3 rounded-full animate-ping ${
                engine.tone === 'online' ? 'bg-emerald-500' : engine.tone === 'idle' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">System State</div>
                <div className={`text-xl font-black uppercase tracking-widest ${
                  engine.tone === 'online' ? 'text-emerald-400' : engine.tone === 'idle' ? 'text-amber-300' : 'text-red-400'
                }`}>
                  {engine.statusLabel}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/50 space-y-3">
               <div className="flex justify-between items-center gap-8">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">Active Scan</span>
                  <span className="text-[9px] font-mono font-bold text-slate-300">{engine.detailLabel}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">Last Pulse</span>
                  <span className="text-[9px] font-mono font-bold text-blue-400">
                    {runtime?.last_reported_at ? new Date(runtime.last_reported_at).toLocaleTimeString() : 'WAITING...'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {!runtime ? (
        <section className="h-96 flex flex-col items-center justify-center rounded-3xl border border-slate-800/50 bg-black/20 p-10 text-center shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
            <Server size={32} className="text-slate-700 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-400">Awaiting Telemetry</h2>
          <p className="mt-4 max-w-sm text-sm text-slate-600 font-medium">
            No runtime data intercepted. The system will auto-populate as soon as the backend agent completes its next 30-second sync cycle.
          </p>
        </section>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Top Row: Auth Metrics */}
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
              title="Auth Pressure" 
              value={runtime.authentication.totalLoginAttempts} 
              helper="Observed login events" 
              icon={Zap}
              accent="text-blue-400"
              history={history.map(h => h.authentication.totalLoginAttempts)}
            />
            <MetricCard 
              title="Verified Access" 
              value={runtime.authentication.successfulLogins} 
              helper="Authorized sign-ins" 
              icon={Shield}
              accent="text-emerald-400"
              history={history.map(h => h.authentication.successfulLogins)}
            />
            <MetricCard 
              title="Security Refusal" 
              value={runtime.authentication.failedLogins} 
              helper="Credential rejection" 
              icon={Activity}
              accent="text-red-400"
              history={history.map(h => h.authentication.failedLogins)}
            />
             <MetricCard 
              title="Anomaly Flags" 
              value={runtime.authentication.suspiciousLogins} 
              helper="High-risk auth attempts" 
              icon={Shield}
              accent="text-amber-400"
              history={history.map(h => h.authentication.suspiciousLogins)}
            />
          </section>

          {/* Main Content Area */}
          <section className="grid gap-8 lg:grid-cols-3">
            {/* Left Col: API Insights */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity size={120} />
                </div>
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Traffic Matrix</h2>
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Request distribution and error health</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mb-10">
                  <MetricCard 
                    title="Total Requests" 
                    value={runtime.api.totalRequests} 
                    helper="Inbound API hits" 
                    accent="text-white"
                    history={history.map(h => h.api.totalRequests)}
                  />
                  <MetricCard 
                    title="Failure Rate" 
                    value={`${runtime.api.errorRate}%`} 
                    helper="4xx/5xx status percentage" 
                    accent="text-orange-500"
                    history={history.map(h => h.api.errorRate)}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 border-b border-slate-800 pb-3">Critical Endpoint Load</h3>
                  <div className="grid gap-3">
                    {runtime.api.topEndpoints.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-600 font-mono uppercase tracking-widest bg-black/20 rounded-xl border border-dashed border-slate-800">No endpoint data captured</div>
                    ) : runtime.api.topEndpoints.map((item, idx) => (
                      <div key={item.endpoint} className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/40 px-5 py-4 transition-all hover:bg-slate-900/40 hover:border-blue-500/30">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-slate-600 w-4">{idx + 1}.</span>
                          <span className="font-mono text-sm text-slate-200 group-hover:text-blue-400 transition-colors">{item.endpoint}</span>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-blue-500/60 transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (item.count / runtime.api.totalRequests) * 200)}%` }} 
                              />
                           </div>
                           <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blue-400/80">{item.count} CALLS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: System & Forensics */}
            <div className="space-y-8">
              {/* Runtime Health */}
              <section className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <TimerReset size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">System Vital</h2>
                  </div>
                </div>
                <div className="space-y-6">
                  <MetricCard 
                    title="Neural Latency" 
                    value={`${runtime.performance.average} ms`} 
                    helper={`P95: ${runtime.performance.p95}ms | P99: ${runtime.performance.p99}ms`} 
                    icon={Cpu}
                    accent="text-emerald-400"
                    history={history.map(h => h.performance.average)}
                  />
                  <MetricCard 
                    title="Memory Pressure" 
                    value={`${runtime.performance.memoryPercent}%`} 
                    helper={`Heap: ${formatBytes(runtime.performance.heapUsedBytes)}`} 
                    icon={Memory}
                    accent="text-red-400"
                    history={history.map(h => h.performance.memoryPercent)}
                  />
                  <div className="rounded-2xl border border-slate-800/60 bg-black/40 p-5 flex items-center justify-between group">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-1">Process Uptime</div>
                      <div className="text-xl font-black text-violet-400 group-hover:scale-110 transition-transform origin-left">{runtime.system.uptimeHours} Hours</div>
                    </div>
                    <Server size={24} className="text-slate-800 group-hover:text-violet-500/50 transition-colors" />
                  </div>
                </div>
              </section>

              {/* Forensic Log */}
              <section className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Risk Audit</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {runtime.authentication.recentSuspiciousLogins.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-700 font-mono uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-slate-800">Clear Audit Log</div>
                  ) : runtime.authentication.recentSuspiciousLogins.map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="group relative rounded-2xl border border-slate-800/60 bg-black/40 p-4 transition-all hover:bg-slate-900/40">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-200">{item.username || 'unknown'}</span>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20">{item.ip}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{item.reason || 'Anomalous pattern intercepted'}"</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
