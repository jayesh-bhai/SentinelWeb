import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function EvidenceCard({ evidence }) {
    const [copied, setCopied] = useState(false);

    if (!evidence) {
        return (
            <div className="text-slate-400 italic py-2">
                No forensic evidence attached to this alert.
            </div>
        );
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(evidence.payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Captured Attack Vector</h3>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Location:</span>
                <code className="bg-slate-900/50 px-2 py-0.5 rounded text-xs text-emerald-400 font-mono">
                    {evidence.location}
                </code>
            </div>
            <pre className="bg-slate-900/60 p-3 rounded text-sm overflow-x-auto text-amber-200 font-mono border border-slate-800">
                {evidence.payload}
            </pre>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>Pattern:</span>
                <code className="bg-slate-900/50 px-2 py-0.5 rounded font-mono text-slate-400">{evidence.matched_pattern}</code>
                <span className="ml-4">Rule ID:</span>
                <code className="bg-slate-900/50 px-2 py-0.5 rounded font-mono text-slate-400">{evidence.rule_id}</code>
                <button
                    onClick={copyToClipboard}
                    className={`ml-auto flex items-center gap-1 px-2 py-1 rounded transition-all ${
                        copied ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title="Copy payload"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            <span className="font-bold uppercase tracking-widest text-[9px]">Copied!</span>
                        </>
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
}
