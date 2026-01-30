import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running as installed app on iOS
    if (window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    let mounted = true;

    const handler = (e) => {
      e.preventDefault();
      if (mounted) {
        setDeferredPrompt(e);
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS - always show the button since we can't detect beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !window.navigator.standalone) {
      setIsInstallable(true);
    }

    return () => {
      mounted = false;
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        return {
          outcome: 'ios-instructions',
          message: 'Su iOS: Tocca Condividi e poi "Aggiungi a Home"'
        };
      }
      return { outcome: 'dismissed', message: 'Installazione non disponibile' };
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    }

    return { outcome };
  };

  return {
    isInstallable,
    isInstalled,
    installApp
  };
};
