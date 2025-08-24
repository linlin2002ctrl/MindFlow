import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (user) {
        setIsLoadingNotifications(true);
        const isSubscribed = await pushNotificationService.isUserSubscribed(user.id);
        setNotificationsEnabled(isSubscribed);
        setIsLoadingNotifications(false);
      } else {
        setNotificationsEnabled(false);
        setIsLoadingNotifications(false);
      }
    };
    if (!isSessionLoading) {
      checkNotificationStatus();
    }
  }, [user, isSessionLoading]);

  const handleNotificationsToggle = async (checked: boolean) => {
    if (!user) {
      toast.error("Please log in to manage notification settings.");
      return;
    }

    setIsLoadingNotifications(true);
    let success = false;
    if (checked) {
      const subscription = await pushNotificationService.subscribeUser(user.id);
      success = !!subscription;
    } else {
      success = await pushNotificationService.unsubscribeUser(user.id);
    }

    if (success) {
      setNotificationsEnabled(checked);
    } else {
      // Revert toggle if action failed
      setNotificationsEnabled(!checked);
    }
    setIsLoadingNotifications(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Settings</h1>
        <p className="text-lg text-white/80">Manage your app preferences here.</p>
        
        <div className="mt-8 space-y-6 text-white/90 text-left">
          {/* Placeholder for other settings */}
          <div className="flex items-center justify-between">
            <p>Language: English</p>
          </div>
          <div className="flex items-center justify-between">
            <p>Theme: Dark</p>
          </div>

          {/* Push Notifications Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="text-lg">Push Notifications</Label>
            {isLoadingNotifications ? (
              <Loader2 className="h-5 w-5 animate-spin text-mindflow-blue" />
            ) : (
              <Switch
                id="push-notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsToggle}
                disabled={isSessionLoading}
                className="data-[state=checked]:bg-mindflow-blue data-[state=unchecked]:bg-white/30"
              />
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;