import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, User, LogOut, Plus, X, Bell, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Dashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState([]);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const notificationOptions = [
    { value: '10min', label: '10 minuti prima' },
    { value: '30min', label: '30 minuti prima' },
    { value: '1hour', label: '1 ora prima' },
    { value: '2hours', label: '2 ore prima' },
    { value: '1day', label: '1 giorno prima' },
  ];

  useEffect(() => {
    fetchAppointments();
    fetchNotificationPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/appointments/my');
      setAppointments(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const response = await axios.get('/user/notification-preferences');
      const prefs = response.data.notification_preferences || [];
      // Se non ci sono preferenze salvate, imposta i default
      if (prefs.length === 0) {
        setNotificationPrefs(['10min', '1hour']);
      } else {
        setNotificationPrefs(prefs);
      }
    } catch (error) {
      // In caso di errore, usa i default
      setNotificationPrefs(['10min', '1hour']);
    }
  };

  const toggleNotificationPref = (value) => {
    setNotificationPrefs(prev => 
      prev.includes(value) 
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const saveNotificationPrefs = async () => {
    setSavingPrefs(true);
    try {
      await axios.put('/user/notification-preferences', {
        notification_preferences: notificationPrefs
      });
      toast.success('Preferenze notifiche salvate!');
      
      // Request notification permission if any preference is selected
      if (notificationPrefs.length > 0 && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success('Notifiche attivate!');
        } else if (permission === 'denied') {
          toast.error('Permesso notifiche negato. Attivalo dalle impostazioni del browser.');
        }
      }
    } catch (error) {
      toast.error('Errore nel salvataggio delle preferenze');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      await axios.patch(`/appointments/${appointmentId}/cancel`);
      toast.success('Appuntamento cancellato');
      fetchAppointments();
      setCancelingId(null);
    } catch (error) {
      toast.error('Errore durante la cancellazione');
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status !== 'cancelled' && new Date(apt.date_time) > new Date()
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'cancelled' || new Date(apt.date_time) <= new Date()
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      pending: 'In Attesa',
      confirmed: 'Confermato',
      cancelled: 'Cancellato'
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium tracking-wide border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-brand-bone">
      {/* Header */}
      <header className="bg-white border-b border-brand-sand/20" data-testid="dashboard-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-playfair font-bold text-brand-charcoal" data-testid="user-name">
              Ciao, {user.name}
            </h1>
            <p className="text-sm text-muted-foreground">I tuoi appuntamenti</p>
          </div>
          <div className="flex gap-2 md:gap-4">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="settings-button"
            >
              <Bell className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Notifiche</span>
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="home-button"
            >
              Home
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Esci</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {/* Notification Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-6 border-brand-gold/30 bg-brand-gold/5">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-brand-gold" />
                <h3 className="text-xl font-playfair font-semibold text-brand-charcoal">
                  Impostazioni Notifiche
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scegli quando ricevere i promemoria per i tuoi appuntamenti. Puoi selezionare più opzioni.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {notificationOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      notificationPrefs.includes(option.value)
                        ? 'border-brand-gold bg-brand-gold/10'
                        : 'border-brand-sand/30 hover:border-brand-gold/50'
                    }`}
                    data-testid={`notification-option-${option.value}`}
                  >
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes(option.value)}
                      onChange={() => toggleNotificationPref(option.value)}
                      className="w-5 h-5 rounded border-brand-sand text-brand-gold focus:ring-brand-gold"
                    />
                    <span className="text-sm font-medium text-brand-charcoal">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={saveNotificationPrefs}
                  disabled={savingPrefs}
                  className="bg-brand-charcoal text-white hover:bg-black rounded-none px-6 py-2 text-sm uppercase tracking-widest"
                  data-testid="save-notifications-button"
                >
                  {savingPrefs ? 'Salvataggio...' : 'Salva Preferenze'}
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="rounded-none px-6 py-2 text-sm uppercase tracking-widest"
                >
                  Chiudi
                </Button>
              </div>
              {notificationPrefs.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4">
                  ✓ Riceverai notifiche: {notificationPrefs.map(p => 
                    notificationOptions.find(o => o.value === p)?.label
                  ).join(', ')}
                </p>
              )}
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <Button
            onClick={() => navigate('/book')}
            size="lg"
            className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
            data-testid="new-appointment-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuovo Appuntamento
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Appointments */}
            <div>
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6" data-testid="upcoming-title">
                Prossimi Appuntamenti
              </h2>
              {upcomingAppointments.length === 0 ? (
                <Card className="p-8 text-center border-brand-sand/30">
                  <p className="text-muted-foreground">Nessun appuntamento in programma</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-testid={`appointment-card-${appointment.id}`}
                    >
                      <Card className="p-6 border-brand-sand/30 hover:shadow-xl transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <StatusBadge status={appointment.status} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelingId(appointment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`cancel-button-${appointment.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-3">
                          {appointment.service_name}
                        </h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(appointment.date_time), 'EEEE, d MMMM yyyy', { locale: it })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(appointment.date_time), 'HH:mm')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{appointment.hairdresser_name}</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                  Storico
                </h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="p-6 border-brand-sand/30 opacity-75">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-playfair font-semibold text-brand-charcoal">
                              {appointment.service_name}
                            </h3>
                            <StatusBadge status={appointment.status} />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(appointment.date_time), 'd MMMM yyyy, HH:mm', { locale: it })}</span>
                            <span>•</span>
                            <span>{appointment.hairdresser_name}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelingId} onOpenChange={() => setCancelingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Cancellazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cancellare questo appuntamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-dialog-cancel">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCancel(cancelingId)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="cancel-dialog-confirm"
            >
              Conferma Cancellazione
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
