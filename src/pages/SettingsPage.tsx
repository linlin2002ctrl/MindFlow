import React from 'react';
import GlassCard from '@/components/GlassCard';

const SettingsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Settings</h1>
        <p className="text-lg text-white/80">Manage your app preferences here.</p>
        {/* Add settings options here */}
        <div className="mt-8 text-white/90">
          <p>Language: English</p>
          <p>Notifications: On</p>
          <p>Theme: Dark</p>
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;