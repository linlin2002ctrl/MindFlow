import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { pushNotificationService } from '@/services/pushNotificationService';
import { toast } from 'sonner';
import { Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/i18n';

const SettingsPage: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const { t } = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);

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
      toast.error(t('errorLoginToManageNotifications'));
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
      setNotificationsEnabled(!checked);
    }
    setIsLoadingNotifications(false);
  };

  const handleSendTestNotification = async () => {
    if (!user) {
      toast.error(t('errorLoginToManageNotifications'));
      return;
    }
    if (!notificationsEnabled) {
      toast.info(t('infoEnableNotificationsFirst'));
      return;
    }

    setIsSendingTestNotification(true);
    const success = await pushNotificationService.sendTestNotification(
      user.id,
      t('mindFlowTestNotification'),
      t('testNotificationBody'),
      "/dashboard"
    );
    if (success) {
      toast.success(t('testNotificationSent'));
    } else {
      toast.error(t('errorSendingTestNotification'));
    }
    setIsSendingTestNotification(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">{t('settings')}</h1>
        <p className="text-lg text-white/80">{t('managePreferences')}</p>
        
        <div className="mt-8 space-y-6 text-white/90 text-left">
          <div className="flex items-center justify-between">
            <p>{t('language')}: English</p>
          </div>
          <div className="flex items-center justify-between">
            <p>{t('theme')}: Dark</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="text-lg">{t('pushNotifications')}</Label>
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

          {notificationsEnabled && (
            <Button
              onClick={handleSendTestNotification}
              className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white mt-4"
              disabled={isSendingTestNotification || isSessionLoading}
            >
              {isSendingTestNotification ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <BellRing className="mr-2 h-5 w-5" />
              )}
              {t('sendTestNotification')}
            </Button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;