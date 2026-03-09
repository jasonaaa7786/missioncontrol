import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface DataPoint {
  date: string;
  subscribers: number;
  views: number;
}

interface SubscriberGrowthChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
}

export default function SubscriberGrowthChart({ 
  data, 
  title = "YouTube Growth", 
  description = "Subscriber and view count over time" 
}: SubscriberGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <Legend 
              wrapperStyle={{ color: '#9CA3AF' }}
            />
            <Line 
              type="monotone" 
              dataKey="subscribers" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Subscribers"
            />
            <Line 
              type="monotone" 
              dataKey="views" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Views"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
