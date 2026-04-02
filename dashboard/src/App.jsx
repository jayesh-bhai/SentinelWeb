import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ShieldAlert, Activity } from 'lucide-react';

import LiveFeed from './pages/LiveFeed';
import AlertDetails from './pages/AlertDetails';
import { SessionProvider, useSession } from './contexts/SessionContext';

const Sidebar = () => {
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
      </nav>
      
      <div className="absolute bottom-8 left-0 w-full px-6">
        <div className="p-4 bg-slate-800/30 rounded border border-slate-700/30">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Engine Online</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Listening for anomalies...</p>
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
        <AppContent />
      </SessionProvider>
    </Router>
  );
}

export default App;
