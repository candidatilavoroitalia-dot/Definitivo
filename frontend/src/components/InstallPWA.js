import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { usePWAInstall } from '../hooks/usePWAInstall';

const InstallPWA = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      return;
    }

    // Check if user dismissed banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Show banner after 3 seconds if installable
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const result = await installApp();
    if (result.outcome === 'accepted' || result.outcome === 'ios-instructions') {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || !isInstallable || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <Card className="p-4 shadow-2xl border-brand-gold/30 bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-brand-charcoal rounded flex items-center justify-center">
            <span className="text-2xl">✂️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-playfair font-semibold text-brand-charcoal mb-1">
              Installa l'App
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Aggiungi Parrucco alla home screen per un accesso rapido
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="bg-brand-charcoal text-white hover:bg-black rounded-none"
              >
                <Download className="w-4 h-4 mr-2" />
                Installa
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-brand-charcoal"
              >
                Non ora
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-brand-charcoal transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default InstallPWA;
