import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Calendar, Clock, Users, Check, LogOut, LayoutDashboard, Shield, Download, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'sonner';

const LandingPage = ({ user, logout }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const { isInstallable, isInstalled, installApp } = usePWAInstall();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInstallClick = async () => {
    const result = await installApp();
    if (result.outcome === 'accepted') {
      toast.success('App installata con successo!');
    } else if (result.outcome === 'ios-instructions') {
      toast.info(result.message, { duration: 5000 });
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Prenota Online',
      description: 'Scegli data e ora per il tuo appuntamento'
    },
    {
      icon: Users,
      title: 'Scegli il Parrucchiere',
      description: 'Prenota con il tuo parrucchiere preferito'
    },
    {
      icon: Clock,
      title: 'Promemoria WhatsApp',
      description: 'Ricevi notifiche prima del tuo appuntamento'
    },
    {
      icon: Check,
      title: 'Gestione Facile',
      description: 'Modifica o cancella i tuoi appuntamenti'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bone">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-brand-sand/20" data-testid="landing-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-playfair font-bold text-brand-charcoal"
          >
            parrucco..
          </motion.div>
          <div className="flex gap-4 items-center">
            {isInstallable && !isInstalled && (
              <Button
                onClick={handleInstallClick}
                variant="outline"
                className="border-brand-gold text-brand-charcoal hover:bg-brand-gold hover:text-brand-charcoal rounded-none px-6 py-3 text-sm font-medium tracking-wide hidden md:flex items-center transition-all"
                data-testid="install-app-button"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Scarica App
              </Button>
            )}
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate(user.is_admin ? '/admin' : '/dashboard')}
                  className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
                  data-testid="dashboard-nav-button"
                >
                  {user.is_admin ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </>
                  ) : (
                    <>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
                  data-testid="logout-button"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Esci
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                data-testid="login-button"
              >
                Accedi
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7 space-y-8"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none font-playfair text-brand-charcoal" data-testid="hero-title">
                {settings?.hero_title?.split(',')[0] || 'Il Tuo Salone,'}
                <br />
                <span className="text-brand-gold">{settings?.hero_title?.split(',')[1]?.trim() || 'Sempre Disponibile'}</span>
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
                {settings?.hero_description || 'Prenota il tuo appuntamento in pochi secondi. Ricevi promemoria su WhatsApp. Gestisci tutto dal tuo telefono.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {!user && (
                  <Button
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                    data-testid="cta-button"
                  >
                    Inizia Ora
                  </Button>
                )}
                {user && !user.is_admin && (
                  <Button
                    onClick={() => navigate('/book')}
                    size="lg"
                    className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                    data-testid="book-now-button"
                  >
                    Prenota Ora
                  </Button>
                )}
                {isInstallable && !isInstalled && (
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    variant="outline"
                    className="border-2 border-brand-gold text-brand-charcoal hover:bg-brand-gold hover:text-brand-charcoal rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                    data-testid="install-app-hero-button"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Scarica App
                  </Button>
                )}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:col-span-5"
            >
              <img
                src={settings?.hero_image_url || "https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"}
                alt="Salon"
                className="w-full h-[500px] object-cover shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 md:px-12 bg-white" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-playfair text-brand-charcoal mb-4">
              Perché Scegliere Noi
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Tutto ciò di cui hai bisogno per gestire i tuoi appuntamenti
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-brand-sand/30 p-8 hover:shadow-xl hover:shadow-brand-sand/20 transition-all duration-500 group cursor-pointer"
                  data-testid={`feature-card-${index}`}
                >
                  <div className="w-12 h-12 bg-brand-sand flex items-center justify-center mb-6 group-hover:bg-brand-gold transition-colors duration-300">
                    <Icon className="w-6 h-6 text-brand-charcoal" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-medium font-playfair text-brand-charcoal mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-24 px-6 md:px-12 bg-brand-charcoal text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-playfair">
              Pronto a Trasformare il Tuo Look?
            </h2>
            <p className="text-lg leading-relaxed text-gray-300">
              Registrati ora e prenota il tuo primo appuntamento
            </p>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
              data-testid="cta-register-button"
            >
              Registrati Gratis
            </Button>
          </motion.div>
        </section>
      )}

      {/* Download App Section */}
      {isInstallable && !isInstalled && (
        <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-brand-sand/30 to-brand-bone">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-block p-4 bg-brand-charcoal">
                  <Smartphone className="w-12 h-12 text-brand-gold" />
                </div>
                <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-playfair text-brand-charcoal">
                  Scarica l'App sul Tuo Telefono
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Installa parrucco.. sul tuo dispositivo per un accesso ancora più rapido. Funziona anche offline!
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-gold flex-shrink-0" />
                    <span>Icona nella home screen</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-gold flex-shrink-0" />
                    <span>Funziona offline</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-gold flex-shrink-0" />
                    <span>Notifiche push</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-gold flex-shrink-0" />
                    <span>Aggiornamenti automatici</span>
                  </li>
                </ul>
                <Button
                  onClick={handleInstallClick}
                  size="lg"
                  className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
                  data-testid="download-app-section-button"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Installa Ora
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-[9/16] max-w-xs mx-auto bg-brand-charcoal shadow-2xl overflow-hidden border-8 border-brand-charcoal" style={{ borderRadius: '40px' }}>
                  <img
                    src="https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&w=400"
                    alt="App Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✂️</span>
                      <div>
                        <div className="font-playfair font-bold text-brand-charcoal text-sm">parrucco..</div>
                        <div className="text-xs text-muted-foreground">Prenotazioni</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-white border-t border-brand-sand/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 parrucco.. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
