import React from 'react';
import GlassCard from '@/components/GlassCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface MoodDataPoint {
  name: string; // e.g., 'Mon', 'Tue', or 'MMM dd'
  moodScore: number; // e.g., 1 for Sad, 2 for Neutral, 3 for Happy, 4 for Joyful, 0 for Angry
}

interface MoodChartProps {
  data: MoodDataPoint[];
}

const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
  const formatMoodLabel = (value: number) => {
    switch (value) {
      case 0: return 'Angry';
      case 1: return 'Sad';
      case 2: return 'Neutral';
      case 3: return 'Happy';
      case 4: return 'Joyful';
      case 5: return 'Neutral'; // Assuming 5 is also neutral for 1-10 scale
      case 6: return 'Good';
      case 7: return 'Great';
      case 8: return 'Happy';
      case 9: return 'Fantastic';
      case 10: return 'Amazing';
      default: return '';
    }
  };

  // Determine min/max for Y-axis based on actual data, or default to 0-10
  const moodScores = data.map(d => d.moodScore);
  const minY = moodScores.length > 0 ? Math.min(...moodScores) : 0;
  const maxY = moodScores.length > 0 ? Math.max(...moodScores) : 10;
  const yDomain = [Math.floor(minY / 1) * 1, Math.ceil(maxY / 1) * 1]; // Round to nearest integer for ticks

  // Generate ticks for Y-axis based on the actual range, ensuring at least 3-5 ticks
  const generateTicks = (min: number, max: number) => {
    const ticks = [];
    const range = max - min;
    if (range <= 4) { // Small range, show all integer ticks
      for (let i = min; i <= max; i++) {
        ticks.push(i);
      }
    } else { // Larger range, show fewer ticks
      const step = Math.ceil(range / 4); // Aim for about 5 ticks
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      if (!ticks.includes(max)) ticks.push(max); // Ensure max is included
    }
    return ticks;
  };

  const yAxisTicks = generateTicks(yDomain[0], yDomain[1]);

  return (
    <GlassCard className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-4">Mood Trend Over Time</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.8)" />
            <YAxis
              domain={yDomain}
              ticks={yAxisTicks}
              tickFormatter={formatMoodLabel}
              stroke="rgba(255,255,255,0.8)"
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
              labelStyle={{ color: 'white' }}
              itemStyle={{ color: 'white' }}
              formatter={(value: number) => [formatMoodLabel(value), 'Mood Score']}
            />
            <Line type="monotone" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default MoodChart;