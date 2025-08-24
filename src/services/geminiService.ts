import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '@/lib/env';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(env.geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configure safety settings for content filtering
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Fallback questions for when the API is unavailable or offline
const fallbackQuestions: string[] = [
  "What's one thing that brought you joy today?",
  "If you could change one thing about your day, what would it be?",
  "What are you looking forward to tomorrow?",
  "Describe a moment today that made you feel grateful.",
  "What challenge did you face today, and how did you handle it?",
  "Is there anything on your mind that you haven't expressed yet?",
  "What's a small victory you had today?",
  "How did you show kindness to yourself or others today?",
  "What's a new idea or thought that crossed your mind?",
  "If your day had a theme song, what would it be and why?",
  "What's something you learned about yourself today?",
  "How did you connect with your inner self today?",
  "What's a feeling you experienced today that you want to explore more?",
  "What's one thing you're proud of from today?",
  "How did you recharge your energy today?",
  "What's a simple pleasure you enjoyed?",
  "What's a goal you're working towards, and how did today contribute to it?",
  "What's something you're curious about right now?",
  "How did you handle a moment of stress or discomfort?",
  "What's a dream or aspiration you're holding onto?",
  "What's a memory from today that you want to cherish?",
  "How did you express your creativity today?",
  "What's a boundary you set or respected today?",
  "What's a lesson you're taking away from today?",
  "How did you practice self-care today?",
  "What's something you're looking forward to this week?",
  "What's a new perspective you gained today?",
  "How did you challenge yourself today?",
  "What's a feeling you're trying to understand?",
  "What's a small act of courage you performed today?",
  "How did you connect with nature today?",
  "What's a thought that keeps coming back to you?",
  "What's a way you can be kinder to yourself?",
  "What's a moment of peace you found today?",
  "How did you make progress on something important?",
  "What's a fear you're facing, and how are you approaching it?",
  "What's a source of inspiration for you right now?",
  "How did you listen to your intuition today?",
  "What's a belief you hold that was reinforced today?",
  "What's a new habit you're trying to build?",
  "How did you celebrate a small win today?",
  "What's a way you can simplify your life?",
  "What's a relationship you're nurturing?",
  "How did you find balance today?",
  "What's a question you're pondering?",
  "What's a way you can bring more joy into your life?",
  "How did you embrace change today?",
  "What's a moment of clarity you experienced?",
  "What's a way you can be more present?",
  "What's a feeling you're grateful for, even if it's challenging?",
];

// Helper for retry logic with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && navigator.onLine) { // Only retry if online
      console.warn(`Retrying after error: ${error}. Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Generates a thoughtful journaling question based on the user's mood.
 * @param mood A number from 1-10 representing the user's mood (1=very sad, 10=very happy).
 * @returns A promise that resolves to a journaling question string.
 */
export async function generateQuestion(mood: number): Promise<string> {
  if (!navigator.onLine) {
    console.log("Offline: Using fallback questions.");
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }

  const prompt = `You are a friendly, empathetic AI journaling companion. Based on the user's mood (1-10 scale, 1 being very sad, 10 being very happy), generate one short, open-ended, and engaging journaling question. Avoid clinical or therapy language. Keep it conversational and encouraging. Mood: ${mood}`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const response = await chat.sendMessage(prompt);
      return response.response.text();
    });
    return result;
  } catch (error) {
    console.error("Error generating question from Gemini API, using fallback:", error);
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

/**
 * Analyzes a user's journal response for insights.
 * @param response The user's journal entry text.
 * @returns A promise that resolves to an analysis string.
 */
export async function analyzeResponse(response: string): Promise<string> {
  if (!response.trim()) {
    return "Please write something before I can analyze it!";
  }
  if (!navigator.onLine) {
    return "You are offline. Unable to analyze your response at this moment.";
  }

  const prompt = `You are an AI journaling assistant. Analyze the following journal entry for key themes, emotions, and potential patterns. Provide a concise, friendly, and non-clinical summary of insights. Avoid making direct recommendations or interpretations that sound like therapy. Focus on observations. Journal entry: "${response}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    });
    return result;
  } catch (error) {
    console.error("Error analyzing response from Gemini API:", error);
    return "I'm having trouble analyzing your response right now. Please try again later.";
  }
}

/**
 * Suggests the next question in a conversation based on history.
 * @param conversation An array of message objects with role and parts.
 * @returns A promise that resolves to a follow-up question string.
 */
export async function suggestFollowUp(conversation: { role: string; parts: { text: string }[] }[]): Promise<string> {
  if (!navigator.onLine) {
    return "You are offline. Unable to suggest a follow-up question.";
  }
  if (conversation.length === 0) {
    return generateQuestion(5); // Default to a neutral mood question if no history
  }

  const prompt = `You are a friendly AI journaling companion. Based on the following conversation history, suggest one short, empathetic, and open-ended follow-up question to encourage further reflection. Avoid clinical language. Conversation: ${JSON.stringify(conversation)}`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ history: conversation, safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    });
    return result;
  } catch (error) {
    console.error("Error suggesting follow-up from Gemini API:", error);
    return "What else is on your mind?"; // Generic fallback
  }
}

/**
 * Generates a weekly summary of journal patterns and insights.
 * @param journalEntries An array of user's journal entry texts.
 * @returns A promise that resolves to a summary of insights.
 */
export async function generateInsights(journalEntries: string[]): Promise<string> {
  if (journalEntries.length === 0) {
    return "No journal entries to generate insights from yet. Start writing!";
  }
  if (!navigator.onLine) {
    return "You are offline. Unable to generate insights at this moment.";
  }

  const combinedEntries = journalEntries.join("\n---\n");
  const prompt = `You are an AI journaling assistant. Based on the following journal entries, identify overarching emotional patterns, recurring themes, and any notable trends over time. Provide a friendly, non-clinical summary of these insights. Journal entries: "${combinedEntries}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    });
    return result;
  } catch (error) {
    console.error("Error generating insights from Gemini API:", error);
    return "I'm having trouble generating your insights right now. Please try again later.";
  }
}

/**
 * Generates personalized recommendations based on journal entries.
 * @param journalEntries An array of user's journal entry texts.
 * @returns A promise that resolves to an array of personalized recommendation strings.
 */
export async function generateRecommendations(journalEntries: string[]): Promise<string[]> {
  if (journalEntries.length === 0) {
    return ["Write your first entry to get personalized recommendations."];
  }
  if (!navigator.onLine) {
    return ["You are offline. Unable to generate recommendations at this moment."];
  }

  const combinedEntries = journalEntries.join("\n---\n");
  const prompt = `You are an AI personal growth coach. Based on the following journal entries, provide 3-5 concise, actionable, and personalized recommendations to help the user with their well-being and journaling practice. Focus on observations from their entries. Format the output as a numbered list. Journal entries: "${combinedEntries}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      const text = apiResponse.response.text();
      return text.split('\n').filter(line => line.trim().length > 0 && (line.startsWith('-') || line.match(/^\d+\./))).map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim());
    });
    return result;
  } catch (error) {
    console.error("Error generating recommendations from Gemini API:", error);
    return ["I'm having trouble generating recommendations right now. Please try again later."];
  }
}

// --- Privacy Note ---
// This service processes user input for analysis and question generation.
// It does not store sensitive user data directly within the API calls or on the Gemini service.
// Ensure that any data sent to the API is anonymized or handled according to your privacy policy.

// --- Rate Limiting Note ---
// Gemini API has rate limits. For a production application, consider implementing
// client-side rate limiting (e.g., using a debounce or throttle mechanism)
// or server-side rate limiting to prevent exceeding quotas.