import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SkipForward, StopCircle, Pause, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionType } from '@/hooks/useConversationManager';
import { useTranslation } from '@/i18n/i18n';

interface SessionControlsProps {
  sessionType: SessionType | null;
  questionCount: number;
  maxQuestions: number;
  isLoadingAI: boolean;
  isListening: boolean;
  onSkipQuestion: () => void;
  onEndSession: () => void;
  onDiscardSession: () => void;
  onPauseSession: () => void;
  onSessionTypeChange: (type: SessionType) => void;
  isSessionActive: boolean;
  disabled?: boolean;
}

const SessionControls: React.FC<SessionControlsProps> = ({
  sessionType,
  questionCount,
  maxQuestions,
  isLoadingAI,
  isListening,
  onSkipQuestion,
  onEndSession,
  onDiscardSession,
  onPauseSession,
  onSessionTypeChange,
  isSessionActive,
  disabled,
}) => {
  const { t } = useTranslation();
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (isSessionActive && sessionStartTime === null) {
      setSessionStartTime(Date.now());
    } else if (!isSessionActive && sessionStartTime !== null) {
      setSessionStartTime(null);
      setElapsedTime(0);
    }
  }, [isSessionActive, sessionStartTime]);

  useEffect(() => {
    let timer: number;
    if (isSessionActive && sessionStartTime !== null) {
      timer = window.setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime!) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSessionActive, sessionStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {isSessionActive && sessionType && (
        <div className="flex justify-between items-center text-white/80 text-sm">
          <span className="font-semibold">{t('session')}: {sessionType.replace('_', ' ').toUpperCase()}</span>
          <span className="font-semibold">{t('time')}: {formatTime(elapsedTime)}</span>
        </div>
      )}

      {!isSessionActive && (
        <div className="flex flex-col items-center gap-4" role="group" aria-labelledby="session-type-label">
          <label id="session-type-label" htmlFor="session-type" className="text-white text-xl font-semibold sr-only">
            {t('chooseSessionType')}
          </label>
          <Select value={sessionType || 'standard_session'} onValueChange={(value: SessionType) => onSessionTypeChange(value)} disabled={disabled}>
            <SelectTrigger id="session-type" className="w-full max-w-xs bg-white/10 border border-white/20 text-white" aria-label={t('chooseSessionType')}>
              <SelectValue placeholder={t('selectSessionTypePlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-mindflow-purple/90 border border-white/20 text-white">
              <SelectItem value="quick_checkin">{t('quickCheckin')}</SelectItem>
              <SelectItem value="standard_session">{t('standardSession')}</SelectItem>
              <SelectItem value="deep_dive">{t('deepDive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        {isSessionActive && (
          <>
            <Button
              onClick={onSkipQuestion}
              variant="outline"
              className="min-w-[120px] bg-white/10 hover:bg-white/20 text-white border-white/20 py-3"
              disabled={disabled || isLoadingAI || isListening}
              aria-label={t('skip')}
            >
              <SkipForward className="h-5 w-5 mr-2" /> {t('skip')}
            </Button>
            <Button
              onClick={onPauseSession}
              variant="outline"
              className="min-w-[120px] bg-white/10 hover:bg-white/20 text-white border-white/20 py-3"
              disabled={disabled || isLoadingAI || isListening}
              aria-label={t('pause')}
            >
              <Pause className="h-5 w-5 mr-2" /> {t('pause')}
            </Button>
            <Button
              onClick={onEndSession}
              variant="destructive"
              className="flex-1 min-w-[120px] bg-red-600/80 hover:bg-red-700 text-white py-3"
              disabled={disabled || isLoadingAI || isListening}
              aria-label={t('endSession')}
            >
              <StopCircle className="h-5 w-5 mr-2" /> {t('endSession')}
            </Button>
            <Button
              onClick={onDiscardSession}
              variant="ghost"
              className="min-w-[120px] bg-transparent hover:bg-red-500/20 text-red-400 border border-red-400/50 py-3"
              disabled={disabled || isLoadingAI || isListening}
              aria-label={t('discard')}
            >
              <XCircle className="h-5 w-5 mr-2" /> {t('discard')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default SessionControls;