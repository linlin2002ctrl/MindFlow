import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Easing, Variants } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useConversationManager, SessionType } from '@/hooks/useConversationManager';
import { Loader2, Send, SkipForward, StopCircle, Mic, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/GlassCard';
import { toast } from 'sonner'; // Ensure sonner toast is imported

// Helper for mood emojis
const getMoodEmoji = (mood: number) => {
  if (mood <= 2) return '😔';
  if (mood <= 4) return '😟';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '😊';
  return '😄';
};

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
    startSession,
    processUserResponse,
    skipQuestion,
    endSession,
  } = useConversationManager();

  const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('standard_session');
  const [initialMood, setInitialMood] = useState<number>(5); // Default to neutral mood
  const [userResponse, setUserResponse] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false); // State for voice input
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const SWIPE_THRESHOLD = 50; // Minimum distance for a swipe

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
        setIsListening(false);
        toast.success("Voice input recorded!");
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Voice input error: ${event.error}`);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [SpeechRecognition]);

  // Auto-expanding textarea logic
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [userResponse]);

  // Scroll to bottom of conversation history
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, isLoadingAI]);

  const handleStartSession = () => {
    if (initialMood && selectedSessionType) {
      startSession(initialMood, selectedSessionType);
      // Haptic feedback for starting session
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleSubmitResponse = async () => {
    if (userResponse.trim() && !isLoadingAI) {
      await processUserResponse(userResponse);
      setUserResponse('');
      // Haptic feedback for sending message
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const handleVoiceInput = () => {
    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice input.");
      return;
    }

    if (recognition.current) {
      if (isListening) {
        recognition.current.stop();
        setIsListening(false);
        toast.info("Voice input paused.");
      } else {
        try {
          recognition.current.start();
          setIsListening(true);
          toast.info("Listening for your response...");
          if (navigator.vibrate) navigator.vibrate(50);
        } catch (error) {
          console.error("Error starting speech recognition:", error);
          toast.error("Could not start voice input. Please check microphone permissions.");
          setIsListening(false);
        }
      }
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX; // Reset endX on start
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSessionActive || isLoadingAI || aiAnalysis) return;

    const distance = touchEndX.current - touchStartX.current;
    if (distance > SWIPE_THRESHOLD) {
      // Swipe right detected
      skipQuestion();
      if (navigator.vibrate) navigator.vibrate(30);
      toast.info("Question skipped via swipe!");
    }
    // Reset touch positions
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Word count for response input
  const wordCount = userResponse.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard
        className="w-full max-w-2xl text-center full-screen-mode"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
            {/* MoodSelector */}
            <div className="flex flex-col items-center gap-4" role="group" aria-labelledby="mood-selector-label">
              <label id="mood-selector-label" htmlFor="mood-slider" className="text-white text-xl font-semibold">
                How are you feeling? {getMoodEmoji(initialMood)}
              </label>
              <Slider
                id="mood-slider"
                defaultValue={[initialMood]}
                max={10}
                min={1}
                step={1}
                onValueChange={(value) => setInitialMood(value[0])}
                className="w-full max-w-xs [&>span:first-child]:h-2 [&>span:first-child]:bg-white/30 [&>span:first-child]:rounded-full [&>span:first-child>span]:bg-mindflow-blue [&>span:first-child>span]:w-5 [&>span:first-child>span]:h-5 [&>span:first-child>span]:-mt-1.5 [&>span:first-child>span]:border-2 [&>span:first-child>span]:border-white"
                aria-valuenow={initialMood}
                aria-valuemin={1}
                aria-valuemax={10}
                aria-label={`Current mood: ${initialMood}`}
              />
              <span className="text-white text-2xl font-bold" aria-live="polite">{initialMood}</span>
            </div>

            {/* SessionTypeSelector */}
            <div className="flex flex-col items-center gap-4" role="group" aria-labelledby="session-type-label">
              <label id="session-type-label" htmlFor="session-type" className="text-white text-xl font-semibold">
                Choose Session Type:
              </label>
              <Select value={selectedSessionType} onValueChange={(value: SessionType) => setSelectedSessionType(value)}>
                <SelectTrigger id="session-type" className="w-full max-w-xs bg-white/10 border border-white/20 text-white" aria-label="Select journaling session type">
                  <SelectValue placeholder="Select a session type" />
                </SelectTrigger>
                <SelectContent className="bg-mindflow-purple/90 border border-white/20 text-white">
                  <SelectItem value="quick_checkin">Quick Check-in (3 questions)</SelectItem>
                  <SelectItem value="standard_session">Standard Session (5 questions)</SelectItem>
                  <SelectItem value="deep_dive">Deep Dive (7+ questions)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            {!aiAnalysis && (
              <div className="w-full bg-white/10 rounded-full h-2.5 mb-4" role="progressbar" aria-valuenow={questionCount} aria-valuemin={0} aria-valuemax={maxQuestions} aria-label={`Question progress: ${questionCount} of ${maxQuestions}`}>
                <div
                  className="bg-mindflow-blue h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(questionCount / maxQuestions) * 100}%` }}
                ></div>
              </div>
            )}

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

            {/* Session Summary or Question/Input */}
            {aiAnalysis ? (
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
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your response here..."
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-mindflow-blue resize-none overflow-hidden min-h-[4rem] pr-16"
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoadingAI || isListening}
                    aria-label="Your journal response"
                    rows={1}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-white/50" aria-live="polite">
                    {wordCount} words
                  </span>
                </div>

                {/* Session Controls */}
                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                  <Button
                    onClick={handleSubmitResponse}
                    className="flex-1 min-w-[120px] bg-mindflow-blue hover:bg-mindflow-purple text-white py-3"
                    disabled={isLoadingAI || !userResponse.trim() || isListening}
                    aria-label="Send response"
                  >
                    {isLoadingAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5 mr-2" /> Send</>}
                  </Button>
                  <Button
                    onClick={skipQuestion}
                    variant="outline"
                    className="min-w-[120px] bg-white/10 hover:bg-white/20 text-white border-white/20 py-3"
                    disabled={isLoadingAI || isListening}
                    aria-label="Skip question"
                  >
                    <SkipForward className="h-5 w-5 mr-2" /> Skip
                  </Button>
                  {/* Pause button - placeholder */}
                  <Button
                    onClick={() => toast.info("Pause feature coming soon!")}
                    variant="outline"
                    className="min-w-[120px] bg-white/10 hover:bg-white/20 text-white border-white/20 py-3"
                    disabled={isLoadingAI || isListening}
                    aria-label="Pause session"
                  >
                    <Pause className="h-5 w-5 mr-2" /> Pause
                  </Button>
                  {/* Voice Input button */}
                  <Button
                    onClick={handleVoiceInput}
                    variant="outline"
                    className={cn(
                      "min-w-[120px] bg-white/10 hover:bg-white/20 text-white border-white/20 py-3",
                      isListening && "bg-red-500/80 hover:bg-red-600 text-white"
                    )}
                    disabled={isLoadingAI}
                    aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  >
                    {isListening ? <StopCircle className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />} {isListening ? "Stop Listening" : "Voice"}
                  </Button>
                  <Button
                    onClick={endSession}
                    variant="destructive"
                    className="flex-1 min-w-[120px] bg-red-600/80 hover:bg-red-700 text-white py-3"
                    disabled={isLoadingAI || isListening}
                    aria-label="End session"
                  >
                    <StopCircle className="h-5 w-5 mr-2" /> End Session
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default JournalSession;