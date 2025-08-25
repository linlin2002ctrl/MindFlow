import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '@/lib/env';
import { showError } from '@/utils/toast';
import { detectCulturalKeywords, detectCrisisTerms, getMyanmarDateInfo, getCrisisResponse, myanmarKeywords } from '@/utils/myanmarCulturalUtils'; // Import new utilities

const genAI = new GoogleGenerativeAI(env.geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

async function withRetry<T>(fn: () => Promise<T>, t: (key: string, ...args: (string | number)[]) => string, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && navigator.onLine) {
      console.warn(`Retrying after error: ${error}. Retries left: ${retries}`);
      await new Promise(res => setTimeout(res, delay));
      return withRetry(fn, t, retries - 1, delay * 2);
    }
    showError(t('errorGeminiOperationFailed'));
    throw error;
  }
}

export async function generateQuestion(mood: number, t: (key: string, ...args: (string | number)[]) => string): Promise<string> {
  if (!navigator.onLine) {
    console.log("Offline: Using fallback questions.");
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }

  const myanmarDateInfo = getMyanmarDateInfo(new Date(), t);
  const culturalContext = myanmarDateInfo ? ` Today's context: ${myanmarDateInfo}.` : '';

  const prompt = `You are a friendly, empathetic AI journaling companion for users in Myanmar. Use respectful, community-centered language, addressing the user as "သင်" (thin). Where appropriate, subtly incorporate Buddhist or traditional Myanmar cultural references. Based on the user's mood (1-10 scale, 1 being very sad, 10 being very happy), generate one short, open-ended, and engaging journaling question. Avoid clinical or therapy language. Keep it conversational and encouraging.${culturalContext} Mood: ${mood}`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const response = await chat.sendMessage(prompt);
      return response.response.text();
    }, t);
    return result;
  } catch (error) {
    console.error("Error generating question from Gemini API, using fallback:", error);
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
  }
}

export async function analyzeResponse(response: string, t: (key: string, ...args: (string | number)[]) => string): Promise<string> {
  if (!response.trim()) {
    return t('pleaseWriteSomething');
  }

  // Crisis detection
  const crisisDetected = detectCrisisTerms(response).length > 0;
  if (crisisDetected) {
    return getCrisisResponse(t);
  }

  if (!navigator.onLine) {
    return t('errorAnalyzingResponseOffline');
  }

  const detectedStress = detectCulturalKeywords(response).includes('stress');
  const culturalKeywords = detectCulturalKeywords(response).filter(cat => cat !== 'stress' && cat !== 'crisis');
  let culturalPromptAdditions = '';

  if (detectedStress) {
    culturalPromptAdditions += ` The user seems to be experiencing stress. Suggest a gentle, culturally appropriate coping mechanism like "မေတ္တာ ဘာဝနာ တရားထိုင်ကြည့်ပါ" (try Metta meditation) or focusing on community support.`;
  }
  if (culturalKeywords.length > 0) {
    culturalPromptAdditions += ` User mentioned themes like ${culturalKeywords.join(', ')}. Incorporate these into the analysis with relevant Myanmar cultural perspectives.`;
  }

  const prompt = `You are an AI journaling assistant for users in Myanmar. Analyze the following journal entry for key themes, emotions, and potential patterns. Provide a concise, friendly, and non-clinical summary of insights, subtly incorporating Buddhist or traditional Myanmar cultural perspectives and wellness concepts where appropriate. Avoid making direct recommendations or interpretations that sound like therapy. Focus on observations.${culturalPromptAdditions} Journal entry: "${response}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    }, t);
    return result;
  } catch (error) {
    console.error("Error analyzing response from Gemini API:", error);
    return t('errorAnalyzingResponse');
  }
}

export async function suggestFollowUp(conversation: { role: string; parts: { text: string }[] }[], t: (key: string, ...args: (string | number)[]) => string): Promise<string> {
  if (!navigator.onLine) {
    return t('errorSuggestingFollowUpOffline');
  }
  if (conversation.length === 0) {
    return generateQuestion(5, t);
  }

  // Use filter and slice(-1)[0] for broader compatibility
  const lastUserMessage = conversation.filter(msg => msg.role === 'user').slice(-1)[0]?.parts[0].text || '';

  // Crisis detection in the last user message
  const crisisDetected = detectCrisisTerms(lastUserMessage).length > 0;
  if (crisisDetected) {
    return getCrisisResponse(t);
  }

  const detectedStress = detectCulturalKeywords(lastUserMessage).includes('stress');
  const culturalKeywords = detectCulturalKeywords(lastUserMessage).filter(cat => cat !== 'stress' && cat !== 'crisis');
  let culturalPromptAdditions = '';

  if (detectedStress) {
    culturalPromptAdditions += ` The user seems to be experiencing stress. Suggest a gentle, culturally appropriate coping mechanism or a question that encourages self-compassion.`;
  }
  if (culturalKeywords.length > 0) {
    culturalPromptAdditions += ` User mentioned themes like ${culturalKeywords.join(', ')}. Incorporate these into the follow-up question with relevant Myanmar cultural perspectives.`;
  }

  const prompt = `You are a friendly, empathetic AI journaling companion for users in Myanmar. Use respectful, community-centered language, addressing the user as "သင်" (thin). Based on the following conversation history, suggest one short, empathetic, and open-ended follow-up question to encourage further reflection. Avoid clinical language.${culturalPromptAdditions} Conversation: ${JSON.stringify(conversation)}`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ history: conversation, safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    }, t);
    return result;
  } catch (error) {
    console.error("Error suggesting follow-up from Gemini API:", error);
    return t('whatElseOnMind');
  }
}

export async function generateInsights(journalEntries: string[], t: (key: string, ...args: (string | number)[]) => string): Promise<string> {
  if (journalEntries.length === 0) {
    return t('noJournalEntriesForInsights');
  }
  if (!navigator.onLine) {
    return t('errorGeneratingInsightsOffline');
  }

  const combinedEntries = journalEntries.join("\n---\n");
  const prompt = `You are an AI journaling assistant for users in Myanmar. Based on the following journal entries, identify overarching emotional patterns, recurring themes, and any notable trends over time. Provide a friendly, non-clinical summary of these insights, subtly incorporating Buddhist or traditional Myanmar cultural perspectives and wellness concepts where appropriate. Journal entries: "${combinedEntries}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      return apiResponse.response.text();
    }, t);
    return result;
  } catch (error) {
    console.error("Error generating insights from Gemini API:", error);
    return t('errorGeneratingInsights');
  }
}

export async function generateRecommendations(journalEntries: string[], t: (key: string, ...args: (string | number)[]) => string): Promise<string[]> {
  if (journalEntries.length === 0) {
    return [t('writeFirstEntryForRecommendations')];
  }
  if (!navigator.onLine) {
    return [t('errorGeneratingRecommendationsOffline')];
  }

  const combinedEntries = journalEntries.join("\n---\n");
  const prompt = `You are an AI personal growth coach for users in Myanmar. Based on the following journal entries, provide 3-5 concise, actionable, and personalized recommendations to help the user with their well-being and journaling practice. Incorporate traditional Myanmar wellness concepts and community-centered advice where relevant. Focus on observations from their entries. Format the output as a numbered list. Journal entries: "${combinedEntries}"`;

  try {
    const result = await withRetry(async () => {
      const chat = model.startChat({ safetySettings });
      const apiResponse = await chat.sendMessage(prompt);
      const text = apiResponse.response.text();
      return text.split('\n').filter(line => line.trim().length > 0 && (line.startsWith('-') || line.match(/^\d+\./))).map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim());
    }, t);
    return result;
  } catch (error) {
    console.error("Error generating recommendations from Gemini API:", error);
    return [t('errorGeneratingRecommendations')];
  }
}