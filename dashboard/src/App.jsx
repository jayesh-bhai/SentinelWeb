import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, ShieldAlert, Cpu } from 'lucide-react';

import Overview from './pages/Overview';
import LiveFeed from './pages/LiveFeed';
import AlertDetails from './pages/AlertDetails';
import BehaviorAnalytics from './pages/BehaviorAnalytics';
import { SessionProvider, useSession } from './contexts/SessionContext';

const Sidebar = () => {
  const { sessionId } = useSession();

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 absolute inset-y-0 left-0">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
          <ShieldAlert size={24} /> SentinelWeb
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">SIEM Engine Core</p>
      </div>
      <nav className="px-4 space-y-2 mt-4">
        <NavLink
          to="/"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
        >
          <LayoutDashboard size={20} /> Overview
        </NavLink>
        <NavLink
          to="/live"
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-red-600/20 text-red-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
        >
          <Activity size={20} /> Live Attack Feed
        </NavLink>
        <NavLink
          to={sessionId ? `/behavior/${sessionId}` : "/behavior"}
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-700/50'}`}
        >
          <Cpu size={20} /> {sessionId ? 'Behavior Analytics' : 'Diagnostics'}
        </NavLink>
      </nav>
    </div>
  );
};

function AppContent() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 relative font-sans">
      <Sidebar />
      <main className="ml-64 p-8 min-h-screen">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/live" element={<LiveFeed />} />
          <Route path="/alerts/:id" element={<AlertDetails />} />
          <Route path="/behavior" element={<div className="text-slate-400 p-8 border border-dashed border-slate-700 rounded-xl text-center">Select an active alert to view behavioral forensics.</div>} />
          <Route path="/behavior/:sessionId" element={<BehaviorAnalytics />} />
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
