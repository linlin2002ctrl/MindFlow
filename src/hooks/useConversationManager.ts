import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuestion, analyzeResponse, suggestFollowUp } from '@/services/geminiService';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import { journalService, JournalEntry } from '@/services/journalService';
import { syncService } from '@/services/syncService';
import { storageService } from '@/services/storageService';
import { insightsService } from '@/services/insightsService';
import { useTranslation } from '@/i18n/i18n.tsx';

export type SessionType = 'quick_checkin' | 'standard_session' | 'deep_dive';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ConversationState {
  currentMood: number | null;
  sessionType: SessionType | null;
  conversationHistory: Message[];
  currentQuestion: string;
  entryText: string;
  questionCount: number;
  maxQuestions: number;
  isSessionActive: boolean;
  isLoadingAI: boolean;
  aiAnalysis: string | null;
  isOffline: boolean;
  queuedResponses: string[];
  currentEntryId: string | null;
  isSaving: boolean;
  isPaused: boolean;
}

const MAX_QUESTIONS_MAP: Record<SessionType, number> = {
  quick_checkin: 3,
  standard_session: 5,
  deep_dive: 7,
};

const OFFLINE_QUESTIONS = {
  low: [
    "It sounds like you're going through a tough time. What's one small thing that might bring a tiny bit of comfort right now?",
    "Sometimes just acknowledging how we feel can be a big step. What's weighing most heavily on your mind today?",
    "It's okay not to be okay. Is there anything you've been avoiding that you'd like to talk about?",
    "When things feel heavy, sometimes a small distraction helps. What's something simple you could do for yourself?",
    "What's one thing you wish someone would understand about how you're feeling?",
  ],
  medium: [
    "You seem to be navigating your day. What's one thing that went as expected today, or even a little better?",
    "What's a small moment from your day that you might not usually notice, but that stands out now?",
    "Is there anything you're looking forward to, even if it's just a small plan?",
    "What's a decision you made today, big or small, and how do you feel about it?",
    "What's something you're learning or curious about lately?",
  ],
  high: [
    "That's wonderful to hear! What's the highlight of your day so far?",
    "What's something you're feeling particularly grateful for right now?",
    "How did you contribute to this positive feeling today, or what helped create it?",
    "What's a goal or dream that feels a little closer to reality when you're feeling this good?",
    "Is there anything you'd like to celebrate or acknowledge about your day?",
  ],
};

const getOfflineQuestion = async (mood: number): Promise<string> => {
  const cachedQuestions = await storageService.getAIQuestions();
  if (cachedQuestions.length > 0) {
    return cachedQuestions[Math.floor(Math.random() * cachedQuestions.length)];
  }

  if (mood >= 8) return OFFLINE_QUESTIONS.high[Math.floor(Math.random() * OFFLINE_QUESTIONS.high.length)];
  if (mood >= 5) return OFFLINE_QUESTIONS.medium[Math.floor(Math.random() * OFFLINE_QUESTIONS.medium.length)];
  return OFFLINE_QUESTIONS.low[Math.floor(Math.random() * OFFLINE_QUESTIONS.low.length)];
};

export const useConversationManager = () => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [state, setState] = useState<ConversationState>({
    currentMood: null,
    sessionType: null,
    conversationHistory: [],
    currentQuestion: '',
    entryText: '',
    questionCount: 0,
    maxQuestions: 0,
    isSessionActive: false,
    isLoadingAI: false,
    aiAnalysis: null,
    isOffline: !navigator.onLine,
    queuedResponses: [],
    currentEntryId: null,
    isSaving: false,
    isPaused: false,
  });

  const autoSaveIntervalRef = useRef<number | null>(null);

  const addMessageToHistory = useCallback((role: 'user' | 'model', text: string) => {
    setState(s => ({
      ...s,
      conversationHistory: [...s.conversationHistory, { role, parts: [{ text }] }],
    }));
  }, []);

  const saveEntry = useCallback(async (status: 'pending' | 'synced' | 'paused') => {
    if (!user || !state.currentEntryId) {
      console.warn("Cannot save entry: User not authenticated or entry ID missing.");
      return;
    }

    setState(s => ({ ...s, isSaving: true }));
    try {
      const updatedEntry = await journalService.updateEntry(state.currentEntryId, {
        session_type: state.sessionType,
        mood_rating: state.currentMood,
        conversation: state.conversationHistory,
        ai_analysis: state.aiAnalysis ? { text: state.aiAnalysis } : null,
        is_encrypted: false,
        sync_status: status,
        entry_text: state.entryText,
      }, user.id, t);

      if (!updatedEntry) {
        showError(t('errorAutoSaveFailed'));
      } else {
        console.log("Entry saved successfully.");
      }
    } catch (err) {
      console.error("Unexpected error saving entry:", err);
      showError(t('errorUnexpectedSaving'));
    } finally {
      setState(s => ({ ...s, isSaving: false }));
    }
  }, [user, state.currentEntryId, state.sessionType, state.currentMood, state.conversationHistory, state.aiAnalysis, state.entryText, t]);

  const getNextQuestion = useCallback(async (mood: number, history: Message[]): Promise<string> => {
    if (state.isOffline) {
      return getOfflineQuestion(mood);
    }
    try {
      if (history.length === 0) {
        return await generateQuestion(mood, t);
      } else {
        return await suggestFollowUp(history, t);
      }
    } catch (error) {
      console.error("Error getting AI question, using fallback:", error);
      showError(t('errorGettingAIQuestionFallback'));
      return getOfflineQuestion(mood);
    }
  }, [state.isOffline, t]);

  const endSession = useCallback(async () => {
    setState(s => ({ ...s, isLoadingAI: true, isSessionActive: false, isPaused: false }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    let finalAnalysis = t('noAnalysisAvailable');
    if (state.entryText.trim()) {
      if (!state.isOffline) {
        try {
          finalAnalysis = await analyzeResponse(state.entryText, t);
          showSuccess(t('aiAnalysisComplete'));
          if (user && state.currentEntryId) {
            await insightsService.createInsight({
              user_id: user.id,
              entry_id: state.currentEntryId,
              insight_type: 'session_summary',
              content: finalAnalysis,
            }, t);
          }
        } catch (error) {
          console.error("Error during final AI analysis:", error);
          showError(t('errorDuringFinalAIAnalysis'));
          finalAnalysis = t('errorDuringFinalAIAnalysis');
        }
      } else {
        finalAnalysis = t('offlineAnalysisMessage');
      }
    }

    setState(s => ({ ...s, aiAnalysis: finalAnalysis, isLoadingAI: false }));
    addMessageToHistory('model', `${t('sessionEnded')}: ${finalAnalysis}`);
    
    if (user && state.currentEntryId) {
      await saveEntry(state.isOffline ? 'pending' : 'synced');
      showSuccess(t('sessionEndedSaved'));
    } else if (user && !state.currentEntryId) {
      const newEntryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'is_encrypted' | 'sync_status'> = {
        user_id: user.id,
        session_type: state.sessionType || 'standard_session',
        mood_rating: state.currentMood,
        conversation: state.conversationHistory,
        ai_analysis: { text: finalAnalysis },
        entry_text: state.entryText,
        tags: null,
      };
      const newEntry = await journalService.createEntry(newEntryData, t);
      if (!newEntry) {
        showError(t('errorSavingJournalEntry'));
      } else {
        showSuccess(t('sessionEndedSaved'));
      }
    } else {
      showError(t('errorUserNotAuthenticatedSave'));
    }
  }, [state.entryText, state.isOffline, state.sessionType, state.currentMood, state.conversationHistory, addMessageToHistory, user, state.currentEntryId, saveEntry, t]);

  const processUserResponse = useCallback(async (userResponse: string) => {
    if (!state.isSessionActive || !state.currentMood || state.isPaused) return;

    addMessageToHistory('user', userResponse);
    setState(s => ({ ...s, entryText: s.entryText + (s.entryText ? '\n\n' : '') + userResponse, isLoadingAI: true }));

    if (state.isOffline) {
      setState(s => ({ ...s, queuedResponses: [...s.queuedResponses, userResponse], isLoadingAI: false }));
      showError(t('errorProcessingResponseOffline'));
      if (state.questionCount < state.maxQuestions) {
        const nextOfflineQuestion = await getOfflineQuestion(state.currentMood);
        setState(s => ({ ...s, currentQuestion: nextOfflineQuestion, questionCount: s.questionCount + 1 }));
        addMessageToHistory('model', nextOfflineQuestion);
      } else {
        endSession();
      }
    } else {
      if (state.questionCount < state.maxQuestions) {
        const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
        setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
        addMessageToHistory('model', nextQuestion);
      } else {
        endSession();
      }
    }
  }, [state.isSessionActive, state.currentMood, state.entryText, state.questionCount, state.maxQuestions, state.isPaused, state.isOffline, state.conversationHistory, addMessageToHistory, getNextQuestion, getOfflineQuestion, endSession, t]);


  useEffect(() => {
    const allOfflineQuestions = [
      ...OFFLINE_QUESTIONS.low,
      ...OFFLINE_QUESTIONS.medium,
      ...OFFLINE_QUESTIONS.high,
    ];
    storageService.cacheInitialAIQuestions(allOfflineQuestions);

    const handleOnline = async () => {
      setState(s => ({ ...s, isOffline: false }));
      if (user) {
        showSuccess(t('backOnlineSyncing'));
        await syncService.syncPendingJournalEntries(user.id, t);

        if (state.queuedResponses.length > 0) {
          showSuccess(t('processingQueuedResponses', state.queuedResponses.length));
          const responsesToProcess = [...state.queuedResponses];
          setState(s => ({ ...s, queuedResponses: [], isLoadingAI: true }));

          for (const response of responsesToProcess) {
            await processUserResponse(response); // This is where the error was
          }
          setState(s => ({ ...s, isLoadingAI: false }));
          showSuccess(t('allQueuedResponsesProcessed'));
        }

        if (!state.isSessionActive && state.aiAnalysis === t('offlineAnalysisMessage') && state.currentEntryId && state.entryText.trim()) {
          showSuccess(t('reanalyzingOfflineEntry'));
          setState(s => ({ ...s, isLoadingAI: true }));
          try {
            const finalAnalysis = await analyzeResponse(state.entryText, t);
            setState(s => ({ ...s, aiAnalysis: finalAnalysis, isLoadingAI: false }));
            await saveEntry('synced');
            showSuccess(t('offlineEntryAnalyzedSaved'));
          } catch (error) {
            console.error("Error re-analyzing offline entry:", error);
            showError(t('errorReanalyzingOfflineEntry'));
            setState(s => ({ ...s, isLoadingAI: false }));
          }
        }
      }
    };

    const handleOffline = () => {
      setState(s => ({ ...s, isOffline: true }));
      showError(t('offlineToast'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine && user) {
      syncService.syncPendingJournalEntries(user.id, t);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, state.queuedResponses, state.isSessionActive, state.aiAnalysis, state.currentEntryId, state.entryText, saveEntry, t, processUserResponse]); // processUserResponse is now defined

  useEffect(() => {
    if (state.isSessionActive && state.entryText.length > 0 && user && state.currentEntryId && !state.isPaused) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = window.setInterval(() => saveEntry('pending'), 30000);
    } else {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    }
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [state.isSessionActive, state.entryText, user, state.currentEntryId, state.isPaused, saveEntry]);

  const skipQuestion = useCallback(async () => {
    if (!state.isSessionActive || !state.currentMood || state.isPaused) return;

    showSuccess(t('questionSkipped'));
    setState(s => ({ ...s, isLoadingAI: true }));

    if (state.questionCount < state.maxQuestions) {
      const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
      setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
      addMessageToHistory('model', nextQuestion);
    } else {
      endSession();
    }
  }, [state.isSessionActive, state.currentMood, state.questionCount, state.maxQuestions, state.isPaused, state.conversationHistory, addMessageToHistory, getNextQuestion, endSession, t]);

  const discardSession = useCallback(async () => {
    if (!user || !state.currentEntryId) {
      showError(t('errorNoActiveSessionDiscard'));
      return;
    }

    setState(s => ({ ...s, isLoadingAI: true }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    const deleted = await journalService.deleteEntry(state.currentEntryId, t);

    if (!deleted) {
      showError(t('errorDiscardSession'));
    } else {
      showSuccess(t('journalingSessionDiscarded'));
      setState({
        currentMood: null,
        sessionType: null,
        conversationHistory: [],
        currentQuestion: '',
        entryText: '',
        questionCount: 0,
        maxQuestions: 0,
        isSessionActive: false,
        isLoadingAI: false,
        aiAnalysis: null,
        isOffline: !navigator.onLine,
        queuedResponses: [],
        currentEntryId: null,
        isSaving: false,
        isPaused: false,
      });
    }
    setState(s => ({ ...s, isLoadingAI: false }));
  }, [user, state.currentEntryId, t]);

  const pauseSession = useCallback(async () => {
    if (!state.isSessionActive) return;

    setState(s => ({ ...s, isPaused: true }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    await saveEntry('paused');
    showSuccess(t('sessionPausedSuccess'));
  }, [state.isSessionActive, saveEntry, t]);

  const resumeSession = useCallback(async () => {
    if (!state.isPaused) return;

    setState(s => ({ ...s, isPaused: false }));
    showSuccess(t('sessionResumedSuccess'));
    if (state.entryText.length > 0 && user && state.currentEntryId) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = window.setInterval(() => saveEntry('pending'), 30000);
    }
  }, [state.isPaused, state.entryText, user, state.currentEntryId, saveEntry, t]);


  const startSession = useCallback(async (mood: number, sessionType: SessionType) => {
    if (!user) {
      showError(t('errorLoginToStartSession'));
      return;
    }

    setState(s => ({ ...s, isLoadingAI: true, currentMood: mood, sessionType, maxQuestions: MAX_QUESTIONS_MAP[sessionType], isSessionActive: true, conversationHistory: [], entryText: '', questionCount: 0, aiAnalysis: null, currentEntryId: null, isSaving: false, isPaused: false }));
    addMessageToHistory('model', t('startSessionMessage', sessionType.replace('_', ' ')));

    const newEntryData: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'is_encrypted' | 'sync_status'> = {
      user_id: user.id,
      session_type: sessionType,
      mood_rating: mood,
      conversation: [],
      ai_analysis: null,
      entry_text: '',
      tags: null,
    };

    const newEntry = await journalService.createEntry(newEntryData, t);

    if (!newEntry) {
      showError(t('errorStartingSession'));
      setState(s => ({ ...s, isLoadingAI: false, isSessionActive: false }));
      return;
    }

    setState(s => ({ ...s, currentEntryId: newEntry.id }));

    const firstQuestion = await getNextQuestion(mood, []);
    setState(s => ({
      ...s,
      currentQuestion: firstQuestion,
      questionCount: 1,
      isLoadingAI: false,
    }));
    addMessageToHistory('model', firstQuestion);
    showSuccess(t('journalingSessionStarted'));
  }, [addMessageToHistory, getNextQuestion, user, t]);

  return {
    ...state,
    startSession,
    processUserResponse,
    skipQuestion,
    endSession,
    discardSession,
    pauseSession,
    resumeSession,
    addMessageToHistory,
    saveEntry,
  };
};