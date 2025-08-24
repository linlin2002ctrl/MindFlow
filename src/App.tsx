import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import JournalPage from "./pages/JournalPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import AIConversationPage from "./pages/AIConversationPage";
import InsightsPage from "./pages/InsightsPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import GoalsPage from "./pages/GoalsPage";
import ShareTargetPage from "./pages/ShareTargetPage"; // Import the new ShareTargetPage
import { SessionContextProvider } from "./contexts/SessionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/share-target" element={<ShareTargetPage />} /> {/* Add the share target route */}
            <Route
              path="*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/journal" element={<JournalPage />} />
                    <Route path="/mood-tracker" element={<MoodTrackerPage />} />
                    <Route path="/ai-conversation" element={<AIConversationPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;