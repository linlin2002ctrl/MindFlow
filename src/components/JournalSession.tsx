import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Easing, Variants } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConversationManager, SessionType } from '@/hooks/useConversationManager';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/GlassCard';
import { toast } from 'sonner';

// New imports
import MoodSelector from './MoodSelector';
import ResponseInput from './ResponseInput';
import SessionControls from './SessionControls';
import { Button } from '@/components/ui/button'; // Re-import Button for start session

// Animation variants for questions and messages
const questionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as Easing } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" as Easing } },
};

const messageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as Easing } },
};

const JournalSession: React.FC = () => {
  const {
    currentMood,
    sessionType,
    conversationHistory,
    currentQuestion,
    entryText,
    questionCount,
    maxQuestions,
    isSessionActive,
    isLoadingAI,
    aiAnalysis,
    isSaving,
    isPaused,
    startSession,
    processUserResponse,
    skipQuestion,
    endSession,
    discardSession,
    pauseSession,
    resumeSession,
  } = useConversationManager();

  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('standard_session');
  const [initialMood, setInitialMood] = useState<number>(5); // Default to neutral mood
  const [userResponse, setUserResponse] = useState<string>('');
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false); // Internal state for voice input
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition API setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserResponse(prev => prev + (prev ? ' ' : '') + transcript);
        setIsVoiceListening(false);
        toast.success("Voice input recorded!");
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Voice input error: ${event.error}`);
        setIsVoiceListening(false);
      };

      recognition.current.onend = () => {
        setIsVoiceListening(false);
      };
    }
  }, [SpeechRecognition]);

  // Scroll to bottom of conversation history
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isLoadingAI]);

  const handleStartSession = () => {
    if (initialMood && selectedSessionType) {
      startSession(initialMood, selectedSessionType);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleSubmitResponse = async () => {
    if (userResponse.trim() && !isLoadingAI) {
      await processUserResponse(userResponse);
      setUserResponse('');
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handleVoiceInputToggle = (listening: boolean) => {
    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice input.");
      return;
    }

    if (recognition.current) {
      if (listening) {
        try {
          recognition.current.start();
          setIsVoiceListening(true);
          toast.info("Listening for your response...");
          if (navigator.vibrate) navigator.vibrate(50);
        } catch (error) {
          console.error("Error starting speech recognition:", error);
          toast.error("Could not start voice input. Please check microphone permissions.");
          setIsVoiceListening(false);
        }
      } else {
        recognition.current.stop();
        setIsVoiceListening(false);
        toast.info("Voice input paused.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center full-screen-mode">
        <h1 className="text-4xl font-bold mb-4 text-white" aria-live="polite">
          {isSessionActive ? "MindFlow Journal" : "Start Your Flow"}
        </h1>
        <p className="text-lg text-white/80 mb-6">
          {isSessionActive ? "Let's explore your thoughts together." : "Begin a new journaling session."}
        </p>

        {!isSessionActive ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={questionVariants}
            className="space-y-6"
          >
            <MoodSelector
              initialMood={initialMood}
              onMoodChange={setInitialMood}
              disabled={isLoadingAI}
            />

            <SessionControls
              isSessionActive={isSessionActive}
              sessionType={selectedSessionType}
              onSessionTypeChange={setSelectedSessionType}
              questionCount={0} // Not relevant before session starts
              maxQuestions={0} // Not relevant before session starts
              isLoadingAI={isLoadingAI}
              isListening={isVoiceListening}
              onSkipQuestion={skipQuestion}
              onEndSession={endSession}
              onDiscardSession={discardSession}
              onPauseSession={pauseSession}
              disabled={isLoadingAI}
            />

            <Button
              onClick={handleStartSession}
              className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white text-lg py-6"
              disabled={isLoadingAI}
              aria-label="Start Journaling Session"
            >
              {isLoadingAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Start Journaling Session"}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            {!aiAnalysis && !isPaused && (
              <div className="w-full bg-white/10 rounded-full h-2.5 mb-4" role="progressbar" aria-valuenow={questionCount} aria-valuemin={0} aria-valuemax={maxQuestions} aria-label={`Question progress: ${questionCount} of ${maxQuestions}`}>
                <div
                  className="bg-mindflow-blue h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                ></div>
              </div>
            )}

            {isPaused ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={questionVariants}
                className="text-left text-white/90 p-4 bg-white/10 rounded-lg border border-white/20"
                role="region"
                aria-labelledby="paused-session-heading"
              >
                <h3 id="paused-session-heading" className="text-xl font-semibold mb-2">Session Paused</h3>
                <p>Your journaling session is currently paused. All progress has been saved.</p>
                <Button onClick={resumeSession} className="mt-4 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white" aria-label="Resume Session">
                  Resume Session
                </Button>
              </motion.div>
            ) : aiAnalysis ? (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={questionVariants}
                className="text-left text-white/90 p-4 bg-white/10 rounded-lg border border-white/20"
                role="region"
                aria-labelledby="ai-analysis-heading"
              >
                <h3 id="ai-analysis-heading" className="text-xl font-semibold mb-2">AI Analysis:</h3>
                <p>{aiAnalysis}</p>
                <Button onClick={() => window.location.reload()} className="mt-4 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white" aria-label="Start New Session">
                  Start New Session
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Conversation Interface */}
                <div className="h-64 overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10 mb-4 text-left flex flex-col gap-4 scrollbar-hide" aria-live="polite" aria-atomic="false">
                  <AnimatePresence initial={false}>
                    {conversationHistory.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={messageVariants}
                        className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] p-3 rounded-lg shadow-lg",
                            msg.role === 'user'
                              ? "bg-mindflow-blue text-white"
                              : "bg-white/10 text-white"
                          )}
                          role="status"
                        >
                          <span className="font-bold capitalize sr-only">{msg.role}:</span> {msg.parts[0].text}
                        </div>
                      </motion.div>
                    ))}
                    {isLoadingAI && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={messageVariants}
                        className="flex justify-start"
                      >
                        <div className="max-w-[80%] p-3 rounded-lg bg-white/10 text-white flex items-center gap-2" role="status" aria-label="AI is thinking">
                          <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking...
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={conversationEndRef} /> {/* Scroll target */}
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentQuestion} // Key change for re-animation
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={questionVariants}
                    className="text-white/90 text-xl font-semibold min-h-[3rem]" // min-h to prevent layout shift
                    aria-live="assertive"
                    aria-atomic="true"
                  >
                    {currentQuestion}
                  </motion.p>
                </AnimatePresence>
                <p className="text-sm text-white/70 mb-4" aria-live="polite">
                  Question {questionCount} of {maxQuestions}
                </p>

                {/* Response Input */}
                <ResponseInput
                  value={userResponse}
                  onChange={setUserResponse}
                  onSubmit={handleSubmitResponse}
                  onVoiceInputToggle={handleVoiceInputToggle}
                  isLoadingAI={isLoadingAI}
                  isListening={isVoiceListening}
                  isSaving={isSaving}
                  disabled={isPaused}
                />

                {/* Session Controls */}
                <SessionControls
                  isSessionActive={isSessionActive}
                  sessionType={sessionType}
                  onSessionTypeChange={setSelectedSessionType} // This won't be used when active, but required by prop
                  questionCount={questionCount}
                  maxQuestions={maxQuestions}
                  isLoadingAI={isLoadingAI}
                  isListening={isVoiceListening}
                  onSkipQuestion={skipQuestion}
                  onEndSession={endSession}
                  onDiscardSession={discardSession}
                  onPauseSession={pauseSession}
                  disabled={isPaused || isLoadingAI || isVoiceListening}
                />
              </>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default JournalSession;