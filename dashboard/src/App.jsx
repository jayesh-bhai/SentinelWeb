import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ShieldAlert, Activity, Gauge, Monitor } from 'lucide-react';

import LiveFeed from './pages/LiveFeed';
import Performance from './pages/Performance';
import FrontendMetrics from './pages/FrontendMetrics';
import AlertDetails from './pages/AlertDetails';
import { SessionProvider } from './contexts/SessionContext';
import { EngineStatusProvider, useEngineStatus } from './contexts/EngineStatusContext';

const Sidebar = () => {
  const { engine } = useEngineStatus();
  const toneClasses = engine.tone === 'online'
    ? {
        dot: 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]',
        text: 'text-emerald-400',
        panel: 'bg-slate-800/30 border-slate-700/30'
      }
    : engine.tone === 'idle'
      ? {
          dot: 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.45)]',
          text: 'text-amber-300',
          panel: 'bg-amber-950/20 border-amber-900/30'
        }
      : {
          dot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.45)]',
          text: 'text-red-400',
          panel: 'bg-red-950/20 border-red-900/30'
        };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 absolute inset-y-0 left-0 shadow-2xl z-20">
      <div className="p-6">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-red-500 uppercase">
          <ShieldAlert size={24} /> SentinelWeb
        </h1>
        <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-mono font-bold">Live Threat Tracer</p>
      </div>
      <nav className="px-4 space-y-2 mt-4">
        <NavLink
          to="/"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-bold tracking-wide uppercase ${isActive ? 'bg-red-900/40 text-red-400 border border-red-900/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
        >
          <Activity size={18} /> Attack Feed
        </NavLink>
        <NavLink
          to="/performance"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-bold tracking-wide uppercase ${isActive ? 'bg-blue-900/30 text-blue-300 border border-blue-900/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
        >
          <Gauge size={18} /> Performance
        </NavLink>
        <NavLink
          to="/frontend-metrics"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm font-bold tracking-wide uppercase ${isActive ? 'bg-violet-900/30 text-violet-300 border border-violet-900/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
        >
          <Monitor size={18} /> Frontend Metrics
        </NavLink>
      </nav>
      
      <div className="absolute bottom-8 left-0 w-full px-6">
        <div className={`p-4 rounded border ${toneClasses.panel}`}>
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${toneClasses.dot}`}></div>
                <span className={`${toneClasses.text} text-xs font-bold uppercase tracking-widest`}>{engine.statusLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">{engine.detailLabel}</p>
        </div>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-50 relative font-sans overflow-hidden">
      <Sidebar />
      <main className="ml-64 h-screen overflow-y-auto">
        <Routes>
          <Route path="/" element={<LiveFeed />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/frontend-metrics" element={<FrontendMetrics />} />
          <Route path="/alerts/:id" element={<AlertDetails />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <SessionProvider>
        <EngineStatusProvider>
          <AppContent />
        </EngineStatusProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
