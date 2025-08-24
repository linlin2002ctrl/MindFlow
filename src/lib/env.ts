// src/lib/env.ts

interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
}

const getEnv = (): EnvConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_SUPABASE_URL environment variable.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable.");
  }
  if (!geminiApiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    geminiApiKey,
  };
};

export const env = getEnv();