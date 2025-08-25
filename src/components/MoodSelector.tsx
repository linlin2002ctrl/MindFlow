import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/i18n';

interface MoodSelectorProps {
  initialMood: number;
  onMoodChange: (mood: number) => void;
  disabled?: boolean;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ initialMood, onMoodChange, disabled }) => {
  const { t } = useTranslation();

  const moodLabels: { [key: number]: string } = {
    1: t('moodAngry') + " 😩",
    2: t('moodAngry') + " 😩",
    3: t('moodSad') + " 😞",
    4: t('moodSad') + " 😟",
    5: t('moodNeutral') + " 😐",
    6: t('moodNeutral') + " 🙂",
    7: t('moodHappy') + " 😊",
    8: t('moodHappy') + " 😄",
    9: t('moodJoyful') + " 😁",
    10: t('moodJoyful') + " ✨",
  };

  const getMoodColor = (mood: number) => {
    const red = Math.round(255 - (mood - 1) * (255 / 9));
    const green = Math.round((mood - 1) * (255 / 9));
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="flex flex-col items-center gap-4" role="group" aria-labelledby="mood-selector-label">
      <label id="mood-selector-label" htmlFor="mood-slider" className="text-white text-xl font-semibold">
        {t('howAreYouFeeling')} <span aria-live="polite">{moodLabels[initialMood]}</span>
      </label>
      <div className="relative w-full max-w-xs h-10 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right, ${getMoodColor(1)}, ${getMoodColor(5)}, ${getMoodColor(10)})`,
            opacity: disabled ? 0.5 : 1,
          }}
        ></div>
        <Slider
          id="mood-slider"
          defaultValue={[initialMood]}
          max={10}
          min={1}
          step={1}
          onValueChange={(value) => onMoodChange(value[0])}
          className="relative z-10 w-full max-w-xs [&>span:first-child]:h-2 [&>span:first-child]:bg-transparent [&>span:first-child]:rounded-full [&>span:first-child>span]:bg-white [&>span:first-child>span]:w-6 [&>span:first-child>span]:h-6 [&>span:first-child>span]:-mt-2 [&>span:first-child>span]:border-2 [&>span:first-child>span]:border-mindflow-blue [&>span:first-child>span]:shadow-md"
          aria-valuenow={initialMood}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-label={t('currentMood', initialMood)}
          disabled={disabled}
        />
      </div>
      <motion.span
        key={initialMood}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-white text-2xl font-bold"
        aria-live="polite"
      >
        {initialMood}
      </motion.span>
    </div>
  );
};

export default MoodSelector;