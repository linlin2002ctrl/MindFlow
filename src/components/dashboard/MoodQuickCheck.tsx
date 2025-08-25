import React, { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Smile, Frown, Meh, Laugh, Angry } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { journalService } from '@/services/journalService';
import { useTranslation } from '@/i18n/i18n';

type Mood = 'joyful' | 'happy' | 'neutral' | 'sad' | 'angry';

const MoodQuickCheck: React.FC = () => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const moods = [
    { key: 'joyful', icon: Laugh, label: t('moodJoyful'), color: 'text-yellow-300', rating: 10 },
    { key: 'happy', icon: Smile, label: t('moodHappy'), color: 'text-green-400', rating: 8 },
    { key: 'neutral', icon: Meh, label: t('moodNeutral'), color: 'text-blue-300', rating: 5 },
    { key: 'sad', icon: Frown, label: t('moodSad'), color: 'text-indigo-300', rating: 3 },
    { key: 'angry', icon: Angry, label: t('moodAngry'), color: 'text-red-400', rating: 1 },
  ];

  const handleMoodSelect = async (mood: Mood) => {
    if (!user) {
      toast.error(t('errorRecordingMood'));
      return;
    }

    setSelectedMood(mood);
    setIsSaving(true);
    try {
      const moodRating = moods.find(m => m.key === mood)?.rating || null;

      const newEntry = await journalService.createEntry({
        user_id: user.id,
        session_type: 'quick_checkin',
        mood_rating: moodRating,
        conversation: [],
        ai_analysis: null,
        entry_text: `Quick mood check-in: ${mood.charAt(0).toUpperCase() + mood.slice(1)}.`,
        tags: ['mood_checkin', mood],
      }, t);

      if (!newEntry) {
        toast.error(t('errorSavingMood'));
      } else {
        toast.success(t('moodRecorded', mood.charAt(0).toUpperCase() + mood.slice(1)));
        if (navigator.vibrate) navigator.vibrate(50);
      }
    } catch (err) {
      console.error("Unexpected error saving mood:", err);
      toast.error(t('errorUnexpectedSaving'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GlassCard className="p-6 text-center">
      <h3 className="text-2xl font-semibold text-white mb-4">{t('howAreYouFeelingToday')}</h3>
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
            disabled={isSaving}
          >
            <mood.icon className={cn("h-8 w-8", mood.color)} />
            <span className="text-sm">{mood.label}</span>
          </Button>
        ))}
      </div>
      {selectedMood && (
        <p className="text-white/80 mt-2">{t('moodCheckedIn', moods.find(m => m.key === selectedMood)?.label)}.</p>
      )}
      {isSaving && <p className="text-white/70 mt-2">{t('savingMood')}</p>}
    </GlassCard>
  );
};

export default MoodQuickCheck;