import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import { I18nProvider, useTranslation } from './i18n/i18n.tsx'; // Import I18nProvider and useTranslation

// Create a wrapper component to use the translation hook
const MainApp = () => {
  const { t } = useTranslation();

  // Register the service worker and handle updates
  const updateSW = registerSW({
    onNeedRefresh() {
      toast.info(
        t('newVersionAvailable'),
        {
          action: {
            label: t('updateNow'),
            onClick: () => updateSW(true),
          },
          duration: Infinity,
          position: "top-center",
        }
      );
    },
    onOfflineReady() {
      toast.success(t('offlineReady'));
    },
    onRegistered(registration) {
      if (registration) {
        console.log('Service Worker registered:', registration);
      } else {
        console.log('Service Worker not registered.');
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
      toast.error(t('errorRegisteringOffline'));
    },
  });

  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <MainApp />
  </I18nProvider>
);