import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BookingPage = ({ user, logout }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [hairdressers, setHairdressers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5, 6]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedService, setSelectedService] = useState(null);
  const [selectedHairdresser, setSelectedHairdresser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService && selectedHairdresser) {
      fetchAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, selectedHairdresser]);

  const fetchData = async () => {
    try {
      const [servicesRes, hairdressersRes, settingsRes] = await Promise.all([
        axios.get('/services'),
        axios.get('/hairdressers'),
        axios.get('/settings')
      ]);
      setServices(servicesRes.data);
      setHairdressers(hairdressersRes.data);
      setTimeSlots(settingsRes.data.time_slots || [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
      ]);
      setWorkingDays(settingsRes.data.working_days || [1, 2, 3, 4, 5, 6]);
    } catch (error) {
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const response = await axios.post('/availability', {
        date: selectedDate.toISOString().split('T')[0],
        service_id: selectedService.id,
        hairdresser_id: selectedHairdresser.id
      });
      setAvailableSlots(response.data.available_slots);
    } catch (error) {
      toast.error('Errore nel caricamento degli slot');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateDisabled = (date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return true;
    }
    
    // Disable non-working days (0=Sunday, 1=Monday, etc.)
    const dayOfWeek = date.getDay();
    return !workingDays.includes(dayOfWeek);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedHairdresser || !selectedDate || !selectedTime) {
      toast.error('Completa tutti i campi');
      return;
    }

    setSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await axios.post('/appointments', {
        service_id: selectedService.id,
        hairdresser_id: selectedHairdresser.id,
        date_time: dateTime.toISOString()
      });

      toast.success('Appuntamento prenotato! Riceverai un promemoria su WhatsApp.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore durante la prenotazione');
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return selectedService !== null;
    if (step === 2) return selectedHairdresser !== null;
    if (step === 3) return selectedDate !== null && selectedTime !== null;
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bone">
        <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bone">
      {/* Header */}
      <header className="bg-white border-b border-brand-sand/20" data-testid="booking-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-playfair font-bold text-brand-charcoal">
            Prenota Appuntamento
          </h1>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
            data-testid="back-dashboard-button"
          >
            Torna alla Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress Indicator */}
        <div className="flex justify-center items-center gap-4 mb-12" data-testid="progress-indicator">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s <= step
                    ? 'bg-brand-charcoal text-white'
                    : 'bg-brand-sand text-brand-charcoal'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition-all ${
                    s < step ? 'bg-brand-charcoal' : 'bg-brand-sand'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6" data-testid="step-title">
                Scegli il Servizio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-6 cursor-pointer transition-all duration-300 ${
                      selectedService?.id === service.id
                        ? 'border-brand-gold border-2 shadow-xl'
                        : 'border-brand-sand/30 hover:shadow-lg'
                    }`}
                    data-testid={`service-card-${service.id}`}
                  >
                    <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-brand-gold font-semibold">€{service.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{service.duration_minutes} min</span>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6" data-testid="step-title">
                Scegli il Parrucchiere
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {hairdressers.map((hairdresser) => (
                  <button
                    key={hairdresser.id}
                    type="button"
                    onClick={() => setSelectedHairdresser(hairdresser)}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSelectedHairdresser(hairdresser);
                    }}
                    className={`w-full text-left p-6 rounded-xl border bg-white transition-all duration-300 ${
                      selectedHairdresser?.id === hairdresser.id
                        ? 'border-brand-gold border-2 shadow-xl ring-2 ring-brand-gold/20'
                        : 'border-brand-sand/30 hover:shadow-lg active:scale-[0.98]'
                    }`}
                    data-testid={`hairdresser-card-${hairdresser.id}`}
                  >
                    <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-2">
                      {hairdresser.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Specialità: {hairdresser.specialties.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal mb-6" data-testid="step-title">
                Scegli Data e Ora
              </h2>
              
              <Card className="p-6 border-brand-sand/30">
                <div className="mb-6">
                  <label className="text-sm font-medium tracking-widest uppercase mb-3 block">
                    Data
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-brand-charcoal/20 hover:border-brand-charcoal rounded-none"
                        data-testid="date-picker-button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP', { locale: it }) : 'Seleziona una data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={isDateDisabled}
                        initialFocus
                        locale={it}
                        data-testid="calendar"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="text-sm font-medium tracking-widest uppercase mb-3 block">
                    Orario
                  </label>
                  {!selectedDate ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Seleziona prima una data per vedere gli orari disponibili
                    </div>
                  ) : loadingSlots ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Caricamento slot disponibili...
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun orario configurato. Contatta il salone.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {timeSlots.map((time) => {
                          const isAvailable = availableSlots.includes(time);
                          const isSelected = selectedTime === time;
                          
                          if (isAvailable) {
                            return (
                              <Button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                variant="outline"
                                className={`rounded-none transition-all ${
                                  isSelected
                                    ? 'bg-brand-charcoal text-white border-brand-charcoal'
                                    : 'border-brand-sand hover:border-brand-charcoal hover:bg-brand-sand/20'
                                }`}
                                data-testid={`time-slot-${time}`}
                              >
                                {time}
                              </Button>
                            );
                          } else {
                            // Slot occupato - usa div invece di Button per evitare conflitti stile
                            return (
                              <div
                                key={time}
                                className="relative inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium rounded-none border border-red-300 bg-red-50 text-red-400 cursor-not-allowed select-none"
                                style={{ textDecoration: 'line-through' }}
                                data-testid={`time-slot-${time}-occupied`}
                              >
                                {time}
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                              </div>
                            );
                          }
                        })}
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border border-brand-sand rounded-sm"></div>
                          <span>Disponibile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-50 border border-red-300 rounded-sm relative">
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                          <span>Occupato</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Summary */}
              {selectedDate && selectedTime && (
                <Card className="p-6 bg-brand-bone border-brand-sand" data-testid="booking-summary">
                  <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-4">
                    Riepilogo
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servizio:</span>
                      <span className="font-semibold">{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parrucchiere:</span>
                      <span className="font-semibold">{selectedHairdresser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-semibold">{format(selectedDate, 'PPP', { locale: it })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ora:</span>
                      <span className="font-semibold">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-brand-sand">
                      <span className="text-muted-foreground">Prezzo:</span>
                      <span className="font-semibold text-brand-gold">€{selectedService.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <Button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            variant="outline"
            className="border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all"
            data-testid="prev-button"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
              data-testid="next-button"
            >
              Avanti
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
              data-testid="submit-booking-button"
            >
              {submitting ? 'Prenotazione...' : 'Conferma Prenotazione'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
