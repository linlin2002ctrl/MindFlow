import { format } from 'date-fns';

// Keywords for cultural sensitivity and detection
export const myanmarKeywords = {
  buddhism: ['ဗုဒ္ဓဘာသာ', 'တရားထိုင်', 'ဘုရား', 'ကျောင်း', 'ဘုန်းကြီး', 'ဓမ္မ'],
  family: ['မိသားစု', 'အဖေ', 'အမေ', 'မောင်နှမ', 'ဆွေမျိုး'],
  festival: ['ပွဲတော်', 'သင်္ကြန်', 'တန်ဆောင်တိုင်', 'ကထိန်', 'ဝါတွင်း'],
  stress: ['စိတ်ညစ်', 'စိတ်ဖိစီး', 'ပင်ပန်း', 'စိတ်ဓာတ်ကျ', 'စိတ်မကောင်း'],
  crisis: ['သေချင်တယ်', 'ကိုယ့်ကိုယ်ကိုသတ်သေ', 'အဆုံးစီရင်', 'မနေချင်တော့ဘူး', 'ဘဝကိုအဆုံးသတ်'],
};

// Myanmar festival dates (simplified for demonstration, actual dates vary yearly)
const myanmarFestivals = [
  { name_en: 'Thingyan (Water Festival)', name_my: 'သင်္ကြန်ပွဲတော်', month: 4, dayRange: [13, 17] },
  { name_en: 'Kason Full Moon Day', name_my: 'ကဆုန်လပြည့်နေ့', month: 5, dayRange: [1] }, // Approx. May 1st-15th
  { name_en: 'Waso Full Moon Day (Start of Buddhist Lent)', name_my: 'ဝါဆိုလပြည့်နေ့', month: 7, dayRange: [1] }, // Approx. July 1st-15th
  { name_en: 'Thadingyut (Festival of Lights)', name_my: 'သီတင်းကျွတ်ပွဲတော်', month: 10, dayRange: [1] }, // Approx. Oct 1st-15th
  { name_en: 'Tazaungdaing (Festival of Lights)', name_my: 'တန်ဆောင်တိုင်ပွဲတော်', month: 11, dayRange: [1] }, // Approx. Nov 1st-15th
];

/**
 * Detects if any cultural keywords are present in the user's input.
 * @param {string} text The user's input text.
 * @returns {string[]} An array of detected keyword categories.
 */
export const detectCulturalKeywords = (text: string): string[] => {
  const detectedCategories: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  for (const category in myanmarKeywords) {
    if (myanmarKeywords.hasOwnProperty(category)) {
      const keywords = myanmarKeywords[category as keyof typeof myanmarKeywords];
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedCategories.add(category);
      }
    }
  }
  return Array.from(detectedCategories);
};

/**
 * Detects if any crisis terms are present in the user's input.
 * @param {string} text The user's input text.
 * @returns {string[]} An array of detected crisis terms.
 */
export const detectCrisisTerms = (text: string): string[] => {
  const lowerText = text.toLowerCase();
  return myanmarKeywords.crisis.filter(term => lowerText.includes(term));
};

/**
 * Gets current Myanmar date information, including relevant festivals or seasons.
 * @param {Date} date The current date.
 * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
 * @returns {string} A string describing current Myanmar date context.
 */
export const getMyanmarDateInfo = (date: Date, t: (key: string, ...args: (string | number)[]) => string): string => {
  const currentMonth = date.getMonth() + 1; // getMonth() is 0-indexed
  const currentDay = date.getDate();
  let info = '';

  const matchingFestivals = myanmarFestivals.filter(festival => {
    // Simple month and day range check for demonstration
    if (festival.dayRange.length === 1) {
      return currentMonth === festival.month && currentDay === festival.dayRange[0];
    } else {
      return currentMonth === festival.month && currentDay >= festival.dayRange[0] && currentDay <= festival.dayRange[1];
    }
  });

  if (matchingFestivals.length > 0) {
    info += t('todayIsFestival', matchingFestivals.map(f => f.name_my).join(', '));
  }

  // Basic seasonal awareness (e.g., rainy season)
  if (currentMonth >= 6 && currentMonth <= 9) { // June to September
    info += (info ? ' ' : '') + t('currentlyRainySeason');
  }

  return info;
};

/**
 * Provides an empathetic crisis response with resources.
 * @param {(key: string, ...args: (string | number)[]) => string} t The translation function.
 * @returns {string} A crisis response message.
 */
export const getCrisisResponse = (t: (key: string, ...args: (string | number)[]) => string): string => {
  return t('crisisResponse', t('myanmarCrisisHotline'), t('myanmarCrisisHotlineLink'));
};