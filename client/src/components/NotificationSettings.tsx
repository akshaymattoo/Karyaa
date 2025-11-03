import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    );
  }

  return (
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
  );
}
