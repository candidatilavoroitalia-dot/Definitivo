import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check PWA support
    if (!('serviceWorker' in navigator)) {
      return;
    }

    setIsSupported(true);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user dismissed banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    let mounted = true;

    const handler = (e) => {
      e.preventDefault();
      if (mounted) {
        setDeferredPrompt(e);
        // Show banner after 3 seconds
        setTimeout(() => {
          if (mounted) {
            setShowInstallBanner(true);
          }
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isSupported || !showInstallBanner) {
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
