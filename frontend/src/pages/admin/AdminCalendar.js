import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

const AdminCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const [newClosure, setNewClosure] = useState({ date: '', reason: '' });
  const [hairdressers, setHairdressers] = useState([]);
  const [selectedHairdresser, setSelectedHairdresser] = useState('all');

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  useEffect(() => {
    fetchData();
  }, [currentWeek]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, closuresRes, hairdressersRes] = await Promise.all([
        axios.get('/admin/appointments'),
        axios.get('/closures'),
        axios.get('/hairdressers')
      ]);
      setAppointments(appointmentsRes.data);
      setClosures(closuresRes.data);
      setHairdressers(hairdressersRes.data);
    } catch (error) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForSlot = (day, time) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const slotHour = parseInt(time.split(':')[0]);
    const slotMinute = parseInt(time.split(':')[1]);
    
    return appointments.filter(apt => {
      const aptDate = apt.date_time.split('T')[0];
      const aptTimeStr = apt.date_time.split('T')[1]?.substring(0, 5);
      if (!aptTimeStr) return false;
      
      const aptHour = parseInt(aptTimeStr.split(':')[0]);
      const aptMinute = parseInt(aptTimeStr.split(':')[1]);
      
      const matchesDay = aptDate === dayStr;
      
      // Match if appointment falls within this 30-minute slot
      // Es: slot 09:00 matches appointments from 09:00 to 09:29
      // Es: slot 09:30 matches appointments from 09:30 to 09:59
      const matchesTime = aptHour === slotHour && 
        aptMinute >= slotMinute && 
        aptMinute < slotMinute + 30;
      
      const matchesHairdresser = selectedHairdresser === 'all' || apt.hairdresser_id === selectedHairdresser;
      return matchesDay && matchesTime && matchesHairdresser;
    });
  };

  const isClosureDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return closures.some(c => c.date === dayStr);
  };

  const getClosureReason = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const closure = closures.find(c => c.date === dayStr);
    return closure?.reason || '';
  };

  const handleAddClosure = async () => {
    if (!newClosure.date || !newClosure.reason) {
      toast.error('Compila tutti i campi');
      return;
    }
    try {
      await axios.post('/admin/closures', newClosure);
      toast.success('Chiusura aggiunta');
      setShowClosureDialog(false);
      setNewClosure({ date: '', reason: '' });
      fetchData();
    } catch (error) {
      toast.error('Errore');
    }
  };

  const handleDeleteClosure = async (closureId) => {
    try {
      await axios.delete(`/admin/closures/${closureId}`);
      toast.success('Chiusura rimossa');
      fetchData();
    } catch (error) {
      toast.error('Errore');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-12"><div className="animate-pulse text-xl font-playfair">Caricamento...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal">Calendario</h2>
        <div className="flex gap-3">
          <select
            value={selectedHairdresser}
            onChange={(e) => setSelectedHairdresser(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="all">Tutti i parrucchieri</option>
            {hairdressers.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <Button onClick={() => setShowClosureDialog(true)} variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
            <Plus className="w-4 h-4 mr-2" /> Chiusura
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <Button variant="ghost" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(weekStart, 'd MMMM', { locale: it })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: it })}
        </h3>
        <Button variant="ghost" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Closures List */}
      {closures.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Giorni di Chiusura</h4>
          <div className="flex flex-wrap gap-2">
            {closures.map(c => (
              <span key={c.id} className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded border border-red-300 text-sm">
                <CalendarIcon className="w-4 h-4 text-red-500" />
                {format(parseISO(c.date), 'd MMM yyyy', { locale: it })} - {c.reason}
                <button onClick={() => handleDeleteClosure(c.id)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div className="p-2 bg-brand-charcoal text-white text-center text-sm font-semibold rounded">
              Ora
            </div>
            {weekDays.map((day, i) => {
              const isClosed = isClosureDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={`p-2 text-center text-sm font-semibold rounded ${
                    isClosed ? 'bg-red-500 text-white' : isToday ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-charcoal text-white'
                  }`}
                >
                  <div>{format(day, 'EEE', { locale: it })}</div>
                  <div>{format(day, 'd')}</div>
                  {isClosed && <div className="text-xs">{getClosureReason(day)}</div>}
                </div>
              );
            })}
          </div>

          {/* Time Slots */}
          {timeSlots.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-1 mb-1">
              <div className="p-2 bg-gray-100 text-center text-sm font-medium rounded">
                {time}
              </div>
              {weekDays.map((day, i) => {
                const isClosed = isClosureDay(day);
                const appts = getAppointmentsForSlot(day, time);

                if (isClosed) {
                  return (
                    <div key={i} className="p-1 bg-red-100 rounded min-h-[50px]" />
                  );
                }

                return (
                  <div key={i} className="p-1 bg-white border rounded min-h-[50px]">
                    {appts.map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs p-1 rounded mb-1 text-white ${getStatusColor(apt.status)}`}
                        title={`${apt.client_name || apt.user_name} - ${apt.service_name}`}
                      >
                        <div className="font-semibold truncate">{apt.client_name || apt.user_name}</div>
                        <div className="truncate opacity-90">{apt.service_name}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add Closure Dialog */}
      <Dialog open={showClosureDialog} onOpenChange={setShowClosureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair">Aggiungi Giorno di Chiusura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newClosure.date}
                onChange={(e) => setNewClosure({ ...newClosure, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                placeholder="Es: Ferie, Natale, Ferragosto..."
                value={newClosure.reason}
                onChange={(e) => setNewClosure({ ...newClosure, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClosureDialog(false)}>Annulla</Button>
            <Button onClick={handleAddClosure} className="bg-brand-charcoal text-white">Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
