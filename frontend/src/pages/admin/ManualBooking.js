import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, Clock, User, Phone, Mail, Scissors, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('it', it);

const ManualBooking = () => {
  const [services, setServices] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_id: '',
    hairdresser_id: '',
    date: null,
    time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.date && formData.service_id && formData.hairdresser_id) {
      fetchAvailableSlots();
    }
  }, [formData.date, formData.service_id, formData.hairdresser_id]);

  const fetchData = async () => {
    try {
      const [servicesRes, hairdressersRes, settingsRes] = await Promise.all([
        axios.get('/services'),
        axios.get('/hairdressers'),
        axios.get('/settings')
      ]);
      setServices(servicesRes.data);
      setHairdressers(hairdressersRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Errore nel caricamento dei dati');
    }
  };

  const fetchAvailableSlots = async () => {
    if (!formData.date || !formData.service_id || !formData.hairdresser_id) return;
    
    setLoadingSlots(true);
    try {
      const dateStr = format(formData.date, 'yyyy-MM-dd');
      const response = await axios.post('/availability', {
        date: dateStr,
        service_id: formData.service_id,
        hairdresser_id: formData.hairdresser_id
      });
      setAvailableSlots(response.data.available_slots);
    } catch (error) {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateDisabled = (date) => {
    if (!settings) return true;
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (!settings.working_days?.includes(dayOfWeek)) return true;
    
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.client_name || !formData.client_phone || !formData.service_id || 
        !formData.hairdresser_id || !formData.date || !formData.time) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    setSubmitting(true);
    try {
      const dateTime = new Date(formData.date);
      const [hours, minutes] = formData.time.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await axios.post('/admin/appointments/manual', {
        client_name: formData.client_name,
        client_email: formData.client_email || null,
        client_phone: formData.client_phone,
        service_id: formData.service_id,
        hairdresser_id: formData.hairdresser_id,
        date_time: dateTime.toISOString()
      });

      toast.success('Appuntamento creato con successo!');
      
      // Reset form
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        service_id: '',
        hairdresser_id: '',
        date: null,
        time: ''
      });
      setAvailableSlots([]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore nella creazione dell\'appuntamento');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.service_id);
  const selectedHairdresser = hairdressers.find(h => h.id === formData.hairdresser_id);
  const timeSlots = settings?.time_slots || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <UserPlus className="w-8 h-8 text-brand-gold" />
        <h1 className="text-4xl font-playfair font-semibold text-brand-charcoal">
          Nuovo Appuntamento Manuale
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Client Info */}
        <Card className="p-8 border-brand-sand/30">
          <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-gold" />
            Dati Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                Nome Cliente *
              </Label>
              <Input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                placeholder="Mario Rossi"
                required
                data-testid="client-name-input"
              />
            </div>
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                Telefono *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="+39 333 1234567"
                  className="pl-10"
                  required
                  data-testid="client-phone-input"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                Email (opzionale)
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  placeholder="mario@email.com"
                  className="pl-10"
                  data-testid="client-email-input"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Service Selection */}
        <Card className="p-8 border-brand-sand/30">
          <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-brand-gold" />
            Servizio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setFormData({ ...formData, service_id: service.id, time: '' })}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  formData.service_id === service.id
                    ? 'border-brand-gold border-2 bg-brand-gold/5'
                    : 'border-brand-sand/30 hover:border-brand-gold/50'
                }`}
                data-testid={`service-${service.id}`}
              >
                <h3 className="font-semibold text-brand-charcoal">{service.name}</h3>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>€{service.price.toFixed(2)}</span>
                  <span>{service.duration_minutes} min</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Hairdresser Selection */}
        <Card className="p-8 border-brand-sand/30">
          <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-brand-gold" />
            Parrucchiere
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hairdressers.map((hairdresser) => (
              <button
                key={hairdresser.id}
                type="button"
                onClick={() => setFormData({ ...formData, hairdresser_id: hairdresser.id, time: '' })}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  formData.hairdresser_id === hairdresser.id
                    ? 'border-brand-gold border-2 bg-brand-gold/5'
                    : 'border-brand-sand/30 hover:border-brand-gold/50'
                }`}
                data-testid={`hairdresser-${hairdresser.id}`}
              >
                <h3 className="font-semibold text-brand-charcoal">{hairdresser.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hairdresser.specialties?.join(', ')}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Date and Time Selection */}
        <Card className="p-8 border-brand-sand/30">
          <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-gold" />
            Data e Ora
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                Seleziona Data
              </Label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({ ...formData, date, time: '' })}
                filterDate={(date) => !isDateDisabled(date)}
                locale="it"
                dateFormat="dd MMMM yyyy"
                minDate={new Date()}
                placeholderText="Seleziona una data"
                className="w-full px-4 py-3 border border-brand-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold"
                data-testid="date-picker"
              />
            </div>

            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                Seleziona Orario
              </Label>
              {!formData.date || !formData.service_id || !formData.hairdresser_id ? (
                <p className="text-muted-foreground text-sm py-4">
                  Seleziona prima servizio, parrucchiere e data
                </p>
              ) : loadingSlots ? (
                <p className="text-muted-foreground text-sm py-4">Caricamento orari...</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isAvailable = availableSlots.includes(time);
                    const isSelected = formData.time === time;
                    
                    if (isAvailable) {
                      return (
                        <Button
                          key={time}
                          type="button"
                          variant="outline"
                          onClick={() => setFormData({ ...formData, time })}
                          className={`${
                            isSelected
                              ? 'bg-brand-charcoal text-white border-brand-charcoal'
                              : 'border-brand-sand hover:border-brand-gold'
                          }`}
                          data-testid={`time-${time}`}
                        >
                          {time}
                        </Button>
                      );
                    } else {
                      return (
                        <div
                          key={time}
                          className="inline-flex items-center justify-center h-9 px-3 text-sm border border-red-200 bg-red-50 text-red-300 rounded-md line-through"
                        >
                          {time}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Summary */}
        {formData.client_name && formData.service_id && formData.hairdresser_id && formData.date && formData.time && (
          <Card className="p-8 border-brand-gold bg-brand-gold/5">
            <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-4">
              Riepilogo Appuntamento
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-semibold">{formData.client_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Servizio:</span>
                <p className="font-semibold">{selectedService?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Parrucchiere:</span>
                <p className="font-semibold">{selectedHairdresser?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Data e Ora:</span>
                <p className="font-semibold">
                  {format(formData.date, 'd MMMM yyyy', { locale: it })} - {formData.time}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !formData.client_name || !formData.client_phone || 
                     !formData.service_id || !formData.hairdresser_id || !formData.date || !formData.time}
            className="bg-brand-charcoal text-white hover:bg-black rounded-none px-12 py-6 text-sm uppercase tracking-widest"
            data-testid="submit-booking"
          >
            {submitting ? 'Creazione in corso...' : 'Crea Appuntamento'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManualBooking;
