import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import WelcomeCard from '@/components/dashboard/WelcomeCard.tsx';
import MoodQuickCheck from '@/components/dashboard/MoodQuickCheck.tsx';
import RecentEntries from '@/components/dashboard/RecentEntries.tsx';
import MoodChart from '@/components/dashboard/MoodChart.tsx';
import GlassCard from '@/components/GlassCard'; // Re-import GlassCard for general use

const encouragingMessages = [
  "Every entry is a step towards self-discovery!",
  "Your thoughts matter. Keep exploring!",
  "Consistency is key. You're doing great!",
  "Reflect, grow, and thrive with MindFlow.",
  "Unlock new insights with every journal entry.",
];

const DashboardPage: React.FC = () => {
  const randomEncouragingMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-4xl space-y-6">
        {/* Welcome Message */}
        <WelcomeCard userName="MindFlow User" />

        {/* Quick Start Journaling Button */}
        <Link to="/journal" className="block w-full">
          <Button className="w-full py-6 text-xl font-bold bg-mindflow-blue hover:bg-mindflow-purple text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <PlusCircle className="h-7 w-7 mr-3" /> Start New Journal Entry
          </Button>
        </Link>

        {/* Today's Mood Selector */}
        <MoodQuickCheck />

        {/* Weekly Mood Trend Chart */}
        <MoodChart />

        {/* Recent Journal Entries */}
        <RecentEntries />

        {/* Encouraging Message */}
        <GlassCard className="p-4 text-center text-white/80 text-lg italic">
          <p>{randomEncouragingMessage}</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;