import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, LineChart, TrendingUp, Lightbulb, Target, CalendarDays, Sparkles, Loader2, Book } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSession } from '@/contexts/SessionContext';
import { journalService, JournalEntry } from '@/services/journalService';
import { goalsService, UserGoal } from '@/services/goalsService';
import { generateInsights, generateRecommendations } from '@/services/geminiService';
import MoodChart from '@/components/dashboard/MoodChart';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InsightsDashboardProps { }

const InsightsDashboard: React.FC<InsightsDashboardProps> = () => {
  const { user } = useSession();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'mood' | 'themes' | 'goals'>('overview');

  const fetchInsightsData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const entries = await journalService.getEntriesByUser(user.id);
      setJournalEntries(entries || []);

      const goals = await goalsService.getGoalsByUser(user.id);
      setUserGoals(goals || []);

      if (entries && entries.length > 0) {
        const entryTexts = entries.map(entry => entry.entry_text || '').filter(Boolean) as string[];
        const summary = await generateInsights(entryTexts);
        setAiSummary(summary);

        const recommendations = await generateRecommendations(entryTexts);
        setAiRecommendations(recommendations);
      } else {
        setAiSummary("Start journaling to unlock your personal insights!");
        setAiRecommendations(["Write your first entry to get personalized recommendations."]);
      }
    } catch (error) {
      console.error("Failed to fetch insights data:", error);
      toast.error("Failed to load insights. Please try again later.");
      setAiSummary("Failed to load AI insights. Please check your connection and try again.");
      setAiRecommendations(["Failed to load recommendations."]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

  // Calculate journaling streak
  const calculateStreak = useCallback(() => {
    if (journalEntries.length === 0) return 0;

    const sortedDates = journalEntries
      .map(entry => new Date(entry.created_at))
      .sort((a, b) => a.getTime() - b.getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let lastDate: Date | null = null;

    for (const date of sortedDates) {
      if (lastDate === null) {
        currentStreak = 1;
      } else if (isSameDay(date, lastDate)) {
        // Same day, do nothing
      } else if (date.getTime() - lastDate.getTime() === 24 * 60 * 60 * 1000) { // Exactly one day after
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      lastDate = date;
    }
    return longestStreak;
  }, [journalEntries]);

  const longestStreak = calculateStreak();

  // Extract common themes (simple word frequency for now)
  const getCommonThemes = useCallback(() => {
    const allText = journalEntries.map(entry => entry.entry_text || '').join(' ').toLowerCase();
    const words = allText.split(/\W+/).filter(word => word.length > 3 && !['the', 'and', 'for', 'that', 'this', 'with', 'from', 'what', 'have', 'been', 'just', 'like', 'feel', 'today', 'about', 'mindflow'].includes(word));
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    const sortedThemes = Object.entries(wordCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 10)
      .map(([word]) => word);
    return sortedThemes;
  }, [journalEntries]);

  const commonThemes = getCommonThemes();

  // Prepare mood data for MoodChart (assuming MoodChart can take JournalEntry data)
  const moodChartData = journalEntries
    .filter(entry => entry.mood_rating !== null)
    .map(entry => ({
      name: format(new Date(entry.created_at), 'MMM dd'),
      moodScore: entry.mood_rating!,
    }))
    .reverse(); // Show chronologically

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-4xl space-y-6">
        <GlassCard className="text-center p-6">
          <h1 className="text-4xl font-bold mb-4 text-white flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-mindflow-blue" /> Your MindFlow Insights
          </h1>
          <p className="text-lg text-white/80">
            Discover patterns, track your growth, and get personalized guidance.
          </p>
        </GlassCard>

        {isLoading ? (
          <GlassCard className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-mindflow-blue mx-auto mb-4" />
            <p className="text-white/70">Loading your insights...</p>
          </GlassCard>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex justify-center gap-2 mb-6">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('overview')}
                className={cn("text-white hover:bg-white/20", activeTab === 'overview' && "bg-white/20 text-mindflow-blue")}
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('mood')}
                className={cn("text-white hover:bg-white/20", activeTab === 'mood' && "bg-white/20 text-mindflow-blue")}
              >
                Mood
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('themes')}
                className={cn("text-white hover:bg-white/20", activeTab === 'themes' && "bg-white/20 text-mindflow-blue")}
              >
                Themes
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('goals')}
                className={cn("text-white hover:bg-white/20", activeTab === 'goals' && "bg-white/20 text-mindflow-blue")}
              >
                Goals
              </Button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* AI Summary */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-mindflow-blue" /> AI Summary
                  </h2>
                  <p className="text-white/90">{aiSummary}</p>
                </GlassCard>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="p-6 text-center">
                    <CalendarDays className="h-10 w-10 text-mindflow-blue mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-1">Journaling Streak</h3>
                    <p className="text-4xl font-bold text-white">{longestStreak} days</p>
                    <p className="text-white/70">Your longest consecutive journaling run.</p>
                  </GlassCard>
                  <GlassCard className="p-6 text-center">
                    <Book className="h-10 w-10 text-mindflow-blue mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-1">Total Entries</h3>
                    <p className="text-4xl font-bold text-white">{journalEntries.length}</p>
                    <p className="text-white/70">The total number of entries you've made.</p>
                  </GlassCard>
                </div>

                {/* Personalized Recommendations */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-mindflow-blue" /> Personalized Recommendations
                  </h2>
                  <ul className="list-disc list-inside text-white/90 space-y-2">
                    {aiRecommendations.length > 0 ? (
                      aiRecommendations.map((rec, index) => <li key={index}>{rec}</li>)
                    ) : (
                      <li>No recommendations yet. Keep journaling!</li>
                    )}
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'mood' && (
              <div className="space-y-6">
                {/* Mood Trends Chart */}
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <LineChart className="h-6 w-6 text-mindflow-blue" /> Mood Trends
                  </h2>
                  {moodChartData.length > 1 ? (
                    <MoodChart data={moodChartData} />
                  ) : (
                    <p className="text-white/70 text-center">Not enough mood data yet. Log more moods!</p>
                  )}
                </GlassCard>

                {/* Emotional Patterns (Placeholder) */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-mindflow-blue" /> Emotional Patterns
                  </h2>
                  <p className="text-white/90">
                    (Feature coming soon: Analyze when you feel best/worst during the week.)
                  </p>
                  <ul className="list-disc list-inside text-white/90 space-y-2 mt-4">
                    <li>You seem happiest on weekends.</li>
                    <li>Work stress appears most on Mondays.</li>
                    <li>Your mood improved 20% this month.</li>
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="space-y-6">
                {/* Common Themes */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Book className="h-6 w-6 text-mindflow-blue" /> Common Themes
                  </h2>
                  {commonThemes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {commonThemes.map((theme, index) => (
                        <span key={index} className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                          {theme}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70">No common themes identified yet. Keep writing!</p>
                  )}
                </GlassCard>

                {/* Growth Tracking (Placeholder) */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-mindflow-blue" /> Growth Tracking
                  </h2>
                  <p className="text-white/90">
                    (Feature coming soon: Track personal development milestones over time.)
                  </p>
                  <ul className="list-disc list-inside text-white/90 space-y-2 mt-4">
                    <li>You've mentioned 'gratitude' 15 times this week.</li>
                    <li>Your longest writing streak was 12 days.</li>
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6">
                {/* Goal Progress */}
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="h-6 w-6 text-mindflow-blue" /> Your Goals
                  </h2>
                  {userGoals.length > 0 ? (
                    <div className="space-y-4">
                      {userGoals.map((goal) => (
                        <div key={goal.id} className="bg-white/10 p-4 rounded-lg border border-white/20">
                          <h4 className="text-lg font-semibold text-white">{goal.title}</h4>
                          <p className="text-white/80 text-sm mb-2">{goal.description}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={goal.progress} className="w-full h-2 bg-white/30" />
                            <span className="text-white/90 text-sm">{goal.progress}%</span>
                          </div>
                          {goal.target_date && (
                            <p className="text-white/70 text-xs mt-2">Target: {format(parseISO(goal.target_date), 'MMM dd, yyyy')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70">No goals set yet. Start setting some goals to track your progress!</p>
                  )}
                  <Link to="/goals"> {/* Link to the new GoalsPage */}
                    <Button className="mt-6 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
                      Manage Goals
                    </Button>
                  </Link>
                </GlassCard>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InsightsDashboard;