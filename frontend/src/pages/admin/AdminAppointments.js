import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, User, Check, X, Trash2, Edit, CalendarClock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchTodayAppointments();
  }, [dateFilter, statusFilter]);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/admin/appointments?date=${today}`);
      setTodayAppointments(response.data);
    } catch (error) {
      console.error('Error fetching today appointments');
    }
  };

  const fetchAppointments = async () => {
    try {
      let url = '/admin/appointments';
      const params = [];
      
      if (dateFilter === 'today') {
        params.push(`date=${new Date().toISOString().split('T')[0]}`);
      }
      
      if (statusFilter !== 'all') {
        params.push(`status=${statusFilter}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await axios.get(url);
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
      fetchAppointments();
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
      fetchAppointments();
      fetchTodayAppointments();
      setActioningId(null);
    } catch (error) {
      toast.error('Errore durante la cancellazione');
    }
  };

  const handleDelete = async (appointmentId) => {
    try {
      await axios.delete(`/admin/appointments/${appointmentId}`);
      toast.success('Appuntamento eliminato definitivamente');
      fetchAppointments();
      fetchTodayAppointments();
      setActioningId(null);
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleAppointment(appointment);
    const aptDate = new Date(appointment.date_time);
    setNewDate(format(aptDate, 'yyyy-MM-dd'));
    setNewTime(format(aptDate, 'HH:mm'));
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error('Seleziona data e ora');
      return;
    }
    
    setRescheduling(true);
    try {
      const newDateTime = new Date(`${newDate}T${newTime}:00`);
      await axios.patch(`/admin/appointments/${rescheduleAppointment.id}`, {
        date_time: newDateTime.toISOString()
      });
      toast.success('Appuntamento spostato');
      fetchAppointments();
      fetchTodayAppointments();
      setRescheduleModalOpen(false);
      setRescheduleAppointment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore durante lo spostamento');
    } finally {
      setRescheduling(false);
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

  const groupedAppointments = {
    pending: appointments.filter(apt => apt.status === 'pending'),
    confirmed: appointments.filter(apt => apt.status === 'confirmed'),
    cancelled: appointments.filter(apt => apt.status === 'cancelled')
  };

  const todayPending = todayAppointments.filter(apt => apt.status === 'pending');
  const todayConfirmed = todayAppointments.filter(apt => apt.status === 'confirmed');

  return (
    <div className="space-y-8">
      {/* Today's Appointments Summary */}
      {todayAppointments.length > 0 && (
        <Card className="p-6 border-brand-gold bg-brand-gold/10" data-testid="today-summary">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-brand-gold" />
            <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal">
              Appuntamenti di Oggi ({todayAppointments.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs font-medium">
                {todayPending.length} In Attesa
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 border border-green-300 text-xs font-medium">
                {todayConfirmed.length} Confermati
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {todayAppointments.length > 0 && (
                <span>
                  Prossimo: {format(new Date(todayAppointments.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))[0]?.date_time), 'HH:mm', { locale: it })} - {todayAppointments[0]?.user_name}
                </span>
              )}
            </div>
          </div>
          {todayPending.length > 0 && (
            <div className="mt-4 pt-4 border-t border-brand-gold/30">
              <p className="text-sm font-medium text-brand-charcoal mb-2">Da confermare oggi:</p>
              <div className="flex flex-wrap gap-2">
                {todayPending.slice(0, 5).map((apt) => (
                  <span key={apt.id} className="px-3 py-1 bg-white border border-yellow-300 text-xs">
                    {format(new Date(apt.date_time), 'HH:mm')} - {apt.user_name}
                  </span>
                ))}
                {todayPending.length > 5 && (
                  <span className="px-3 py-1 bg-white border border-yellow-300 text-xs">
                    +{todayPending.length - 5} altri
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4" data-testid="filters">
        <div className="flex-1">
          <label className="text-sm font-medium tracking-widest uppercase mb-2 block">
            Periodo
          </label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="today">Solo Oggi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium tracking-widest uppercase mb-2 block">
            Stato
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="pending">In Attesa</SelectItem>
              <SelectItem value="confirmed">Confermati</SelectItem>
              <SelectItem value="cancelled">Cancellati</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
            {groupedAppointments.pending.length}
          </div>
        </Card>
        <Card className="p-6 border-green-300 bg-green-50">
          <div className="text-sm font-medium tracking-widest uppercase text-green-800 mb-2">
            Confermati
          </div>
          <div className="text-4xl font-playfair font-bold text-green-800">
            {groupedAppointments.confirmed.length}
          </div>
        </Card>
        <Card className="p-6 border-red-300 bg-red-50">
          <div className="text-sm font-medium tracking-widest uppercase text-red-800 mb-2">
            Cancellati
          </div>
          <div className="text-4xl font-playfair font-bold text-red-800">
            {groupedAppointments.cancelled.length}
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Pending Appointments */}
          {groupedAppointments.pending.length > 0 && (
            <div>
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                Da Confermare ({groupedAppointments.pending.length})
              </h2>
              <div className="space-y-4">
                {groupedAppointments.pending.map((appointment) => (
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
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{appointment.user_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(appointment.date_time), 'd MMM yyyy', { locale: it })}</span>
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setActioningId(appointment.id);
                              setActionType('confirm');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-none px-4 py-2"
                            data-testid={`confirm-button-${appointment.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Conferma
                          </Button>
                          <Button
                            onClick={() => openRescheduleModal(appointment)}
                            variant="outline"
                            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-sand/30 rounded-none px-4 py-2"
                            data-testid={`reschedule-button-${appointment.id}`}
                          >
                            <CalendarClock className="w-4 h-4 mr-1" />
                            Sposta
                          </Button>
                          <Button
                            onClick={() => {
                              setActioningId(appointment.id);
                              setActionType('cancel');
                            }}
                            variant="outline"
                            className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-none px-4 py-2"
                            data-testid={`cancel-button-${appointment.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Annulla
                          </Button>
                          <Button
                            onClick={() => {
                              setActioningId(appointment.id);
                              setActionType('delete');
                            }}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50 rounded-none px-4 py-2"
                            data-testid={`delete-button-${appointment.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Elimina
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
          {groupedAppointments.confirmed.length > 0 && (
            <div>
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                Confermati ({groupedAppointments.confirmed.length})
              </h2>
              <div className="space-y-4">
                {groupedAppointments.confirmed.map((appointment) => (
                  <Card key={appointment.id} className="p-6 border-green-300 bg-green-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusBadge status={appointment.status} />
                          <h3 className="text-xl font-playfair font-semibold text-brand-charcoal">
                            {appointment.service_name}
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{appointment.user_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(appointment.date_time), 'd MMM yyyy', { locale: it })}</span>
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => openRescheduleModal(appointment)}
                          variant="outline"
                          className="border-brand-charcoal text-brand-charcoal hover:bg-brand-sand/30 rounded-none px-4 py-2"
                          data-testid={`reschedule-confirmed-${appointment.id}`}
                        >
                          <CalendarClock className="w-4 h-4 mr-1" />
                          Sposta
                        </Button>
                        <Button
                          onClick={() => {
                            setActioningId(appointment.id);
                            setActionType('cancel');
                          }}
                          variant="outline"
                          className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-none px-4 py-2"
                          data-testid={`cancel-confirmed-${appointment.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Annulla
                        </Button>
                        <Button
                          onClick={() => {
                            setActioningId(appointment.id);
                            setActionType('delete');
                          }}
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50 rounded-none px-4 py-2"
                          data-testid={`delete-confirmed-${appointment.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Appointments */}
          {groupedAppointments.cancelled.length > 0 && (
            <div>
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6">
                Cancellati ({groupedAppointments.cancelled.length})
              </h2>
              <div className="space-y-4">
                {groupedAppointments.cancelled.map((appointment) => (
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
                      <span>{format(new Date(appointment.date_time), 'd MMM yyyy, HH:mm', { locale: it })}</span>
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
                Nessun appuntamento
              </h3>
              <p className="text-muted-foreground">
                Non ci sono appuntamenti con i filtri selezionati
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actioningId} onOpenChange={() => setActioningId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'confirm' ? 'Conferma Appuntamento' : 'Cancella Appuntamento'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'confirm'
                ? 'Il cliente riceverà una notifica di conferma su WhatsApp.'
                : 'Il cliente riceverà una notifica di cancellazione su WhatsApp.'}
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

export default AdminAppointments;
