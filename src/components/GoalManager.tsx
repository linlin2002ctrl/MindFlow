import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Loader2, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { goalsService, UserGoal, GoalCategory, GoalType, GoalStatus } from '@/services/goalsService';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useTranslation } from '@/i18n/i18n';

const goalCategories: GoalCategory[] = ['Emotional', 'Career', 'Health', 'Relationships', 'General'];
const goalTypes: GoalType[] = ['Habit Goal', 'Mood Goal', 'Insight Goal', 'Growth Goal', 'Wellness Goal', 'Other'];
const goalStatuses: GoalStatus[] = ['active', 'completed', 'archived'];

const GoalManager: React.FC = () => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: undefined as Date | undefined,
    category: 'General' as GoalCategory,
    type: 'Growth Goal' as GoalType,
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<GoalStatus>('active');

  const fetchGoals = async (status: GoalStatus) => {
    if (!user) return;
    setIsLoading(true);
    const fetchedGoals = await goalsService.getGoalsByStatus(user.id, status, t);
    setGoals(fetchedGoals || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGoals(activeTab);
  }, [user, activeTab, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(t('errorLoginToCreateGoal'));
      return;
    }
    if (!newGoal.title.trim()) {
      toast.error(t('errorGoalTitleEmpty'));
      return;
    }

    setIsSubmitting(true);
    try {
      const goalData: Omit<UserGoal, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'progress' | 'status' | 'related_journal_entries'> = {
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || null,
        target_date: newGoal.target_date ? newGoal.target_date.toISOString().split('T')[0] : null,
        category: newGoal.category,
        type: newGoal.type,
      };

      if (editingGoalId) {
        const updatedGoal = await goalsService.updateGoal(editingGoalId, goalData, t);
        if (updatedGoal) {
          toast.success(t('goalUpdatedSuccess'));
          setGoals(goals.map(g => (g.id === editingGoalId ? { ...g, ...updatedGoal } : g)));
          if (navigator.vibrate) navigator.vibrate(50);
        } else {
          toast.error(t('errorUpdatingGoal'));
        }
      } else {
        const createdGoal = await goalsService.createGoal({
          ...goalData,
          user_id: user.id,
          progress: 0,
          status: 'active',
          related_journal_entries: [],
        }, t);
        if (createdGoal) {
          toast.success(t('goalCreatedSuccess'));
          setGoals(prev => [createdGoal, ...prev]);
          if (navigator.vibrate) navigator.vibrate(50);
        } else {
          toast.error(t('errorCreatingGoal'));
        }
      }
      resetForm();
    } catch (error) {
      console.error("Error submitting goal:", error);
      toast.error(t('errorUnexpectedSaving'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (goal: UserGoal) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setEditingGoalId(goal.id);
    setNewGoal({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? new Date(goal.target_date) : undefined,
      category: goal.category,
      type: goal.type,
    });
  };

  const handleDelete = async (goalId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const deleted = await goalsService.deleteGoal(goalId, t);
      if (deleted) {
        toast.success(t('goalDeletedSuccess'));
        setGoals(goals.filter(g => g.id !== goalId));
        if (navigator.vibrate) navigator.vibrate(70);
      } else {
        toast.error(t('errorDeletingGoal'));
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error(t('errorUnexpectedSaving'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProgress = async (goalId: string, newProgress: number) => {
    if (!user) return;
    const goalToUpdate = goals.find(g => g.id === goalId);
    if (!goalToUpdate) return;

    const updatedGoal = await goalsService.updateGoal(goalId, { progress: newProgress }, t);
    if (updatedGoal) {
      setGoals(goals.map(g => (g.id === goalId ? { ...g, progress: newProgress } : g)));
      toast.success(t('goalProgressUpdated'));
      if (navigator.vibrate) navigator.vibrate(30);
    } else {
      toast.error(t('errorUpdatingProgress'));
    }
  };

  const handleUpdateStatus = async (goalId: string, newStatus: GoalStatus) => {
    if (!user) return;
    const goalToUpdate = goals.find(g => g.id === goalId);
    if (!goalToUpdate) return;

    const updatedGoal = await goalsService.updateGoal(goalId, { status: newStatus }, t);
    if (updatedGoal) {
      toast.success(t('goalStatusUpdated', newStatus));
      setGoals(goals.filter(g => g.id !== activeTab));
      fetchGoals(activeTab);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      toast.error(t('errorUpdatingGoalStatus'));
    }
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      target_date: undefined,
      category: 'General',
      type: 'Growth Goal',
    });
    setEditingGoalId(null);
  };

  return (
    <div className="flex flex-col items-center p-4 md:p-8 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-4xl space-y-6">
        <GlassCard className="text-center p-6">
          <h1 className="text-4xl font-bold mb-4 text-white flex items-center justify-center gap-2">
            <PlusCircle className="h-8 w-8 text-mindflow-blue" /> {t('goalManager')}
          </h1>
          <p className="text-lg text-white/80">
            {t('goalManagerDescription')}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">{editingGoalId ? t('editGoal') : t('createNewGoal')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-white/90 text-sm font-medium mb-1">{t('goalTitle')}</label>
              <Input
                id="title"
                name="title"
                value={newGoal.title}
                onChange={handleInputChange}
                placeholder={t('goalTitlePlaceholder')}
                className="bg-white/10 border border-white/20 text-white placeholder:text-white/60"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-white/90 text-sm font-medium mb-1">{t('descriptionOptional')}</label>
              <Textarea
                id="description"
                name="description"
                value={newGoal.description}
                onChange={handleInputChange}
                placeholder={t('descriptionPlaceholder')}
                className="bg-white/10 border border-white/20 text-white placeholder:text-white/60"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-white/90 text-sm font-medium mb-1">{t('category')}</label>
                <Select value={newGoal.category} onValueChange={(value: GoalCategory) => handleSelectChange('category', value)} disabled={isSubmitting}>
                  <SelectTrigger id="category" className="w-full bg-white/10 border border-white/20 text-white">
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="bg-mindflow-purple/90 border border-white/20 text-white">
                    {goalCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="type" className="block text-white/90 text-sm font-medium mb-1">{t('type')}</label>
                <Select value={newGoal.type} onValueChange={(value: GoalType) => handleSelectChange('type', value)} disabled={isSubmitting}>
                  <SelectTrigger id="type" className="w-full bg-white/10 border border-white/20 text-white">
                    <SelectValue placeholder={t('selectType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-mindflow-purple/90 border border-white/20 text-white">
                    {goalTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="target_date" className="block text-white/90 text-sm font-medium mb-1">{t('targetDateOptional')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/10 border border-white/20 text-white hover:bg-white/20",
                      !newGoal.target_date && "text-white/60"
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newGoal.target_date ? format(newGoal.target_date, "PPP") : <span>{t('pickADate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-mindflow-purple/90 border border-white/20 text-white">
                  <Calendar
                    mode="single"
                    selected={newGoal.target_date}
                    onSelect={(date) => setNewGoal(prev => ({ ...prev, target_date: date || undefined }))}
                    initialFocus
                    className="text-white"
                    classNames={{
                      day_selected: "bg-mindflow-blue text-white hover:bg-mindflow-blue hover:text-white focus:bg-mindflow-blue focus:text-white",
                      day_today: "bg-white/20 text-white",
                      day_range_middle: "bg-white/10 text-white",
                      day_hidden: "invisible",
                      caption_label: "text-white",
                      nav_button_previous: "text-white",
                      nav_button_next: "text-white",
                      head_row: "text-white/80",
                      day: "text-white hover:bg-white/10",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingGoalId ? t('updateGoal') : t('createGoal'))}
              </Button>
              {editingGoalId && (
                <Button type="button" variant="outline" onClick={resetForm} className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20" disabled={isSubmitting}>
                  {t('cancelEdit')}
                </Button>
              )}
            </div>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">{t('yourGoals')}</h2>
          <div className="flex justify-center gap-2 mb-6">
            {goalStatuses.map(status => (
              <Button
                key={status}
                variant="ghost"
                onClick={() => setActiveTab(status)}
                className={cn("text-white hover:bg-white/20 capitalize", activeTab === status && "bg-white/20 text-mindflow-blue")}
              >
                {t(status)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <p className="text-white/70 text-center">{t('loadingGoals')}</p>
          ) : goals.length === 0 ? (
            <p className="text-white/70 text-center">{t('noGoalsYet', t(activeTab))}</p>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="bg-white/10 p-4 rounded-lg border border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 text-left">
                    <h3 className="text-xl font-semibold text-white">{goal.title}</h3>
                    {goal.description && <p className="text-white/80 text-sm mt-1">{goal.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-white/70">
                      <span>{t('categoryLabel', goal.category)}</span>
                      <span>•</span>
                      <span>{t('typeLabel', goal.type)}</span>
                      {goal.target_date && (
                        <>
                          <span>•</span>
                          <span>{t('targetLabel', format(new Date(goal.target_date), 'MMM dd, yyyy'))}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 w-full md:w-48">
                      <Progress value={goal.progress} className="w-full h-2 bg-white/30" />
                      <span className="text-white/90 text-sm">{goal.progress}%</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => handleEdit(goal)} aria-label={t('editGoalButton')}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/20" aria-label={t('deleteGoalButton')}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-mindflow-purple/90 border border-white/20 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">{t('areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/80">
                              {t('actionCannotBeUndone')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-white/20">{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleDelete(goal.id)}>{t('delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {goal.status === 'active' && (
                        <Button variant="ghost" size="icon" className="text-green-400 hover:bg-green-500/20" onClick={() => handleUpdateStatus(goal.id, 'completed')} aria-label={t('markGoalCompleteButton')}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default GoalManager;