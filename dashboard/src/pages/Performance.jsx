import React from 'react';
import { Activity, Shield, Server, TimerReset } from 'lucide-react';
import { useEngineStatus } from '../contexts/EngineStatusContext';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function MetricCard({ title, value, helper, accent = 'text-blue-400' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-slate-500">{title}</div>
      <div className={`mt-3 text-3xl font-black tracking-tight ${accent}`}>{value}</div>
      <div className="mt-2 text-xs font-mono uppercase tracking-widest text-slate-600">{helper}</div>
    </div>
  );
}

export default function Performance() {
  const { runtime, engine, loading } = useEngineStatus();

  if (loading) {
    return <div className="p-12 text-center font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Syncing backend telemetry...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_40%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500">System Telemetry</div>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white">Performance Grid</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Live backend agent summaries from the collector. Authentication, request health, and runtime pressure are mirrored here from the same telemetry that powers your terminal output.
            </p>
          </div>

          <div className={`rounded-xl border px-5 py-4 ${engine.tone === 'online' ? 'border-emerald-500/30 bg-emerald-950/20' : engine.tone === 'idle' ? 'border-amber-500/30 bg-amber-950/20' : 'border-red-500/30 bg-red-950/20'}`}>
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-slate-500">Engine Status</div>
            <div className={`mt-2 text-lg font-black uppercase tracking-[0.2em] ${engine.tone === 'online' ? 'text-emerald-400' : engine.tone === 'idle' ? 'text-amber-300' : 'text-red-400'}`}>
              {engine.statusLabel}
            </div>
            <div className="mt-2 text-xs font-mono uppercase tracking-widest text-slate-500">{engine.detailLabel}</div>
            <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-slate-600">
              Last report: {runtime?.last_reported_at ? new Date(runtime.last_reported_at).toLocaleTimeString() : 'Unavailable'}
            </div>
          </div>
        </div>
      </section>

      {!runtime ? (
        <section className="rounded-2xl border border-slate-800 bg-black/40 p-10 text-center">
          <Server size={44} className="mx-auto text-slate-600" />
          <h2 className="mt-5 text-2xl font-black uppercase tracking-[0.25em] text-slate-300">No Runtime Telemetry Yet</h2>
          <p className="mt-3 text-sm text-slate-500">
            Start the collector and your sandbox backend to populate live authentication, API, and performance metrics.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Login Attempts" value={runtime.authentication.totalLoginAttempts} helper="Total auth hits observed" accent="text-cyan-300" />
            <MetricCard title="Successful Logins" value={runtime.authentication.successfulLogins} helper="Confirmed sign-ins" accent="text-emerald-400" />
            <MetricCard title="Failed Logins" value={runtime.authentication.failedLogins} helper="Rejected credentials" accent="text-red-400" />
            <MetricCard title="Suspicious Logins" value={runtime.authentication.suspiciousLogins} helper="Flagged failed auth records" accent="text-amber-300" />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity size={18} className="text-blue-400" />
                <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">API Pressure</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard title="Total Requests" value={runtime.api.totalRequests} helper="Requests captured by backend agent" accent="text-blue-300" />
                <MetricCard title="Error Rate" value={`${runtime.api.errorRate}%`} helper="4xx/5xx across observed traffic" accent="text-orange-300" />
                <MetricCard title="Avg Response" value={`${runtime.api.avgResponseTime} ms`} helper="Average backend response" accent="text-cyan-300" />
                <MetricCard title="Rate Limit Hits" value={runtime.api.rateLimitHits} helper="Volumetric threshold triggers" accent="text-fuchsia-300" />
              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-black/30 p-5">
                <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-500">Top Endpoints</div>
                <div className="mt-4 space-y-3">
                  {runtime.api.topEndpoints.length === 0 ? (
                    <div className="text-sm text-slate-600">No endpoint telemetry yet.</div>
                  ) : runtime.api.topEndpoints.map((item) => (
                    <div key={item.endpoint} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-3">
                      <span className="font-mono text-sm text-slate-300">{item.endpoint}</span>
                      <span className="font-mono text-xs uppercase tracking-widest text-blue-400">{item.count} hits</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TimerReset size={18} className="text-emerald-400" />
                  <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">Runtime Health</h2>
                </div>
                <div className="grid gap-4">
                  <MetricCard title="Latency Avg" value={`${runtime.performance.average} ms`} helper={`P95 ${runtime.performance.p95} ms | P99 ${runtime.performance.p99} ms`} accent="text-emerald-300" />
                  <MetricCard title="Memory Usage" value={`${runtime.performance.memoryPercent}%`} helper={`Heap ${formatBytes(runtime.performance.heapUsedBytes)}`} accent="text-red-300" />
                  <MetricCard title="System Uptime" value={`${runtime.system.uptimeHours} h`} helper="Backend runtime since process start" accent="text-violet-300" />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield size={18} className="text-amber-300" />
                  <h2 className="text-xl font-black uppercase tracking-[0.18em] text-white">Recent Suspicious Logins</h2>
                </div>
                <div className="space-y-3">
                  {runtime.authentication.recentSuspiciousLogins.length === 0 ? (
                    <div className="text-sm text-slate-600">No suspicious login records yet.</div>
                  ) : runtime.authentication.recentSuspiciousLogins.map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="rounded-xl border border-slate-800 bg-black/35 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-sm text-slate-200">{item.username || 'unknown user'}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-amber-300">{item.ip}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">{item.reason || 'Unknown reason'}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
