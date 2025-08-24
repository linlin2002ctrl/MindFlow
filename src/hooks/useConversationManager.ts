import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuestion, analyzeResponse, suggestFollowUp } from '@/services/geminiService';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';

export type SessionType = 'quick_checkin' | 'standard_session' | 'deep_dive';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ConversationState {
  currentMood: number | null; // 1-10 scale
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
  queuedResponses: string[]; // For offline responses
  currentEntryId: string | null; // Track the ID of the current journal entry
  isSaving: boolean; // New state for auto-save feedback
  isPaused: boolean; // New state for session pause
}

const MAX_QUESTIONS_MAP: Record<SessionType, number> = {
  quick_checkin: 3,
  standard_session: 5,
  deep_dive: 7,
};

// Pre-written questions for offline support, categorized by mood range
const OFFLINE_QUESTIONS = {
  low: [ // Mood 1-4
    "It sounds like you're going through a tough time. What's one small thing that might bring a tiny bit of comfort right now?",
    "Sometimes just acknowledging how we feel can be a big step. What's weighing most heavily on your mind today?",
    "It's okay not to be okay. Is there anything you've been avoiding that you'd like to talk about?",
    "When things feel heavy, sometimes a small distraction helps. What's something simple you could do for yourself?",
    "What's one thing you wish someone would understand about how you're feeling?",
  ],
  medium: [ // Mood 5-7
    "You seem to be navigating your day. What's one thing that went as expected today, or even a little better?",
    "What's a small moment from your day that you might not usually notice, but that stands out now?",
    "Is there anything you're looking forward to, even if it's just a small plan?",
    "What's a decision you made today, big or small, and how do you feel about it?",
    "What's something you're learning or curious about lately?",
  ],
  high: [ // Mood 8-10
    "That's wonderful to hear! What's the highlight of your day so far?",
    "What's something you're feeling particularly grateful for right now?",
    "How did you contribute to this positive feeling today, or what helped create it?",
    "What's a goal or dream that feels a little closer to reality when you're feeling this good?",
    "Is there anything you'd like to celebrate or acknowledge about your day?",
  ],
};

const getOfflineQuestion = (mood: number): string => {
  if (mood >= 8) return OFFLINE_QUESTIONS.high[Math.floor(Math.random() * OFFLINE_QUESTIONS.high.length)];
  if (mood >= 5) return OFFLINE_QUESTIONS.medium[Math.floor(Math.random() * OFFLINE_QUESTIONS.medium.length)];
  return OFFLINE_QUESTIONS.low[Math.floor(Math.random() * OFFLINE_QUESTIONS.low.length)];
};

export const useConversationManager = () => {
  const { user } = useSession();
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

  // Function to save the current entry
  const saveEntry = useCallback(async (status: 'pending' | 'synced' | 'paused') => {
    if (!user || !state.currentEntryId) {
      console.warn("Cannot save entry: User not authenticated or entry ID missing.");
      return;
    }

    setState(s => ({ ...s, isSaving: true }));
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          session_type: state.sessionType,
          mood_rating: state.currentMood,
          conversation: state.conversationHistory,
          ai_analysis: state.aiAnalysis ? { text: state.aiAnalysis } : {},
          is_encrypted: false,
          sync_status: state.isOffline ? 'pending' : status,
          updated_at: new Date().toISOString(),
          entry_text: state.entryText, // Save the full entry text
        })
        .eq('id', state.currentEntryId);

      if (error) {
        console.error("Error saving entry:", error);
        showError("Auto-save failed!");
      } else {
        console.log("Entry saved successfully.");
      }
    } catch (err) {
      console.error("Unexpected error saving entry:", err);
      showError("An unexpected error occurred while saving your entry.");
    } finally {
      setState(s => ({ ...s, isSaving: false }));
    }
  }, [user, state.currentEntryId, state.sessionType, state.currentMood, state.conversationHistory, state.aiAnalysis, state.isOffline, state.entryText]);


  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOffline: false }));
    const handleOffline = () => setState(s => ({ ...s, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (state.isSessionActive && state.entryText.length > 0 && user && state.currentEntryId && !state.isPaused) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = window.setInterval(() => saveEntry('pending'), 30000); // Auto-save every 30 seconds
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

  const addMessageToHistory = useCallback((role: 'user' | 'model', text: string) => {
    setState(s => ({
      ...s,
      conversationHistory: [...s.conversationHistory, { role, parts: [{ text }] }],
    }));
  }, []);

  const getNextQuestion = useCallback(async (mood: number, history: Message[]): Promise<string> => {
    if (state.isOffline) {
      return getOfflineQuestion(mood);
    }
    try {
      if (history.length === 0) {
        return await generateQuestion(mood);
      } else {
        return await suggestFollowUp(history);
      }
    } catch (error) {
      console.error("Error getting AI question, using fallback:", error);
      showError("Couldn't get an AI question, using a fallback.");
      return getOfflineQuestion(mood);
    }
  }, [state.isOffline]);

  const endSession = useCallback(async () => {
    setState(s => ({ ...s, isLoadingAI: true, isSessionActive: false, isPaused: false }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    let finalAnalysis = "No analysis available.";
    if (state.entryText.trim() && !state.isOffline) {
      try {
        finalAnalysis = await analyzeResponse(state.entryText);
        showSuccess("AI analysis complete!");
      } catch (error) {
        console.error("Error during final AI analysis:", error);
        showError("Couldn't get AI analysis. Please try again later.");
        finalAnalysis = "I'm having trouble analyzing your entry right now. Please try again later.";
      }
    } else if (state.isOffline) {
      finalAnalysis = "You are offline. Your entry will be analyzed when you're back online.";
    }

    setState(s => ({ ...s, aiAnalysis: finalAnalysis, isLoadingAI: false }));
    addMessageToHistory('model', `Session ended. Here's a summary of your entry: ${finalAnalysis}`);
    
    if (user && state.currentEntryId) {
      await saveEntry(state.isOffline ? 'pending' : 'synced');
      showSuccess("Journaling session ended and entry saved!");
    } else if (user && !state.currentEntryId) {
      // Fallback: if no ID was tracked, insert as a new entry
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          session_type: state.sessionType,
          mood_rating: state.currentMood,
          conversation: state.conversationHistory,
          ai_analysis: { text: finalAnalysis },
          is_encrypted: false,
          sync_status: state.isOffline ? 'pending' : 'synced',
          entry_text: state.entryText,
        });
      if (error) {
        console.error("Error saving fallback journal entry:", error);
        showError("Failed to save journal entry!");
      } else {
        showSuccess("Journaling session ended and entry saved!");
      }
    } else {
      showError("User not authenticated. Cannot save journal entry.");
    }
  }, [state.entryText, state.isOffline, state.sessionType, state.currentMood, state.conversationHistory, addMessageToHistory, user, state.currentEntryId, saveEntry]);

  const discardSession = useCallback(async () => {
    if (!user || !state.currentEntryId) {
      showError("No active session to discard or user not authenticated.");
      return;
    }

    setState(s => ({ ...s, isLoadingAI: true }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', state.currentEntryId)
        .eq('user_id', user.id); // Ensure only the user's own entry is deleted

      if (error) {
        console.error("Error discarding journal entry:", error);
        showError("Failed to discard session. Please try again.");
      } else {
        showSuccess("Journaling session discarded.");
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
    } catch (err) {
      console.error("Unexpected error discarding session:", err);
      showError("An unexpected error occurred while discarding your session.");
    } finally {
      setState(s => ({ ...s, isLoadingAI: false }));
    }
  }, [user, state.currentEntryId]);

  const pauseSession = useCallback(async () => {
    if (!state.isSessionActive) return;

    setState(s => ({ ...s, isPaused: true }));
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    await saveEntry('paused');
    showSuccess("Session paused. Your progress has been saved.");
  }, [state.isSessionActive, saveEntry]);

  const resumeSession = useCallback(async () => {
    if (!state.isPaused) return;

    setState(s => ({ ...s, isPaused: false }));
    showSuccess("Session resumed!");
    // Restart auto-save timer
    if (state.entryText.length > 0 && user && state.currentEntryId) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      autoSaveIntervalRef.current = window.setInterval(() => saveEntry('pending'), 30000);
    }
  }, [state.isPaused, state.entryText, user, state.currentEntryId, saveEntry]);


  const startSession = useCallback(async (mood: number, sessionType: SessionType) => {
    if (!user) {
      showError("Please log in to start a journaling session.");
      return;
    }

    setState(s => ({ ...s, isLoadingAI: true, currentMood: mood, sessionType, maxQuestions: MAX_QUESTIONS_MAP[sessionType], isSessionActive: true, conversationHistory: [], entryText: '', questionCount: 0, aiAnalysis: null, currentEntryId: null, isSaving: false, isPaused: false }));
    addMessageToHistory('model', `Let's start your ${sessionType.replace('_', ' ')}!`);

    // Create initial entry in Supabase to get an ID
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        session_type: sessionType,
        mood_rating: mood,
        conversation: [],
        ai_analysis: {},
        is_encrypted: false,
        sync_status: 'pending',
        entry_text: '', // Initialize with empty text
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating initial journal entry:", error);
      showError("Failed to start session. Please try again.");
      setState(s => ({ ...s, isLoadingAI: false, isSessionActive: false }));
      return;
    }

    setState(s => ({ ...s, currentEntryId: data.id }));

    const firstQuestion = await getNextQuestion(mood, []);
    setState(s => ({
      ...s,
      currentQuestion: firstQuestion,
      questionCount: 1,
      isLoadingAI: false,
    }));
    addMessageToHistory('model', firstQuestion);
    showSuccess("Journaling session started!");
  }, [addMessageToHistory, getNextQuestion, user]);

  const processUserResponse = useCallback(async (userResponse: string) => {
    if (!state.isSessionActive || !state.currentMood || state.isPaused) return;

    addMessageToHistory('user', userResponse);
    setState(s => ({ ...s, entryText: s.entryText + (s.entryText ? '\n\n' : '') + userResponse, isLoadingAI: true }));

    if (state.isOffline) {
      setState(s => ({ ...s, queuedResponses: [...s.queuedResponses, userResponse] }));
      if (state.questionCount < state.maxQuestions) {
        const nextOfflineQuestion = getOfflineQuestion(state.currentMood);
        setState(s => ({ ...s, currentQuestion: nextOfflineQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
        addMessageToHistory('model', nextOfflineQuestion);
      } else {
        endSession();
      }
      return;
    }

    if (state.questionCount < state.maxQuestions) {
      const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
      setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
      addMessageToHistory('model', nextQuestion);
    } else {
      endSession();
    }
  }, [state.isSessionActive, state.currentMood, state.entryText, state.questionCount, state.maxQuestions, state.isOffline, state.isPaused, state.conversationHistory, addMessageToHistory, getNextQuestion, endSession]);

  const skipQuestion = useCallback(async () => {
    if (!state.isSessionActive || !state.currentMood || state.isPaused) return;

    showSuccess("Question skipped.");
    setState(s => ({ ...s, isLoadingAI: true }));

    if (state.questionCount < state.maxQuestions) {
      const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
      setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
      addMessageToHistory('model', nextQuestion);
    } else {
      endSession();
    }
  }, [state.isSessionActive, state.currentMood, state.questionCount, state.maxQuestions, state.isPaused, state.conversationHistory, addMessageToHistory, getNextQuestion, endSession]);

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
    saveEntry, // Expose saveEntry for manual saves if needed
  };
};