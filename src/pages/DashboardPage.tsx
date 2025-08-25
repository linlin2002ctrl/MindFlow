import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import WelcomeCard from '@/components/dashboard/WelcomeCard.tsx';
import MoodQuickCheck from '@/components/dashboard/MoodQuickCheck.tsx';
import RecentEntries from '@/components/dashboard/RecentEntries.tsx';
import MoodChart from '@/components/dashboard/MoodChart.tsx';
import GlassCard from '@/components/GlassCard';
import InstallPWAButton from '@/components/InstallPWAButton';
import { useTranslation } from '@/i18n/i18n';

const encouragingMessages = [
  "Every entry is a step towards self-discovery!",
  "Your thoughts matter. Keep exploring!",
  "Consistency is key. You're doing great!",
  "Reflect, grow, and thrive with MindFlow.",
  "Unlock new insights with every journal entry.",
];

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const randomEncouragingMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

  const dummyMoodData = [
    { name: 'Mon', moodScore: 7 },
    { name: 'Tue', moodScore: 6 },
    { name: 'Wed', moodScore: 8 },
    { name: 'Thu', moodScore: 7 },
    { name: 'Fri', moodScore: 9 },
    { name: 'Sat', moodScore: 8 },
    { name: 'Sun', moodScore: 7 },
  ];

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-4xl space-y-6">
        <WelcomeCard userName="MindFlow User" />

        <InstallPWAButton />

        <Link to="/journal" className="block w-full">
          <Button className="w-full py-6 text-xl font-bold bg-mindflow-blue hover:bg-mindflow-purple text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <PlusCircle className="h-7 w-7 mr-3" /> {t('startNewJournalEntry')}
          </Button>
        </Link>

        <MoodQuickCheck />

        <MoodChart data={dummyMoodData} />

        <RecentEntries />

        <GlassCard className="p-4 text-center text-white/80 text-lg italic">
          <p>{randomEncouragingMessage}</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default DashboardPage;