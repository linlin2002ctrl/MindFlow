import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { useTranslation } from '@/i18n/i18n.tsx';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession && window.location.pathname === '/login') {
          showSuccess(t('welcomeBackToast'));
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        showSuccess(t('signedOutToast'));
        navigate('/login');
      } else if (event === 'INITIAL_SESSION') {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (!currentSession && window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setIsLoading(false);
    });

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (!initialSession && window.location.pathname !== '/login') {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, t]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};