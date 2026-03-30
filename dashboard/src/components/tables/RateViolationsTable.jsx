// src/components/tables/RateViolationsTable.jsx
export default function RateViolationsTable({ violations }) {
    if (!violations?.length) {
        return (
            <div className="text-slate-400 italic py-2">
                No rate‑violation events detected.
            </div>
        );
    }

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30 overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Rate Violations (Critical)</h3>
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 uppercase tracking-wider">
                    <tr>
                        <th className="px-2 py-1">Window</th>
                        <th className="px-2 py-1">Threshold</th>
                        <th className="px-2 py-1">Observed</th>
                        <th className="px-2 py-1">Severity</th>
                    </tr>
                </thead>
                <tbody>
                    {violations.map((v, i) => (
                        <tr key={i} className="border-b border-slate-700/30">
                            <td className="px-2 py-1">{v.window}</td>
                            <td className="px-2 py-1">{v.threshold}</td>
                            <td className="px-2 py-1">{v.observed}</td>
                            <td className="px-2 py-1">
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${v.severity === 'CRITICAL'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-orange-600 text-white'
                                        }`}
                                >
                                    {v.severity}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
