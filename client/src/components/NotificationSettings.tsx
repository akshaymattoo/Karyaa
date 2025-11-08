import { Bell, BellOff, Check, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState, useEffect } from 'react';
import type { UserSettings } from '@shared/schema';

export function NotificationSettings() {
  const { user } = useAuth();
  const { 
    permission, 
    isSubscribed, 
    isLoading, 
    error, 
    subscribe, 
    unsubscribe, 
    sendTestNotification 
  } = usePushNotifications();
  const { toast } = useToast();
  
  const [reminderTime, setReminderTime] = useState('17:00');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      setReminderTime(settings.reminderTime);
      setReminderEnabled(settings.reminderEnabled);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      return apiRequest('PATCH', '/api/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your notification preferences have been saved',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update settings',
        description: 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications',
      });
    } else {
      toast({
        title: 'Failed to enable notifications',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications',
      });
    } else {
      toast({
        title: 'Failed to disable notifications',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async () => {
    const success = await sendTestNotification();
    if (success) {
      toast({
        title: 'Test notification sent',
        description: 'Check your notifications',
      });
    } else {
      toast({
        title: 'Failed to send test notification',
        description: error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Sign in to enable push notifications
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications about your tasks and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Status: {isSubscribed ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-muted-foreground">
                Permission: {permission}
              </p>
            </div>
            {isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnsubscribe}
                disabled={isLoading}
                data-testid="button-disable-notifications"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
                <span className="ml-2">Disable</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={isLoading || permission === 'denied'}
                data-testid="button-enable-notifications"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                <span className="ml-2">Enable</span>
              </Button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Notifications are blocked. Please enable them in your browser settings.
            </div>
          )}

          {isSubscribed && (
            <div className="pt-2 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTest}
                disabled={isLoading}
                data-testid="button-test-notification"
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span className="ml-2">Send Test Notification</span>
              </Button>
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive" data-testid="text-notification-error">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Reminder
          </CardTitle>
          <CardDescription>
            Get notified about incomplete tasks at a specific time each day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="reminder-enabled" className="text-sm font-medium">
                Enable daily reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive a notification if you have incomplete tasks
              </p>
            </div>
            <Switch
              id="reminder-enabled"
              checked={reminderEnabled}
              onCheckedChange={(checked) => {
                setReminderEnabled(checked);
                updateSettingsMutation.mutate({ reminderEnabled: checked });
              }}
              disabled={settingsLoading || updateSettingsMutation.isPending}
              data-testid="switch-reminder-enabled"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-time" className="text-sm font-medium">
              Reminder time
            </Label>
            <div className="flex gap-2">
              <Input
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={settingsLoading || !reminderEnabled}
                data-testid="input-reminder-time"
                className="max-w-[150px]"
              />
              <Button
                size="sm"
                onClick={() => updateSettingsMutation.mutate({ reminderTime })}
                disabled={settingsLoading || updateSettingsMutation.isPending || !reminderEnabled}
                data-testid="button-save-reminder-time"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll receive a notification at this time if you have incomplete tasks for the day
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
