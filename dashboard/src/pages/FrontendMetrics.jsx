import React, { useState, useEffect } from 'react';
import { Activity, MousePointer2, Keyboard, Scroll, FormInput, Clock, Zap, Monitor, Shield, AlertTriangle, Globe, TrendingUp, AlertCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

function formatDuration(ms) {
  if (!ms || ms === 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function getPerformanceColor(value, type) {
  const thresholds = {
    loadTime: { good: 1000, needsImprovement: 2500 },
    domContentLoaded: { good: 800, needsImprovement: 1500 },
    firstContentfulPaint: { good: 1000, needsImprovement: 1800 },
    largestContentfulPaint: { good: 2500, needsImprovement: 4000 }
  };
  
  const t = thresholds[type];
  if (!t) return 'text-slate-400';
  if (value <= t.good) return 'text-emerald-400';
  if (value <= t.needsImprovement) return 'text-amber-400';
  return 'text-red-400';
}

function getSeverityIcon(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'border-red-500/50 bg-red-500/5';
    case 'high': return 'border-orange-500/50 bg-orange-500/5';
    case 'medium': return 'border-amber-500/50 bg-amber-500/5';
    case 'low': return 'border-blue-500/50 bg-blue-500/5';
    default: return 'border-slate-700/50 bg-slate-800/20';
  }
}

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

export default function FrontendMetrics() {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTelemetry = async () => {
      try {
        const response = await apiClient.get('/runtime/frontend');
        if (!cancelled) {
          setTelemetry(response.data.data.latest);
          setHistory(response.data.data.history);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.response?.status === 404) {
            setError('AWAITING_TELEMETRY');
          } else {
            setError('FETCH_FAILED');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-violet-500 animate-spin"></div>
        <div className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Frontend Telemetry...</div>
      </div>
    );
  }

  if (error === 'AWAITING_TELEMETRY') {
    return (
      <div className="max-w-7xl mx-auto py-10 px-8">
        <section className="h-96 flex flex-col items-center justify-center rounded-3xl border border-slate-800/50 bg-black/20 p-10 text-center shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
            <Monitor size={32} className="text-slate-700 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-slate-400">Awaiting Frontend Telemetry</h2>
          <p className="mt-4 max-w-sm text-sm text-slate-600 font-medium">
            No frontend agent data received yet. The system will auto-populate as soon as the frontend agent completes its next 30-second sync cycle.
          </p>
        </section>
      </div>
    );
  }

  if (!telemetry) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-8 space-y-10">
      {/* Header Section */}
      <section className="relative group overflow-hidden rounded-3xl border border-slate-800/80 bg-[#090e17] p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/5 blur-[100px] rounded-full" />
        
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-violet-400">
              <Monitor size={12} className="fill-current" /> Browser-Side Monitoring Active
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white">
              Frontend <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Telemetry</span>
            </h1>
            <p className="max-w-xl text-slate-400 text-sm leading-relaxed font-medium">
              Real-time browser performance, user behavior analytics, and client-side security monitoring. Data collected every 30 seconds from the frontend agent.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.05)]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-violet-500 animate-ping" />
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Session Active</div>
                <div className="text-xl font-black uppercase tracking-widest text-violet-400">LIVE</div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/50 space-y-3">
               <div className="flex justify-between items-center gap-8">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">Session ID</span>
                  <span className="text-[9px] font-mono font-bold text-slate-300">{telemetry.sessionId}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">Duration</span>
                  <span className="text-[9px] font-mono font-bold text-violet-400">{formatDuration(telemetry.sessionDuration)}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-widest">Last Update</span>
                  <span className="text-[9px] font-mono font-bold text-blue-400">
                    {telemetry.last_reported_at ? new Date(telemetry.last_reported_at).toLocaleTimeString() : 'WAITING...'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Behavior Metrics */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Mouse Clicks" 
          value={telemetry.userBehavior.mouseClicks} 
          helper="Total click events" 
          icon={MousePointer2}
          accent="text-violet-400"
          history={history.map(h => h.userBehavior.mouseClicks)}
        />
        <MetricCard 
          title="Form Interactions" 
          value={telemetry.userBehavior.formInteractions} 
          helper="Input/change events" 
          icon={FormInput}
          accent="text-blue-400"
          history={history.map(h => h.userBehavior.formInteractions)}
        />
        <MetricCard 
          title="Scroll Events" 
          value={telemetry.userBehavior.scrollEvents} 
          helper="Page scroll actions" 
          icon={Scroll}
          accent="text-emerald-400"
          history={history.map(h => h.userBehavior.scrollEvents)}
        />
        <MetricCard 
          title="Idle Time" 
          value={formatDuration(telemetry.userBehavior.idleTime)} 
          helper="User inactivity duration" 
          icon={Clock}
          accent="text-amber-400"
          history={history.map(h => h.userBehavior.idleTime)}
        />
      </section>

      {/* Main Content Area */}
      <section className="grid gap-8 lg:grid-cols-3">
        {/* Left Col: Performance & Page Metrics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Browser Performance */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap size={120} />
            </div>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Browser Performance</h2>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Runtime metrics and resource utilization</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <MetricCard 
                title="Memory Usage" 
                value={`${telemetry.performance.memoryUsage}%`} 
                helper="JS heap utilization" 
                accent="text-blue-400"
                history={history.map(h => h.performance.memoryUsage)}
              />
              <MetricCard 
                title="Network Latency" 
                value={`${telemetry.performance.networkLatency} ms`} 
                helper="Connection RTT" 
                accent="text-emerald-400"
                history={history.map(h => h.performance.networkLatency)}
              />
              <MetricCard 
                title="Render Time" 
                value={`${telemetry.performance.renderTime} ms`} 
                helper="Frame rendering" 
                accent="text-fuchsia-400"
                history={history.map(h => h.performance.renderTime)}
              />
              <MetricCard 
                title="JS Execution" 
                value={`${telemetry.performance.jsExecutionTime} ms`} 
                helper="Script processing" 
                accent="text-amber-400"
                history={history.map(h => h.performance.jsExecutionTime)}
              />
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Core Web Vitals</h2>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">Page load performance metrics</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/40 px-5 py-4 transition-all hover:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className={getPerformanceColor(telemetry.pageMetrics.loadTime, 'loadTime')} />
                  <span className="font-mono text-sm text-slate-200">Page Load Time</span>
                </div>
                <div className="flex items-center gap-6">
                   <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          telemetry.pageMetrics.loadTime <= 1000 ? 'bg-emerald-500/60' :
                          telemetry.pageMetrics.loadTime <= 2500 ? 'bg-amber-500/60' : 'bg-red-500/60'
                        }`} 
                        style={{ width: `${Math.min(100, (telemetry.pageMetrics.loadTime / 3000) * 100)}%` }} 
                      />
                   </div>
                   <span className={`font-mono text-sm font-bold ${getPerformanceColor(telemetry.pageMetrics.loadTime, 'loadTime')}`}>
                     {telemetry.pageMetrics.loadTime} ms
                   </span>
                </div>
              </div>

              <div className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/40 px-5 py-4 transition-all hover:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className={getPerformanceColor(telemetry.pageMetrics.domContentLoaded, 'domContentLoaded')} />
                  <span className="font-mono text-sm text-slate-200">DOM Content Loaded</span>
                </div>
                <span className={`font-mono text-sm font-bold ${getPerformanceColor(telemetry.pageMetrics.domContentLoaded, 'domContentLoaded')}`}>
                  {telemetry.pageMetrics.domContentLoaded} ms
                </span>
              </div>

              <div className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/40 px-5 py-4 transition-all hover:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className={getPerformanceColor(telemetry.pageMetrics.firstContentfulPaint, 'firstContentfulPaint')} />
                  <span className="font-mono text-sm text-slate-200">First Contentful Paint</span>
                </div>
                <span className={`font-mono text-sm font-bold ${getPerformanceColor(telemetry.pageMetrics.firstContentfulPaint, 'firstContentfulPaint')}`}>
                  {telemetry.pageMetrics.firstContentfulPaint} ms
                </span>
              </div>

              <div className="group flex items-center justify-between rounded-xl border border-slate-800/60 bg-black/40 px-5 py-4 transition-all hover:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className={getPerformanceColor(telemetry.pageMetrics.largestContentfulPaint, 'largestContentfulPaint')} />
                  <span className="font-mono text-sm text-slate-200">Largest Contentful Paint</span>
                </div>
                <span className={`font-mono text-sm font-bold ${getPerformanceColor(telemetry.pageMetrics.largestContentfulPaint, 'largestContentfulPaint')}`}>
                  {telemetry.pageMetrics.largestContentfulPaint} ms
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Security, Errors & Network */}
        <div className="space-y-8">
          {/* Security Events */}
          <section className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Security Events</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">{telemetry.security.totalEvents} total events</p>
              </div>
            </div>
            <div className="space-y-4">
              {telemetry.security.totalEvents === 0 ? (
                <div className="py-12 text-center text-xs text-slate-700 font-mono uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-slate-800">No Security Events</div>
              ) : telemetry.security.recentEvents.map((event, index) => (
                <div key={`${event.timestamp}-${index}`} className={`group relative rounded-xl border p-4 transition-all ${getSeverityColor(event.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-slate-200">{event.type}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-slate-700/50 bg-slate-800/50 text-slate-400">{event.severity}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed italic">"{event.description}"</div>
                </div>
              ))}
            </div>
          </section>

          {/* Error Tracking */}
          <section className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Error Tracking</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">{telemetry.errors.totalErrors} errors detected</p>
              </div>
            </div>
            <div className="space-y-4">
              {telemetry.errors.totalErrors === 0 ? (
                <div className="py-12 text-center text-xs text-slate-700 font-mono uppercase tracking-widest bg-black/20 rounded-2xl border border-dashed border-slate-800">No Errors Detected</div>
              ) : telemetry.errors.recentErrors.slice(0, 5).map((err, index) => (
                <div key={`${err.timestamp}-${index}`} className="group relative rounded-xl border border-slate-800/60 bg-black/40 p-4 transition-all hover:bg-slate-900/40">
                  <div className="flex items-center gap-2 mb-2">
                    {err.type === 'javascript' && <XCircle size={12} className="text-red-500" />}
                    {err.type === 'network' && <Globe size={12} className="text-orange-500" />}
                    {err.type === 'resource' && <AlertCircle size={12} className="text-amber-500" />}
                    <span className="font-mono text-[11px] font-bold text-slate-200 uppercase">{err.type}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed">{err.message}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Network Activity */}
          <section className="rounded-3xl border border-slate-800/80 bg-[#090e17] p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Globe size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Network Activity</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-slate-800/60 bg-black/40 p-4 text-center">
                  <div className="text-[9px] font-mono uppercase text-slate-500 mb-1">Total Requests</div>
                  <div className="text-2xl font-black text-blue-400">{telemetry.network.totalRequests}</div>
                </div>
                <div className="rounded-xl border border-slate-800/60 bg-black/40 p-4 text-center">
                  <div className="text-[9px] font-mono uppercase text-slate-500 mb-1">Avg Response</div>
                  <div className="text-2xl font-black text-emerald-400">{telemetry.network.avgResponseTime} ms</div>
                </div>
              </div>
              {telemetry.network.failedRequests > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-red-400">Failed Requests (4xx/5xx)</span>
                  <span className="text-sm font-black text-red-400">{telemetry.network.failedRequests}</span>
                </div>
              )}
              {telemetry.network.slowRequests > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400">Slow Requests (&gt;1s)</span>
                  <span className="text-sm font-black text-amber-400">{telemetry.network.slowRequests}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
