// src/pages/BehaviorAnalytics.jsx
import { useParams } from 'react-router-dom';
import { useBehaviorData } from '../utils/useBehaviorData';
import FailedAuthChart from '../components/charts/FailedAuthChart';
import RequestBurstChart from '../components/charts/RequestBurstChart';
import RateViolationsTable from '../components/tables/RateViolationsTable';
import RollingWindowGrid from '../components/cards/RollingWindowGrid';
import EvidenceCard from '../components/cards/EvidenceCard';

export default function BehaviorAnalytics() {
    const { sessionId } = useParams(); // route: /behavior/:sessionId
    const { data, loading, error } = useBehaviorData(sessionId);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                Loading behavior analytics…
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500">
                <strong>Error:</strong> {error}
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-4 text-slate-400">
                No data available for this session.
            </div>
        );
    }

    const {
        summary,
        timeline,
        rate_violations,
        rolling_window,
        evidence,
    } = data;

    // Severity colour mapping
    const severityColors = {
        CRITICAL: 'bg-red-600',
        HIGH: 'bg-red-500',
        MEDIUM: 'bg-orange-500',
        LOW: 'bg-green-500',
    };
    const severityClass = severityColors[summary.severity] ?? 'bg-gray-500';

    return (
        <section className="max-w-7xl mx-auto space-y-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <header className="flex items-center justify-between bg-slate-800/40 p-4 rounded-lg border border-slate-700/30">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {summary.threat_type} – {summary.verdict}
                    </h1>
                    <p className="text-slate-300">{summary.explanation}</p>
                </div>
                <span
                    className={`px-4 py-1 rounded text-sm font-medium text-white ${severityClass}`}
                >
                    {summary.severity}
                </span>
            </header>

            {/* 1️⃣ Failed Auth Timeline */}
            <FailedAuthChart data={timeline.failed_auth} />

            {/* 2️⃣ Request Burst Pattern */}
            <RequestBurstChart data={timeline.request_rate} />

            {/* 3️⃣ Rate Violations */}
            <RateViolationsTable violations={rate_violations} />

            {/* 4️⃣ Rolling Window Grid – core differentiator */}
            <RollingWindowGrid aggregates={rolling_window.aggregates} />

            {/* 5️⃣ Evidence Card */}
            <EvidenceCard evidence={evidence} />
        </section>
    );
}
