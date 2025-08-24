import React from 'react';
import GlassCard from '@/components/GlassCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MoodData {
  name: string;
  moodScore: number; // e.g., 1 for Sad, 2 for Neutral, 3 for Happy, 4 for Joyful, 0 for Angry
}

const dummyMoodData: MoodData[] = [
  { name: 'Mon', moodScore: 3 }, // Happy
  { name: 'Tue', moodScore: 2 }, // Neutral
  { name: 'Wed', moodScore: 3 }, // Happy
  { name: 'Thu', moodScore: 4 }, // Joyful
  { name: 'Fri', moodScore: 2 }, // Neutral
  { name: 'Sat', moodScore: 3 }, // Happy
  { name: 'Sun', moodScore: 1 }, // Sad
];

const MoodChart: React.FC = () => {
  const formatMoodLabel = (value: number) => {
    switch (value) {
      case 0: return 'Angry';
      case 1: return 'Sad';
      case 2: return 'Neutral';
      case 3: return 'Happy';
      case 4: return 'Joyful';
      default: return '';
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-4">Weekly Mood Trend</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dummyMoodData}
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
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
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