import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { WeeklyActivity, WeeklyCompletion } from '@shared/schema';
import { useMutation, useQuery } from '@tanstack/react-query';
import { addDays, format, startOfWeek, endOfWeek, isToday, isSameDay } from 'date-fns';
import { Check, ChevronLeft, ChevronRight, Copy, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from './EmptyState';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'learning', label: 'Learning' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'other', label: 'Other' },
];

const TARGET_COUNTS = [
  { value: '1', label: '1x per week' },
  { value: '2', label: '2x per week' },
  { value: '3', label: '3x per week' },
  { value: '4', label: '4x per week' },
  { value: '5', label: '5x per week' },
  { value: '6', label: '6x per week' },
  { value: '7', label: 'Daily' },
];

function getWeekDates(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function WeeklyPlannerTab() {
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 0 });
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<WeeklyActivity | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('health');
  const [newTargetCount, setNewTargetCount] = useState('3');

  const weekDates = getWeekDates(currentWeekStart);
  const weekStartStr = formatDateString(weekDates[0]!);
  const startDateStr = weekStartStr;
  const endDateStr = formatDateString(weekDates[6]!);

  // Calculate previous week start for copy feature
  const previousWeekStart = addDays(currentWeekStart, -7);
  const previousWeekStartStr = formatDateString(previousWeekStart);

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<WeeklyActivity[]>({
    queryKey: ['/api/weekly-activities', weekStartStr],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-activities?weekStart=${weekStartStr}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery<WeeklyCompletion[]>({
    queryKey: ['/api/weekly-completions', `?startDate=${startDateStr}&endDate=${endDateStr}`],
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; targetCount: string }) => {
      const res = await apiRequest('POST', '/api/weekly-activities', { ...data, weekStart: weekStartStr });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-activities', weekStartStr] });
      setAddDialogOpen(false);
      setNewTitle('');
      setNewCategory('health');
      setNewTargetCount('3');
      toast({ title: 'Activity added' });
    },
    onError: () => {
      toast({ title: 'Failed to add activity', variant: 'destructive' });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title: string; category: string; targetCount: string }) => {
      const res = await apiRequest('PATCH', `/api/weekly-activities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-activities', weekStartStr] });
      setEditDialogOpen(false);
      setEditingActivity(null);
      toast({ title: 'Activity updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update activity', variant: 'destructive' });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/weekly-activities/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-activities', weekStartStr] });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-completions'] });
      toast({ title: 'Activity deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete activity', variant: 'destructive' });
    },
  });

  const copyFromPreviousWeekMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/weekly-activities/copy', {
        targetWeekStart: weekStartStr,
        sourceWeekStart: previousWeekStartStr,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-activities', weekStartStr] });
      if (Array.isArray(data) && data.length === 0) {
        toast({ 
          title: 'No activities copied', 
          description: 'The previous week has no activities, or this week already has activities.' 
        });
      } else {
        toast({ title: `Copied ${data.length} ${data.length === 1 ? 'activity' : 'activities'} from previous week` });
      }
    },
    onError: () => {
      toast({ title: 'Failed to copy activities', variant: 'destructive' });
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async (data: { activityId: string; date: string }) => {
      const res = await apiRequest('POST', '/api/weekly-completions/toggle', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-completions'] });
    },
    onError: () => {
      toast({ title: 'Failed to update completion', variant: 'destructive' });
    },
  });

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const currentWeekStartDate = startOfWeek(today, { weekStartsOn: 0 });
    return isSameDay(currentWeekStart, currentWeekStartDate);
  };

  const getCompletionsForActivity = (activityId: string): Set<string> => {
    const dates = new Set<string>();
    completions.filter(c => c.activityId === activityId).forEach(c => dates.add(c.date));
    return dates;
  };

  const handleAddActivity = () => {
    if (!newTitle.trim()) return;
    createActivityMutation.mutate({
      title: newTitle.trim(),
      category: newCategory,
      targetCount: newTargetCount,
    });
  };

  const handleEditActivity = () => {
    if (!editingActivity || !newTitle.trim()) return;
    updateActivityMutation.mutate({
      id: editingActivity.id,
      title: newTitle.trim(),
      category: newCategory,
      targetCount: newTargetCount,
    });
  };

  const openEditDialog = (activity: WeeklyActivity) => {
    setEditingActivity(activity);
    setNewTitle(activity.title);
    setNewCategory(activity.category);
    setNewTargetCount(activity.targetCount);
    setEditDialogOpen(true);
  };

  const handleToggleCompletion = (activityId: string, date: Date) => {
    const dateStr = formatDateString(date);
    toggleCompletionMutation.mutate({ activityId, date: dateStr });
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'health': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fitness': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'nutrition': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'learning': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'wellness': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const isLoading = activitiesLoading || completionsLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="sticky top-0 z-10 bg-background pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousWeek}
              data-testid="button-previous-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isCurrentWeek() ? 'default' : 'outline'}
              onClick={goToCurrentWeek}
              className="min-w-24"
              data-testid="button-current-week"
            >
              {isCurrentWeek() ? 'This Week' : format(currentWeekStart, 'MMM d')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextWeek}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-activity">
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {format(weekDates[0]!, 'MMMM d')} - {format(weekDates[6]!, 'MMMM d, yyyy')}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Check className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No activities for this week</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Add activities you want to complete this week, or copy your plan from the previous week.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => copyFromPreviousWeekMutation.mutate()}
              disabled={copyFromPreviousWeekMutation.isPending}
              data-testid="button-copy-from-previous"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copyFromPreviousWeekMutation.isPending ? 'Copying...' : 'Copy from Previous Week'}
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-activity-empty">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-4 space-y-4">
          <div className="hidden md:grid grid-cols-[minmax(200px,2fr)_repeat(7,minmax(60px,1fr))_80px] gap-2 items-center text-sm font-medium text-muted-foreground border-b pb-2">
            <div>Activity</div>
            {weekDates.map((date) => (
              <div key={date.toISOString()} className={cn('text-center', isToday(date) && 'text-primary font-bold')}>
                {format(date, 'EEE')}
                <div className="text-xs">{format(date, 'd')}</div>
              </div>
            ))}
            <div className="text-center">Progress</div>
          </div>

          {activities.map((activity) => {
            const completedDates = getCompletionsForActivity(activity.id);
            const weekCompletionCount = weekDates.filter(date => 
              completedDates.has(formatDateString(date))
            ).length;
            const target = parseInt(activity.targetCount, 10);
            const progressPct = Math.min(100, (weekCompletionCount / target) * 100);

            return (
              <div
                key={activity.id}
                className="border rounded-lg p-4"
                data-testid={`activity-row-${activity.id}`}
              >
                <div className="md:hidden space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{activity.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-xs', getCategoryColor(activity.category))}>
                          {activity.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.targetCount}x/week
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(activity)}
                        data-testid={`button-edit-activity-${activity.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        data-testid={`button-delete-activity-${activity.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((date) => {
                      const dateStr = formatDateString(date);
                      const isCompleted = completedDates.has(dateStr);
                      return (
                        <button
                          key={dateStr}
                          onClick={() => handleToggleCompletion(activity.id, date)}
                          className={cn(
                            'aspect-square rounded-md border flex flex-col items-center justify-center text-xs transition-colors',
                            isToday(date) && 'border-primary border-2',
                            isCompleted ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          )}
                          data-testid={`completion-${activity.id}-${dateStr}`}
                        >
                          <span className="text-[10px]">{format(date, 'EEE')}</span>
                          {isCompleted && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          progressPct >= 100 ? 'bg-green-500' : 'bg-primary'
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[40px] text-right">
                      {weekCompletionCount}/{target}
                    </span>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-[minmax(200px,2fr)_repeat(7,minmax(60px,1fr))_80px] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{activity.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-xs whitespace-nowrap', getCategoryColor(activity.category))}>
                          {activity.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.targetCount}x/week
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(activity)}
                        data-testid={`button-edit-activity-${activity.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        data-testid={`button-delete-activity-${activity.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {weekDates.map((date) => {
                    const dateStr = formatDateString(date);
                    const isCompleted = completedDates.has(dateStr);
                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleToggleCompletion(activity.id, date)}
                        className={cn(
                          'h-10 w-full rounded-md border flex items-center justify-center transition-colors',
                          isToday(date) && 'border-primary border-2',
                          isCompleted ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        )}
                        data-testid={`completion-${activity.id}-${dateStr}`}
                      >
                        {isCompleted && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}

                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          progressPct >= 100 ? 'bg-green-500' : 'bg-primary'
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {weekCompletionCount}/{target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Weekly Activity</DialogTitle>
            <DialogDescription>
              Create a new activity you want to complete regularly each week.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity-title">Activity</Label>
              <Input
                id="activity-title"
                placeholder="e.g., Eat blueberries, Strength training..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-activity-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-category">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger data-testid="select-activity-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-target">Frequency</Label>
              <Select value={newTargetCount} onValueChange={setNewTargetCount}>
                <SelectTrigger data-testid="select-activity-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_COUNTS.map(tc => (
                    <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddActivity}
              disabled={!newTitle.trim() || createActivityMutation.isPending}
              data-testid="button-confirm-add-activity"
            >
              Add Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update your weekly activity details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-activity-title">Activity</Label>
              <Input
                id="edit-activity-title"
                placeholder="e.g., Eat blueberries, Strength training..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                data-testid="input-edit-activity-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-activity-category">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger data-testid="select-edit-activity-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-activity-target">Frequency</Label>
              <Select value={newTargetCount} onValueChange={setNewTargetCount}>
                <SelectTrigger data-testid="select-edit-activity-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_COUNTS.map(tc => (
                    <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditActivity}
              disabled={!newTitle.trim() || updateActivityMutation.isPending}
              data-testid="button-confirm-edit-activity"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
