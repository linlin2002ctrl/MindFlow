import React from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  initialMood: number;
  onMoodChange: (mood: number) => void;
  disabled?: boolean;
}

const moodLabels: { [key: number]: string } = {
  1: "Terrible 😩",
  2: "Bad 😞",
  3: "Down 😔",
  4: "Okay-ish 😟",
  5: "Neutral 😐",
  6: "Alright 🙂",
  7: "Good 😊",
  8: "Great 😄",
  9: "Fantastic 😁",
  10: "Amazing! ✨",
};

const MoodSelector: React.FC<MoodSelectorProps> = ({ initialMood, onMoodChange, disabled }) => {
  const getMoodColor = (mood: number) => {
    // Interpolate between red (1) and green (10)
    const red = Math.round(255 - (mood - 1) * (255 / 9));
    const green = Math.round((mood - 1) * (255 / 9));
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="flex flex-col items-center gap-4" role="group" aria-labelledby="mood-selector-label">
      <label id="mood-selector-label" htmlFor="mood-slider" className="text-white text-xl font-semibold">
        How are you feeling? <span aria-live="polite">{moodLabels[initialMood]}</span>
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
          aria-label={`Current mood: ${initialMood}`}
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