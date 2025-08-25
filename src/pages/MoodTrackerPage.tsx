import React from 'react';
import GlassCard from '@/components/GlassCard';
import { Smile, Frown, Meh } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MoodTrackerPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">စိတ်ခံစားမှုမှတ်တမ်း</h1>
        <p className="text-lg text-white/80 mb-6">How are you feeling today?</p>
        <div className="flex justify-center gap-4 mb-6">
          <Button variant="ghost" className="flex flex-col items-center gap-2 text-white hover:bg-white/20">
            <Smile className="h-10 w-10 text-green-400" />
            <span className="text-lg">စိတ်ကောင်းနေ</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center gap-2 text-white hover:bg-white/20">
            <Meh className="h-10 w-10 text-yellow-400" />
            <span className="text-lg">သာမာန်</span>
          </Button>
          <Button variant="ghost" className="flex flex-col items-center gap-2 text-white hover:bg-white/20">
            <Frown className="h-10 w-10 text-red-400" />
            <span className="text-lg">စိတ်မကောင်းဖြစ်နေ</span>
          </Button>
        </div>
        <Button className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
          Log Mood
        </Button>
      </GlassCard>
    </div>
  );
};

export default MoodTrackerPage;