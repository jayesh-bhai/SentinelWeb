// src/components/cards/RollingWindowGrid.jsx
export default function RollingWindowGrid({ aggregates }) {
    if (!aggregates?.length) {
        return (
            <div className="text-slate-400 italic py-2">
                No rolling‑window data available.
            </div>
        );
    }

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-300 mb-2">
                60‑Second Rolling Window Analysis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aggregates.map((win, i) => (
                    <div
                        key={i}
                        className={`p-4 rounded border ${win.violation
                                ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                : 'border-slate-600 bg-slate-900/30'
                            }`}
                    >
                        <div className="text-xs text-slate-400 mb-1">
                            {new Date(win.ts_start).toLocaleTimeString()} –{' '}
                            {new Date(win.ts_end).toLocaleTimeString()}
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-200 font-medium">
                                Failed Auth: {win.failed_auth}
                            </span>
                            <span className="text-emerald-400 font-medium">
                                Max RPS: {win.max_rps}
                            </span>
                        </div>
                        {win.triggered_rules?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {win.triggered_rules.map((r, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-purple-600/30 text-purple-200 text-xs rounded"
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
