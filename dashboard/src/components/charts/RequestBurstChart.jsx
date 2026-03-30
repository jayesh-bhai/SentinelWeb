// src/components/charts/RequestBurstChart.jsx
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

export default function RequestBurstChart({ data }) {
    const formatted = data.map(d => ({
        time: format(new Date(d.ts), 'HH:mm:ss'),
        rps: d.rps,
    }));

    return (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/30">
            <h3 className="text-sm font-bold text-slate-300 mb-2">Request Burst Pattern</h3>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={formatted}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                        labelStyle={{ color: '#F3F4F6' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="rps"
                        stroke="#10B981"
                        fill="#10B98133"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
