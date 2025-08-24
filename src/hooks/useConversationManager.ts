import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateQuestion, analyzeResponse, suggestFollowUp } from '@/services/geminiService';
import { showSuccess, showError } from '@/utils/toast';

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
  });

  const autoSaveIntervalRef = useRef<number | null>(null);

  // Effect to handle online/offline status
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

  // Auto-save effect (placeholder)
  useEffect(() => {
    if (state.isSessionActive && state.entryText.length > 0) {
      autoSaveIntervalRef.current = window.setInterval(() => {
        // TODO: Implement actual auto-save to Supabase
        console.log("Auto-saving entry:", state.entryText.substring(0, 100) + "...");
        showSuccess("Entry auto-saved!");
      }, 30000); // Every 30 seconds
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
  }, [state.isSessionActive, state.entryText]);

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

  const startSession = useCallback(async (mood: number, sessionType: SessionType) => {
    setState(s => ({ ...s, isLoadingAI: true, currentMood: mood, sessionType, maxQuestions: MAX_QUESTIONS_MAP[sessionType], isSessionActive: true, conversationHistory: [], entryText: '', questionCount: 0, aiAnalysis: null }));
    addMessageToHistory('model', `Let's start your ${sessionType.replace('_', ' ')}!`);

    const firstQuestion = await getNextQuestion(mood, []);
    setState(s => ({
      ...s,
      currentQuestion: firstQuestion,
      questionCount: 1,
      isLoadingAI: false,
    }));
    addMessageToHistory('model', firstQuestion);
    showSuccess("Journaling session started!");
  }, [addMessageToHistory, getNextQuestion]);

  const processUserResponse = useCallback(async (userResponse: string) => {
    if (!state.isSessionActive || !state.currentMood) return;

    addMessageToHistory('user', userResponse);
    setState(s => ({ ...s, entryText: s.entryText + (s.entryText ? '\n\n' : '') + userResponse, isLoadingAI: true }));

    if (state.isOffline) {
      setState(s => ({ ...s, queuedResponses: [...s.queuedResponses, userResponse] }));
      if (state.questionCount < state.maxQuestions) {
        const nextOfflineQuestion = getOfflineQuestion(state.currentMood);
        setState(s => ({ ...s, currentQuestion: nextOfflineQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
        addMessageToHistory('model', nextOfflineQuestion);
      } else {
        endSession(); // End session if max questions reached offline
      }
      return;
    }

    // Process with AI when online
    if (state.questionCount < state.maxQuestions) {
      const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
      setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
      addMessageToHistory('model', nextQuestion);
    } else {
      endSession();
    }
  }, [state.isSessionActive, state.currentMood, state.entryText, state.questionCount, state.maxQuestions, state.isOffline, state.conversationHistory, addMessageToHistory, getNextQuestion]);

  const skipQuestion = useCallback(async () => {
    if (!state.isSessionActive || !state.currentMood) return;

    showSuccess("Question skipped.");
    setState(s => ({ ...s, isLoadingAI: true }));

    if (state.questionCount < state.maxQuestions) {
      const nextQuestion = await getNextQuestion(state.currentMood, state.conversationHistory);
      setState(s => ({ ...s, currentQuestion: nextQuestion, questionCount: s.questionCount + 1, isLoadingAI: false }));
      addMessageToHistory('model', nextQuestion);
    } else {
      endSession();
    }
  }, [state.isSessionActive, state.currentMood, state.questionCount, state.maxQuestions, state.conversationHistory, addMessageToHistory, getNextQuestion]);

  const endSession = useCallback(async () => {
    setState(s => ({ ...s, isLoadingAI: true, isSessionActive: false }));
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
      // TODO: Implement logic to send queuedResponses for analysis when online
    }

    setState(s => ({ ...s, aiAnalysis: finalAnalysis, isLoadingAI: false }));
    addMessageToHistory('model', `Session ended. Here's a summary of your entry: ${finalAnalysis}`);
    // TODO: Save the full entry and analysis to Supabase
    console.log("Final Entry:", state.entryText);
    console.log("AI Analysis:", finalAnalysis);
    showSuccess("Journaling session ended and entry saved!");
  }, [state.entryText, state.isOffline, addMessageToHistory]);

  return {
    ...state,
    startSession,
    processUserResponse,
    skipQuestion,
    endSession,
    addMessageToHistory, // Expose for initial AI greeting if needed
  };
};