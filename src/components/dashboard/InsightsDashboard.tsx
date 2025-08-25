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
import MoodChart from './MoodChart';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/i18n';

interface InsightsDashboardProps { }

const InsightsDashboard: React.FC<InsightsDashboardProps> = () => {
  const { user } = useSession();
  const { t } = useTranslation();
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
      const entries = await journalService.getEntriesByUser(user.id, t);
      setJournalEntries(entries || []);

      const goals = await goalsService.getGoalsByUser(user.id, t);
      setUserGoals(goals || []);

      if (entries && entries.length > 0) {
        const entryTexts = entries.map(entry => entry.entry_text || '').filter(Boolean) as string[];
        const summary = await generateInsights(entryTexts, t);
        setAiSummary(summary);

        const recommendations = await generateRecommendations(entryTexts, t);
        setAiRecommendations(recommendations);
      } else {
        setAiSummary(t('startJournalingToUnlockInsights'));
        setAiRecommendations([t('writeFirstEntryForRecommendations')]);
      }
    } catch (error) {
      console.error("Failed to fetch insights data:", error);
      toast.error(t('errorLoadingInsights'));
      setAiSummary(t('errorLoadingAIInsights'));
      setAiRecommendations([t('errorLoadingRecommendations')]);
    } finally {
      setIsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchInsightsData();
  }, [fetchInsightsData]);

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
      } else if (date.getTime() - lastDate.getTime() === 24 * 60 * 60 * 1000) {
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

  const moodChartData = journalEntries
    .filter(entry => entry.mood_rating !== null)
    .map(entry => ({
      name: format(new Date(entry.created_at), 'MMM dd'),
      moodScore: entry.mood_rating!,
    }))
    .reverse();

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-4xl space-y-6">
        <GlassCard className="text-center p-6">
          <h1 className="text-4xl font-bold mb-4 text-white flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-mindflow-blue" /> {t('yourMindFlowInsights')}
          </h1>
          <p className="text-lg text-white/80">
            {t('insightsDescription')}
          </p>
        </GlassCard>

        {isLoading ? (
          <GlassCard className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-mindflow-blue mx-auto mb-4" />
            <p className="text-white/70">{t('loadingInsights')}</p>
          </GlassCard>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-6">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('overview')}
                className={cn("text-white hover:bg-white/20", activeTab === 'overview' && "bg-white/20 text-mindflow-blue")}
              >
                {t('overview')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('mood')}
                className={cn("text-white hover:bg-white/20", activeTab === 'mood' && "bg-white/20 text-mindflow-blue")}
              >
                {t('mood')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('themes')}
                className={cn("text-white hover:bg-white/20", activeTab === 'themes' && "bg-white/20 text-mindflow-blue")}
              >
                {t('themes')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('goals')}
                className={cn("text-white hover:bg-white/20", activeTab === 'goals' && "bg-white/20 text-mindflow-blue")}
              >
                {t('goals')}
              </Button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-mindflow-blue" /> {t('aiSummary')}
                  </h2>
                  <p className="text-white/90">{aiSummary}</p>
                </GlassCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="p-6 text-center">
                    <CalendarDays className="h-10 w-10 text-mindflow-blue mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-1">{t('journalingStreak')}</h3>
                    <p className="text-4xl font-bold text-white">{t('days', longestStreak)}</p>
                    <p className="text-white/70">{t('longestConsecutiveRun')}</p>
                  </GlassCard>
                  <GlassCard className="p-6 text-center">
                    <Book className="h-10 w-10 text-mindflow-blue mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-white mb-1">{t('totalEntries')}</h3>
                    <p className="text-4xl font-bold text-white">{journalEntries.length}</p>
                    <p className="text-white/70">{t('totalEntriesDescription')}</p>
                  </GlassCard>
                </div>

                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-mindflow-blue" /> {t('personalizedRecommendations')}
                  </h2>
                  <ul className="list-disc list-inside text-white/90 space-y-2">
                    {aiRecommendations.length > 0 ? (
                      aiRecommendations.map((rec, index) => <li key={index}>{rec}</li>)
                    ) : (
                      <li>{t('noRecommendationsYet')}</li>
                    )}
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'mood' && (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                    <LineChart className="h-6 w-6 text-mindflow-blue" /> {t('moodTrends')}
                  </h2>
                  {moodChartData.length > 1 ? (
                    <MoodChart data={moodChartData} />
                  ) : (
                    <p className="text-white/70 text-center">{t('notEnoughMoodData')}</p>
                  )}
                </GlassCard>

                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart2 className="h-6 w-6 text-mindflow-blue" /> {t('emotionalPatterns')}
                  </h2>
                  <p className="text-white/90">
                    {t('featureComingSoon')}
                  </p>
                  <ul className="list-disc list-inside text-white/90 space-y-2 mt-4">
                    <li>{t('happiestOnWeekends')}</li>
                    <li>{t('workStressOnMondays')}</li>
                    <li>{t('moodImprovedThisMonth')}</li>
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'themes' && (
              <div className="space-y-6">
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Book className="h-6 w-6 text-mindflow-blue" /> {t('commonThemes')}
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
                    <p className="text-white/70">{t('noCommonThemes')}</p>
                  )}
                </GlassCard>

                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-mindflow-blue" /> {t('growthTracking')}
                  </h2>
                  <p className="text-white/90">
                    {t('growthTrackingDescription')}
                  </p>
                  <ul className="list-disc list-inside text-white/90 space-y-2 mt-4">
                    <li>{t('gratitudeMentioned', 15)}</li>
                    <li>{t('longestWritingStreak', 12)}</li>
                  </ul>
                </GlassCard>
              </div>
            )}

            {activeTab === 'goals' && (
              <div className="space-y-6">
                <GlassCard className="p-6 text-left">
                  <h2 className="text-2xl font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="h-6 w-6 text-mindflow-blue" /> {t('yourGoals')}
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
                            <p className="text-white/70 text-xs mt-2">{t('targetLabel', format(parseISO(goal.target_date), 'MMM dd, yyyy'))}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/70">{t('noGoalsSetYet')}</p>
                  )}
                  <Link to="/goals">
                    <Button className="mt-6 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
                      {t('manageGoals')}
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