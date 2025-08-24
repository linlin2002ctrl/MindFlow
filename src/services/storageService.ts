import { openDB, IDBPDatabase } from 'idb';
import { JournalEntry } from './journalService';
import { Profile, UserPreferences } from './userService';
import { AiInsight } from './insightsService';
import { showError, showSuccess } from '@/utils/toast';
import { env } from '@/lib/env';
import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'mindflow-db';
const DB_VERSION = 2; // Increment database version to trigger upgrade

// Object store names
const JOURNAL_ENTRIES_STORE = 'journalEntries';
const AI_QUESTIONS_STORE = 'aiQuestions';
const USER_PREFERENCES_STORE = 'userPreferences';
const USER_PROFILES_STORE = 'userProfiles';
const AI_INSIGHTS_STORE = 'aiInsights';

let db: IDBPDatabase | null = null;
// Removed global encryptionKey: let encryptionKey: CryptoKey | null = null;

// --- IndexedDB Initialization ---
async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(JOURNAL_ENTRIES_STORE)) {
        const journalStore = db.createObjectStore(JOURNAL_ENTRIES_STORE, { keyPath: 'id' });
        journalStore.createIndex('sync_status', 'sync_status', { unique: false }); // Create index here
      } else if (oldVersion < 2) { // If upgrading from version 1 to 2
        const journalStore = transaction.objectStore(JOURNAL_ENTRIES_STORE);
        if (!journalStore.indexNames.contains('sync_status')) {
          journalStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
      }

      if (!db.objectStoreNames.contains(AI_QUESTIONS_STORE)) {
        db.createObjectStore(AI_QUESTIONS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(USER_PREFERENCES_STORE)) {
        db.createObjectStore(USER_PREFERENCES_STORE, { keyPath: 'user_id' });
      }
      if (!db.objectStoreNames.contains(USER_PROFILES_STORE)) {
        db.createObjectStore(USER_PROFILES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(AI_INSIGHTS_STORE)) {
        const insightsStore = db.createObjectStore(AI_INSIGHTS_STORE, { keyPath: 'id' });
        insightsStore.createIndex('sync_status', 'sync_status', { unique: false }); // Add sync_status index for insights
      } else if (oldVersion < 2) { // If upgrading from version 1 to 2
        const insightsStore = transaction.objectStore(AI_INSIGHTS_STORE);
        if (!insightsStore.indexNames.contains('sync_status')) {
          insightsStore.createIndex('sync_status', 'sync_status', { unique: false });
        }
      }
    },
  });
  return db;
}

// --- Encryption Utilities (Web Crypto API) ---
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const ENCRYPTION_KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

// Modified getEncryptionKey to always derive a new key for the given userId
async function getEncryptionKey(userId: string): Promise<CryptoKey> {
  // Derive a key from a combination of a fixed app secret and user ID
  // For a real-world app, consider a more robust key management strategy
  // involving user passwords or server-side key distribution.
  const keyMaterial = new TextEncoder().encode(`${env.geminiApiKey}-${userId}`); // Using Gemini API key as a shared secret for derivation
  const salt = new TextEncoder().encode(userId.substring(0, 16)); // Use part of user ID as salt

  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256',
    },
    baseKey,
    { name: ENCRYPTION_ALGORITHM, length: ENCRYPTION_KEY_LENGTH },
    true, // exportable
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

async function encryptData(data: string, userId: string): Promise<string> {
  const key = await getEncryptionKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    key,
    encoded
  );

  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...combined)); // Base64 encode
}

async function decryptData(encryptedData: string, userId: string): Promise<string> {
  const key = await getEncryptionKey(userId);
  const decoded = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const iv = decoded.slice(0, IV_LENGTH);
  const encrypted = decoded.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// --- Storage Service API ---
export const storageService = {
  // --- Journal Entries ---
  saveJournalEntry: async (entry: JournalEntry, userId: string): Promise<JournalEntry | null> => {
    try {
      const database = await initDB();
      const tx = database.transaction(JOURNAL_ENTRIES_STORE, 'readwrite');
      const store = tx.objectStore(JOURNAL_ENTRIES_STORE);

      // Encrypt sensitive fields
      const encryptedEntry = { ...entry };
      if (entry.entry_text) {
        encryptedEntry.entry_text = await encryptData(entry.entry_text, userId);
      }
      if (entry.conversation && Array.isArray(entry.conversation) && entry.conversation.length > 0) {
        encryptedEntry.conversation = await encryptData(JSON.stringify(entry.conversation), userId) as any; // Store as encrypted string
      }
      encryptedEntry.is_encrypted = true;

      await store.put(encryptedEntry);
      await tx.done;
      return encryptedEntry;
    } catch (error: any) {
      console.error("Error saving journal entry to IndexedDB:", error);
      showError(`Failed to save entry locally: ${error.message}`);
      return null;
    }
  },

  getJournalEntry: async (id: string, userId: string): Promise<JournalEntry | null> => {
    try {
      const database = await initDB();
      const entry = await database.get(JOURNAL_ENTRIES_STORE, id);
      if (entry && entry.is_encrypted) {
        // Decrypt sensitive fields
        if (entry.entry_text) {
          entry.entry_text = await decryptData(entry.entry_text, userId);
        }
        if (entry.conversation && typeof entry.conversation === 'string') {
          entry.conversation = JSON.parse(await decryptData(entry.conversation, userId));
        }
        entry.is_encrypted = false; // Mark as decrypted for use
      }
      return entry;
    } catch (error: any) {
      console.error("Error getting journal entry from IndexedDB:", error);
      showError(`Failed to retrieve entry locally: ${error.message}`);
      return null;
    }
  },

  getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
    try {
      const database = await initDB();
      const entries = await database.getAll(JOURNAL_ENTRIES_STORE);
      const decryptedEntries = await Promise.all(entries.map(async (entry) => {
        if (entry.is_encrypted) {
          if (entry.entry_text) {
            entry.entry_text = await decryptData(entry.entry_text, userId);
          }
          if (entry.conversation && typeof entry.conversation === 'string') {
            entry.conversation = JSON.parse(await decryptData(entry.conversation, userId));
          }
          entry.is_encrypted = false;
        }
        return entry;
      }));
      return decryptedEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error: any) {
      console.error("Error getting all journal entries from IndexedDB:", error);
      showError(`Failed to retrieve local entries: ${error.message}`);
      return [];
    }
  },

  deleteJournalEntry: async (id: string): Promise<boolean> => {
    try {
      const database = await initDB();
      await database.delete(JOURNAL_ENTRIES_STORE, id);
      return true;
    } catch (error: any) {
      console.error("Error deleting journal entry from IndexedDB:", error);
      showError(`Failed to delete local entry: ${error.message}`);
      return false;
    }
  },

  // --- AI Questions (Fallback) ---
  cacheAIQuestions: async (questions: string[]): Promise<void> => {
    try {
      const database = await initDB();
      const tx = database.transaction(AI_QUESTIONS_STORE, 'readwrite');
      const store = tx.objectStore(AI_QUESTIONS_STORE);
      await store.clear(); // Clear old questions
      for (const q of questions) {
        await store.add({ question: q, id: crypto.randomUUID() }); // Add with a unique ID
      }
      await tx.done;
    } catch (error: any) {
      console.error("Error caching AI questions:", error);
    }
  },

  getAIQuestions: async (): Promise<string[]> => {
    try {
      const database = await initDB();
      const questions = await database.getAll(AI_QUESTIONS_STORE);
      return questions.map(q => q.question);
    } catch (error: any) {
      console.error("Error retrieving cached AI questions:", error);
      return [];
    }
  },

  // New function to cache initial AI questions if the store is empty
  cacheInitialAIQuestions: async (initialQuestions: string[]): Promise<void> => {
    try {
      const database = await initDB();
      const count = await database.count(AI_QUESTIONS_STORE);
      if (count === 0) {
        console.log("Caching initial AI questions...");
        await storageService.cacheAIQuestions(initialQuestions);
      }
    } catch (error: any) {
      console.error("Error caching initial AI questions:", error);
    }
  },

  // --- User Preferences ---
  cacheUserPreferences: async (preferences: UserPreferences): Promise<UserPreferences | null> => {
    try {
      const database = await initDB();
      await database.put(USER_PREFERENCES_STORE, preferences);
      return preferences;
    } catch (error: any) {
      console.error("Error caching user preferences:", error);
      showError(`Failed to cache preferences locally: ${error.message}`);
      return null;
    }
  },

  getUserPreferences: async (userId: string): Promise<UserPreferences | null> => {
    try {
      const database = await initDB();
      return await database.get(USER_PREFERENCES_STORE, userId);
    } catch (error: any) {
      console.error("Error retrieving cached user preferences:", error);
      return null;
    }
  },

  // --- User Profiles ---
  cacheUserProfile: async (profile: Profile): Promise<Profile | null> => {
    try {
      const database = await initDB();
      await database.put(USER_PROFILES_STORE, profile);
      return profile;
    } catch (error: any) {
      console.error("Error caching user profile:", error);
      showError(`Failed to cache profile locally: ${error.message}`);
      return null;
    }
  },

  getUserProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const database = await initDB();
      return await database.get(USER_PROFILES_STORE, userId);
    } catch (error: any) {
      console.error("Error retrieving cached user profile:", error);
      return null;
    }
  },

  // --- AI Insights ---
  cacheAiInsight: async (insight: AiInsight): Promise<AiInsight | null> => {
    try {
      const database = await initDB();
      await database.put(AI_INSIGHTS_STORE, insight);
      return insight;
    } catch (error: any) {
      console.error("Error caching AI insight:", error);
      showError(`Failed to cache insight locally: ${error.message}`);
      return null;
    }
  },

  getAiInsights: async (userId: string): Promise<AiInsight[]> => {
    try {
      const database = await initDB();
      const insights = await database.getAll(AI_INSIGHTS_STORE);
      return insights.filter(insight => insight.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error: any) {
      console.error("Error retrieving cached AI insights:", error);
      return [];
    }
  },

  // --- Sync with Cloud ---
  syncWithCloud: async (userId: string): Promise<void> => {
    if (!navigator.onLine) {
      console.log("Still offline, cannot sync with cloud.");
      return;
    }

    console.log("Attempting to sync pending journal entries and AI insights with Supabase...");
    const database = await initDB();

    // Sync Journal Entries
    const journalTx = database.transaction(JOURNAL_ENTRIES_STORE, 'readwrite');
    const journalStore = journalTx.objectStore(JOURNAL_ENTRIES_STORE);
    const pendingJournalEntries = await journalStore.index('sync_status').getAll('pending');

    if (pendingJournalEntries && pendingJournalEntries.length > 0) {
      showSuccess(`Found ${pendingJournalEntries.length} pending journal entries. Syncing...`);
      for (const entry of pendingJournalEntries) {
        try {
          const decryptedEntry = { ...entry };
          if (entry.is_encrypted) {
            if (entry.entry_text) {
              decryptedEntry.entry_text = await decryptData(entry.entry_text, userId);
            }
            if (entry.conversation && typeof entry.conversation === 'string') {
              decryptedEntry.conversation = JSON.parse(await decryptData(entry.conversation, userId));
            }
            decryptedEntry.is_encrypted = false;
          }

          const { error } = await supabase
            .from('journal_entries')
            .upsert({ ...decryptedEntry, sync_status: 'synced' }, { onConflict: 'id' });

          if (error) throw error;

          await journalStore.put({ ...entry, sync_status: 'synced' });
          console.log(`Synced journal entry: ${entry.id}`);
        } catch (err: any) {
          console.error(`Failed to sync journal entry ${entry.id}:`, err.message);
          showError(`Failed to sync journal entry ${entry.id}: ${err.message}`);
        }
      }
      await journalTx.done;
      showSuccess("All pending journal entries synchronized!");
    } else {
      console.log("No pending journal entries to sync.");
    }

    // Sync AI Insights
    const insightsTx = database.transaction(AI_INSIGHTS_STORE, 'readwrite');
    const insightsStore = insightsTx.objectStore(AI_INSIGHTS_STORE);
    const pendingAiInsights = await insightsStore.index('sync_status').getAll('pending');

    if (pendingAiInsights && pendingAiInsights.length > 0) {
      showSuccess(`Found ${pendingAiInsights.length} pending AI insights. Syncing...`);
      for (const insight of pendingAiInsights) {
        try {
          const { error } = await supabase
            .from('ai_insights')
            .upsert({ ...insight, sync_status: 'synced' }, { onConflict: 'id' });

          if (error) throw error;

          await insightsStore.put({ ...insight, sync_status: 'synced' });
          console.log(`Synced AI insight: ${insight.id}`);
        } catch (err: any) {
          console.error(`Failed to sync AI insight ${insight.id}:`, err.message);
          showError(`Failed to sync AI insight ${insight.id}: ${err.message}`);
        }
      }
      await insightsTx.done;
      showSuccess("All pending AI insights synchronized!");
    } else {
      console.log("No pending AI insights to sync.");
    }
  },

  // --- Cleanup Old Data (Placeholder) ---
  cleanupOldData: async (): Promise<void> => {
    // This function would implement logic to remove old entries based on user preferences
    // or a predefined retention policy to manage storage quota.
    // For now, it's a placeholder.
    console.log("Cleanup old data: Not yet implemented.");
  },
};