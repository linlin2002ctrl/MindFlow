import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Mic, StopCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n/i18n';

interface ResponseInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onVoiceInputToggle: (isListening: boolean) => void;
  isLoadingAI: boolean;
  isListening: boolean;
  isSaving: boolean;
  disabled?: boolean;
}

const estimateReadingTime = (text: string, wpm = 200) => {
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  if (words === 0) return "0 min read";
  const minutes = Math.ceil(words / wpm);
  return `${minutes} min read`;
};

const ResponseInput: React.FC<ResponseInputProps> = ({
  value,
  onChange,
  onSubmit,
  onVoiceInputToggle,
  isLoadingAI,
  isListening,
  isSaving,
  disabled,
}) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = value.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = estimateReadingTime(value);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const nudgeTimerRef = useRef<number | null>(null);
  const startNudgeTimer = useCallback(() => {
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
    }
    nudgeTimerRef.current = window.setTimeout(() => {
      if (value.trim() !== '') {
        toast.info(t('nudgeMessage'));
      }
    }, 60000);
  }, [value, t]);

  useEffect(() => {
    if (!disabled) {
      startNudgeTimer();
    }
    return () => {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
      }
    };
  }, [value, disabled, startNudgeTimer]);

  const encouragingFeedback = [
    t('greatInsight'),
    t('keepGoing'),
    t('thoughtfulResponse'),
    t('doingGreat'),
    t('everyWordMatters'),
  ];

  const handleSubmit = () => {
    onSubmit();
    if (value.trim()) {
      const feedback = encouragingFeedback[Math.floor(Math.random() * encouragingFeedback.length)];
      toast.success(feedback);
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        placeholder={t('typeYourResponse')}
        className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-mindflow-blue resize-none overflow-hidden min-h-[4rem] pr-16 pb-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isLoadingAI || isListening}
        aria-label={t('yourJournalResponse')}
        rows={1}
        spellCheck="true"
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-white/50">
        <AnimatePresence>
          {isSaving && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1"
            >
              <Loader2 className="h-3 w-3 animate-spin" /> {t('saving')}
            </motion.span>
          )}
        </AnimatePresence>
        <span aria-live="polite">{t('words', wordCount)}</span>
        <span aria-hidden="true">•</span>
        <span aria-hidden="true">{t('minRead', readingTime.split(' ')[0])}</span>
      </div>
      <div className="absolute top-2 right-2 flex gap-2">
        <Button
          onClick={() => onVoiceInputToggle(!isListening)}
          variant="ghost"
          size="icon"
          className={cn(
            "text-white hover:bg-white/20",
            isListening && "bg-red-500/80 hover:bg-red-600 text-white"
          )}
          disabled={disabled || isLoadingAI}
          aria-label={isListening ? t('stopVoiceInput') : t('startVoiceInput')}
        >
          {isListening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          disabled={disabled || isLoadingAI || !value.trim()}
          aria-label={t('sendResponse')}
        >
          {isLoadingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default ResponseInput;