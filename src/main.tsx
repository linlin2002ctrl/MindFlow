import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

// Register the service worker and handle updates
const updateSW = registerSW({
  onNeedRefresh() {
    toast.info(
      "A new version of MindFlow is available!",
      {
        action: {
          label: "Update Now",
          onClick: () => updateSW(true),
        },
        duration: Infinity, // Keep toast visible until user acts
        position: "top-center",
      }
    );
  },
  onOfflineReady() {
    toast.success("MindFlow is now available offline!");
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
    toast.error("Failed to register offline capabilities.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);