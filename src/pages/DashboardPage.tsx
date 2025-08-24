import React from 'react';
import GlassCard from '@/components/GlassCard';

const DashboardPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">MindFlow Dashboard</h1>
        <p className="text-lg text-white/80">Welcome back! Here's a quick overview of your journaling journey.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-4 text-white/90">
            <h2 className="text-2xl font-semibold mb-2">Mood Summary</h2>
            <p>Your mood has been generally positive this week.</p>
          </GlassCard>
          <GlassCard className="p-4 text-white/90">
            <h2 className="text-2xl font-semibold mb-2">Recent Entries</h2>
            <p>You have 3 new entries since your last visit.</p>
          </GlassCard>
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardPage;