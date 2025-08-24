import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { SessionContextProvider } from "./contexts/SessionContext";
import LoadingSpinner from "./components/LoadingSpinner"; // Import the new LoadingSpinner

// Eagerly loaded pages for initial experience
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";

// Lazy loaded pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const MoodTrackerPage = lazy(() => import("./pages/MoodTrackerPage"));
const AIConversationPage = lazy(() => import("./pages/AIConversationPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const ShareTargetPage = lazy(() => import("./pages/ShareTargetPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
            <Route path="/" element={<Index />} /> {/* Keep Index eagerly loaded */}
            <Route
              path="*"
              element={
                <AppLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/journal" element={<JournalPage />} />
                      <Route path="/mood-tracker" element={<MoodTrackerPage />} />
                      <Route path="/ai-conversation" element={<AIConversationPage />} />
                      <Route path="/insights" element={<InsightsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/goals" element={<GoalsPage />} />
                      <Route path="/share-target" element={<ShareTargetPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
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