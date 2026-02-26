import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { isNative, isAndroid } from "@/lib/platform";

function CapacitorInit() {
  useEffect(() => {
    if (!isNative()) return;

    let cleanupApp: (() => void) | undefined;
    let cleanupSplash: (() => void) | undefined;

    const init = async () => {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
      cleanupSplash = () => {};

      if (isAndroid()) {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
        cleanupApp = () => handle.remove();
      }
    };

    init().catch(console.error);

    return () => {
      cleanupApp?.();
      cleanupSplash?.();
    };
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CapacitorInit />
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
