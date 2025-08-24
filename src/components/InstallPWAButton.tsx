import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import GlassCard from './GlassCard';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  const { user } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const trackPWAEvent = useCallback(async (eventType: string, eventData?: any) => {
    if (user) {
      const { error } = await supabase.from('pwa_install_events').insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
      });
      if (error) {
        console.error("Error tracking PWA event:", error.message);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      trackPWAEvent('beforeinstallprompt');
      toast.info("You can install MindFlow to your device!", {
        action: {
          label: "Install",
          onClick: () => handleInstallClick(),
        },
        duration: 10000,
      });
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      trackPWAEvent('appinstalled');
      toast.success("MindFlow has been installed! Enjoy offline access and quick launches.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed (e.g., if user opens from homescreen)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [trackPWAEvent]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      trackPWAEvent('install_prompt_response', { outcome });
      if (outcome === 'accepted') {
        toast.info("Installing MindFlow...");
      } else {
        toast.info("Installation dismissed.");
      }
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isAppInstalled) {
    return null; // Don't render if not installable or already installed
  }

  return (
    <GlassCard className="p-6 text-center">
      <h3 className="text-2xl font-semibold text-white mb-3 flex items-center justify-center gap-2">
        <Download className="h-6 w-6 text-mindflow-blue" /> Install MindFlow
      </h3>
      <p className="text-white/80 mb-4">
        Get the full app experience: offline access, faster loading, and quick launch from your home screen!
      </p>
      <Button
        onClick={handleInstallClick}
        className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white text-lg py-6"
        aria-label="Install MindFlow App"
      >
        <Sparkles className="h-5 w-5 mr-2" /> Install App
      </Button>
    </GlassCard>
  );
};

export default InstallPWAButton;