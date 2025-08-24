import React from 'react';
import GlassCard from '@/components/GlassCard';
import { BarChart2, LineChart } from 'lucide-react';

const InsightsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Your Insights</h1>
        <p className="text-lg text-white/80 mb-6">Discover patterns and trends in your journaling.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-4 text-white/90 flex flex-col items-center">
            <BarChart2 className="h-12 w-12 mb-4 text-mindflow-blue" />
            <h2 className="text-2xl font-semibold mb-2">Mood Trends</h2>
            <p>Visualize your mood changes over time.</p>
          </GlassCard>
          <GlassCard className="p-4 text-white/90 flex flex-col items-center">
            <LineChart className="h-12 w-12 mb-4 text-mindflow-blue" />
            <h2 className="text-2xl font-semibold mb-2">Keyword Analysis</h2>
            <p>See the most common themes in your entries.</p>
          </GlassCard>
        </div>
      </GlassCard>
    </div>
  );
};

export default InsightsPage;