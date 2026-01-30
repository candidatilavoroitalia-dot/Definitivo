import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, User, LogOut, Check, X, Edit, Home } from 'lucide-react';
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

const AdminDashboard = ({ user, logout }) => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/admin/appointments?date=${today}`);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await axios.patch(`/admin/appointments/${appointmentId}/confirm`);
      toast.success('Appuntamento confermato');
      fetchTodayAppointments();
      setActioningId(null);
    } catch (error) {
      toast.error('Errore durante la conferma');
    }
  };

  const handleCancel = async (appointmentId) => {
    try {
      await axios.patch(`/admin/appointments/${appointmentId}`, { status: 'cancelled' });
      toast.success('Appuntamento cancellato');
      fetchTodayAppointments();
      setActioningId(null);
    } catch (error) {
      toast.error('Errore durante la cancellazione');
    }
  };

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

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  return (
    <div className="min-h-screen bg-brand-bone">
      {/* Header */}
      <header className="bg-white border-b border-brand-sand/20" data-testid="admin-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-playfair font-bold text-brand-charcoal" data-testid="admin-title">
              Pannello Amministratore
            </h1>
            <p className="text-sm text-muted-foreground">Appuntamenti di oggi</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="home-button"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="stats-section">
              <Card className="p-6 border-brand-sand/30">
                <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-2">
                  Totale
                </div>
                <div className="text-4xl font-playfair font-bold text-brand-charcoal">
                  {appointments.length}
                </div>
              </Card>
              <Card className="p-6 border-yellow-300 bg-yellow-50">
                <div className="text-sm font-medium tracking-widest uppercase text-yellow-800 mb-2">
                  In Attesa
                </div>
                <div className="text-4xl font-playfair font-bold text-yellow-800">
                  {pendingAppointments.length}
                </div>
              </Card>
              <Card className="p-6 border-green-300 bg-green-50">
                <div className="text-sm font-medium tracking-widest uppercase text-green-800 mb-2">
                  Confermati
                </div>
                <div className="text-4xl font-playfair font-bold text-green-800">
                  {confirmedAppointments.length}
                </div>
              </Card>
              <Card className="p-6 border-red-300 bg-red-50">
                <div className="text-sm font-medium tracking-widest uppercase text-red-800 mb-2">
                  Cancellati
                </div>
                <div className="text-4xl font-playfair font-bold text-red-800">
                  {cancelledAppointments.length}
                </div>
              </Card>
            </div>

            {/* Pending Appointments */}
            {pendingAppointments.length > 0 && (
              <div>
                <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6" data-testid="pending-title">
                  Da Confermare
                </h2>
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      data-testid={`appointment-${appointment.id}`}
                    >
                      <Card className="p-6 border-yellow-300 hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <StatusBadge status={appointment.status} />
                              <h3 className="text-xl font-playfair font-semibold text-brand-charcoal">
                                {appointment.service_name}
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{appointment.user_name}</span>
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
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setActioningId(appointment.id);
                                setActionType('confirm');
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-none px-6 py-3"
                              data-testid={`confirm-button-${appointment.id}`}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Conferma
                            </Button>
                            <Button
                              onClick={() => {
                                setActioningId(appointment.id);
                                setActionType('cancel');
                              }}
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50 rounded-none px-6 py-3"
                              data-testid={`cancel-button-${appointment.id}`}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancella
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Appointments */}
            {confirmedAppointments.length > 0 && (
              <div>
                <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                  Confermati
                </h2>
                <div className="space-y-4">
                  {confirmedAppointments.map((appointment) => (
                    <Card key={appointment.id} className="p-6 border-green-300 bg-green-50/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <StatusBadge status={appointment.status} />
                            <h3 className="text-xl font-playfair font-semibold text-brand-charcoal">
                              {appointment.service_name}
                            </h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{appointment.user_name}</span>
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
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Appointments */}
            {cancelledAppointments.length > 0 && (
              <div>
                <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                  Cancellati
                </h2>
                <div className="space-y-4">
                  {cancelledAppointments.map((appointment) => (
                    <Card key={appointment.id} className="p-6 border-red-300 bg-red-50/50 opacity-75">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={appointment.status} />
                        <h3 className="text-lg font-playfair font-semibold text-brand-charcoal">
                          {appointment.service_name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{appointment.user_name}</span>
                        <span>•</span>
                        <span>{format(new Date(appointment.date_time), 'HH:mm')}</span>
                        <span>•</span>
                        <span>{appointment.hairdresser_name}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {appointments.length === 0 && (
              <Card className="p-12 text-center border-brand-sand/30">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-2">
                  Nessun appuntamento oggi
                </h3>
                <p className="text-muted-foreground">
                  Non ci sono appuntamenti programmati per oggi
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actioningId} onOpenChange={() => setActioningId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'confirm' ? 'Conferma Appuntamento' : 'Cancella Appuntamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'confirm'
                ? 'L\'appuntamento verrà confermato.'
                : 'L\'appuntamento verrà cancellato.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="dialog-cancel">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionType === 'confirm') {
                  handleConfirm(actioningId);
                } else {
                  handleCancel(actioningId);
                }
              }}
              className={actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              data-testid="dialog-confirm"
            >
              {actionType === 'confirm' ? 'Conferma' : 'Cancella'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
