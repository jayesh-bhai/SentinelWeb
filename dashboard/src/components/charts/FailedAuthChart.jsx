// src/components/charts/FailedAuthChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export default function FailedAuthChart({ data }) {
    const formatted = data.map(d => ({
        time: format(new Date(d.ts), 'HH:mm:ss'),
        count: d.count,
    }));

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Failed Authentication Timeline</h3>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={formatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                        labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
