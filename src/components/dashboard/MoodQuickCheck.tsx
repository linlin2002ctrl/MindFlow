import React, { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Mood = 'happy' | 'neutral' | 'sad' | 'joyful' | 'angry';

const MoodQuickCheck: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const moods = [
    { key: 'joyful', icon: Laugh, label: 'Joyful', color: 'text-yellow-300' },
    { key: 'happy', icon: Smile, label: 'Happy', color: 'text-green-400' },
    { key: 'neutral', icon: Meh, label: 'Neutral', color: 'text-blue-300' },
    { key: 'sad', icon: Frown, label: 'Sad', color: 'text-indigo-300' },
    { key: 'angry', icon: Angry, label: 'Angry', color: 'text-red-400' },
  ];

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    toast.success(`You selected: ${mood.charAt(0).toUpperCase() + mood.slice(1)}!`);
  };

  return (
    <GlassCard className="p-6 text-center">
      <h3 className="text-2xl font-semibold text-white mb-4">How are you feeling today?</h3>
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        {moods.map((mood) => (
          <Button
            key={mood.key}
            variant="ghost"
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200",
              "text-white hover:bg-white/20",
              selectedMood === mood.key && "bg-white/30 ring-2 ring-mindflow-blue"
            )}
            onClick={() => handleMoodSelect(mood.key as Mood)}
          >
            <mood.icon className={cn("h-8 w-8", mood.color)} />
            <span className="text-sm">{mood.label}</span>
          </Button>
        ))}
      </div>
      {selectedMood && (
        <p className="text-white/80 mt-2">You've checked in as <span className="font-bold">{selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)}</span>.</p>
      )}
    </GlassCard>
  );
};

export default MoodQuickCheck;