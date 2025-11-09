import { SettingsDialog } from '@/components/SettingsDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export function AuthButton() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!user) {
    return (
      <Button
        onClick={signInWithGoogle}
        variant="default"
        size="sm"
        data-testid="button-sign-in"
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        Sign in with Google
      </Button>
    );
  }

  const initials = user.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            data-testid="button-user-menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem disabled className="flex-col items-start gap-1">
            <div className="font-medium">{user.user_metadata?.full_name || 'User'}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          { user.email === 'akshaymattoo@gmail.com' ? (
            <DropdownMenuItem onClick={() => setSettingsOpen(true)} data-testid="button-settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>) : null
          }
          <DropdownMenuItem onClick={signOut} data-testid="button-sign-out" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
