import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { format } from 'date-fns';
import { ShieldAlert, ArrowLeft, Target, Fingerprint, Activity, Code, HardDrive, BrainCircuit } from 'lucide-react';
import { useSession } from '../contexts/SessionContext';

export default function AlertDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateSession } = useSession();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/alerts/${id}`);
        const data = res.data.data;
        setAlert(data);
        // Sync this session back to correctly link the behavior analytics
        if (data.context?.ip) {
          updateSession(data.context.ip);
        }
      } catch (err) {
        console.error("Failed to fetch alert details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, updateSession]);

  if (loading || !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-mono text-sm animate-pulse">RECONSTRUCTING FORENSIC DATASET...</p>
        </div>
      </div>
    );
  }

  const { summary, context, evidence, detections, intelligence } = alert;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/live')}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Live Intelligence Stream
        </button>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-700 transition-colors uppercase tracking-wider">Download Log Audit</button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors uppercase tracking-wider">Acknowledge Threat</button>
        </div>
      </div>

      {/* 🚀 EXECUTIVE VERDICT HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-[#0a0f1c] border border-slate-700/50 rounded-2xl shadow-2xl p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[120px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <ShieldAlert className="text-red-500" size={32} />
              </div>
              <div>
                <p className="text-red-500 text-xs font-black uppercase tracking-[0.2em] mb-1">Final System Verdict</p>
                <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {summary.threat_type}
                </h1>
              </div>
            </div>

            <div className="p-4 bg-black/40 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-slate-300 leading-relaxed text-lg font-medium italic">
                "{summary.explanation}"
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 min-w-[200px]">
            <div className="flex flex-col items-end">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Risk Severity</span>
              <span className={`px-6 py-2 rounded-lg text-lg font-black border-2 ${summary.severity === 'CRITICAL' || summary.severity === 'HIGH' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]'}`}>
                {summary.severity}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 font-mono text-xs uppercase font-bold tracking-widest">{summary.verdict} DETECTED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CONTEXT & INTELLIGENCE */}
        <div className="lg:col-span-1 space-y-8">
          {/* WHO & WHEN */}
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 hover:border-slate-600/50 transition-colors">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Target size={16} className="text-blue-400" /> Origin Context
            </h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-500">Actor IP</span>
                <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded">{context.ip}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-500">Resource Target</span>
                <span className="text-slate-200">{context.path}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Detection ID</span>
                <span className="text-slate-400">#SNW-{context.id}</span>
              </div>
            </div>
          </div>

          {/* BEHAVIORAL INTELLIGENCE */}
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6 hover:border-slate-600/50 transition-colors">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Activity size={16} className="text-emerald-400" /> Behavioral Anomaly Signals
            </h3>
            <div className="space-y-3">
              {intelligence.signals.map((signal, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/40 rounded border border-slate-700/30 font-mono text-xs">
                  <span className="text-slate-500">{signal.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{signal.value}</span>
                    <span className={`w-2 h-2 rounded-full ${signal.is_anomaly ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-700'}`}></span>
                  </div>
                </div>
              ))}

              <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[.2em]">AI Intelligence Score</span>
                  <span className="text-emerald-400 font-bold font-mono">{(intelligence.ml_score * 100).toFixed(1)}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-snug italic italic">
                  "{intelligence.interpretation}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EVIDENCE & LOGIC */}
        <div className="lg:col-span-2 space-y-8">
          {/* RULE TRIGGERS */}
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Fingerprint size={16} className="text-purple-400" /> Pattern Match Forensic Triggers
            </h3>
            <div className="space-y-4">
              {detections.length > 0 ? detections.map((det, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl">
                  <div className="mt-1 p-2 bg-slate-800 rounded-lg h-fit">
                    <Code size={16} className="text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono text-sm">{det.rule_id}</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 text-[10px] rounded border border-slate-700 font-black uppercase">{det.severity}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{det.description}</p>
                  </div>
                </div>
              )) : (
                <div className="p-4 bg-slate-900/30 border border-dashed border-slate-700/50 rounded-xl text-center text-slate-500 italic text-sm font-mono">
                  No explicit deterministic patterns triggered. Detection based primarily on anomaly intelligence.
                </div>
              )}
            </div>
          </div>

          {/* MALICIOUS PAYLOAD */}
          <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Code size={16} className="text-red-400" /> Captured Attack Vector
              </h3>
              <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black rounded uppercase tracking-widest border border-red-500/20">Source: {evidence.location}</span>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500/5 rounded-lg border border-red-500/20 filter blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <pre className="relative z-10 p-6 bg-black rounded-xl border border-slate-800 text-red-100/90 font-mono text-sm overflow-x-auto selection:bg-red-500/30">
                {typeof evidence.payload === 'string' ? evidence.payload : JSON.stringify(evidence.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
