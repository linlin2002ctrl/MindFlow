import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import JournalPage from "./pages/JournalPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import AIConversationPage from "./pages/AIConversationPage";
import InsightsPage from "./pages/InsightsPage";
import LoginPage from "./pages/LoginPage"; // Import the new LoginPage
import { SessionContextProvider } from "./contexts/SessionContext"; // Import the SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap the entire app with SessionContextProvider */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} /> {/* Add the login page route */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/mood-tracker" element={<MoodTrackerPage />} />
            <Route path="/ai-conversation" element={<AIConversationPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;