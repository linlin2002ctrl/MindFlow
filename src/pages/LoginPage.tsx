import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import GradientBackground from '@/components/GradientBackground';
import GlassCard from '@/components/GlassCard';
import { useSession } from '@/contexts/SessionContext';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <GradientBackground>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white text-xl">Loading authentication...</p>
        </div>
      </GradientBackground>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <GradientBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-center text-white mb-8">Welcome to MindFlow</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#8b5cf6', // MindFlow Blue
                    brandAccent: '#6366f1', // MindFlow Purple
                    brandButtonText: 'white',
                    defaultButtonBackground: 'rgba(255,255,255,0.1)',
                    defaultButtonBorder: 'rgba(255,255,255,0.2)',
                    defaultButtonText: 'white',
                    inputBackground: 'rgba(255,255,255,0.05)',
                    inputBorder: 'rgba(255,255,255,0.2)',
                    inputLabelText: 'white',
                    inputText: 'white',
                  },
                },
              },
            }}
            providers={[]} // No third-party providers unless specified
            theme="dark" // Using dark theme to match the gradient background
          />
        </GlassCard>
      </div>
    </GradientBackground>
  );
};

export default LoginPage;