import React from 'react';
import GlassCard from '@/components/GlassCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/i18n/i18n';

interface MoodDataPoint {
  name: string;
  moodScore: number;
}

interface MoodChartProps {
  data: MoodDataPoint[];
}

const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
  const { t } = useTranslation();

  const formatMoodLabel = (value: number) => {
    switch (value) {
      case 0: return t('angry');
      case 1: return t('sad');
      case 2: return t('neutral');
      case 3: return t('happy');
      case 4: return t('joyful');
      case 5: return t('neutral');
      case 6: return t('good');
      case 7: return t('great');
      case 8: return t('happy');
      case 9: return t('fantastic');
      case 10: return t('amazing');
      default: return '';
    }
  };

  const moodScores = data.map(d => d.moodScore);
  const minY = moodScores.length > 0 ? Math.min(...moodScores) : 0;
  const maxY = moodScores.length > 0 ? Math.max(...moodScores) : 10;
  const yDomain = [Math.floor(minY / 1) * 1, Math.ceil(maxY / 1) * 1];

  const generateTicks = (min: number, max: number) => {
    const ticks = [];
    const range = max - min;
    if (range <= 4) {
      for (let i = min; i <= max; i++) {
        ticks.push(i);
      }
    } else {
      const step = Math.ceil(range / 4);
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      if (!ticks.includes(max)) ticks.push(max);
    }
    return ticks;
  };

  const yAxisTicks = generateTicks(yDomain[0], yDomain[1]);

  return (
    <GlassCard className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-4">{t('moodTrendOverTime')}</h3>
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
              formatter={(value: number) => [formatMoodLabel(value), t('moodScore')]}
            />
            <Line type="monotone" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={3} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

export default MoodChart;