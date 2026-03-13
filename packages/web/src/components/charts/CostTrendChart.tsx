import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface DailyDataPoint {
  date: string;
  cost: number;
  tokens: number;
}

interface CostTrendChartProps {
  data: DailyDataPoint[];
  title?: string;
  description?: string;
}

export default function CostTrendChart({
  data,
  title = "Cost Trend",
  description = "Daily API spend over last 7 days"
}: CostTrendChartProps) {
  // Format date labels: "Mar 7" from "2026-03-07"
  const formattedData = data.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card className="cyber-card">
      <CardHeader>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => {
                const v = Number(value) || 0;
                if (name === 'cost') return [`$${v.toFixed(4)}`, 'Cost'];
                if (name === 'tokens') return [v.toLocaleString(), 'Tokens'];
                return [v, name];
              }}
              labelStyle={{ color: '#00f0ff', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#00f0ff"
              strokeWidth={2}
              fill="url(#costGradient)"
              dot={{ fill: '#00f0ff', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#00f0ff', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
