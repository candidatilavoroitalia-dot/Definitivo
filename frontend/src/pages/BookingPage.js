import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Search, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format, addMonths } from 'date-fns';
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
  const [searchingFirst, setSearchingFirst] = useState(false);
  const [daysStatus, setDaysStatus] = useState({});
  
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
        date: format(selectedDate, 'yyyy-MM-dd'),
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

  // Carica lo stato dei giorni (liberi/occupati/chiusi)
  const fetchDaysStatus = async () => {
    if (!selectedService || !selectedHairdresser) return;
    
    try {
      const today = new Date();
      const endDate = addMonths(today, 6); // 6 mesi avanti
      
      const response = await axios.post('/availability/days-status', {
        service_id: selectedService.id,
        hairdresser_id: selectedHairdresser.id,
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      const statusMap = {};
      response.data.forEach(day => {
        statusMap[day.date] = day.status;
      });
      setDaysStatus(statusMap);
    } catch (error) {
      console.error('Error fetching days status:', error);
    }
  };

  // Cerca il primo appuntamento libero
  const findFirstAvailable = async () => {
    if (!selectedService || !selectedHairdresser) {
      toast.error('Seleziona prima servizio e parrucchiere');
      return;
    }
    
    setSearchingFirst(true);
    try {
      const response = await axios.post('/availability/first', {
        service_id: selectedService.id,
        hairdresser_id: selectedHairdresser.id,
        days_to_search: 60
      });
      
      if (response.data.found) {
        const foundDate = new Date(response.data.date + 'T00:00:00');
        setSelectedDate(foundDate);
        setSelectedTime(response.data.time);
        toast.success(`Trovato! ${format(foundDate, 'd MMMM yyyy', { locale: it })} alle ${response.data.time}`);
      } else {
        toast.error('Nessun appuntamento disponibile nei prossimi 60 giorni');
      }
    } catch (error) {
      toast.error('Errore nella ricerca');
    } finally {
      setSearchingFirst(false);
    }
  };

  // Carica lo stato dei giorni quando si arriva allo step 3
  useEffect(() => {
    if (step === 3 && selectedService && selectedHairdresser) {
      fetchDaysStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selectedService, selectedHairdresser]);

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const dayOfWeek = date.getDay();
    return !workingDays.includes(dayOfWeek);
  };

  // Funzione per determinare il colore del giorno nel calendario
  const getDayClassName = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = daysStatus[dateStr];
    
    if (status === 'available') {
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    } else if (status === 'full') {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    } else if (status === 'closed') {
      return 'bg-gray-100 text-gray-400';
    }
    return '';
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedHairdresser || !selectedDate || !selectedTime) {
      toast.error('Completa tutti i campi');
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dateTimeStr = `${dateStr}T${selectedTime}:00Z`;

      await axios.post('/appointments', {
        service_id: selectedService.id,
        hairdresser_id: selectedHairdresser.id,
        date_time: dateTimeStr
      });

      toast.success('Appuntamento prenotato con successo!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Errore durante la prenotazione');
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
  };

  const handleHairdresserSelect = (hairdresser) => {
    setSelectedHairdresser(hairdresser);
  };

  const goToStep = (newStep) => {
    setStep(newStep);
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
      <header className="bg-white border-b border-brand-sand/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-playfair font-bold text-brand-charcoal">
            Prenota Appuntamento
          </h1>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-brand-charcoal"
          >
            Dashboard
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step ? 'bg-brand-charcoal text-white' : 'bg-brand-sand text-brand-charcoal'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-2 ${s < step ? 'bg-brand-charcoal' : 'bg-brand-sand'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Servizi */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal">
              Scegli il Servizio
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`p-5 rounded-xl border bg-white cursor-pointer select-none ${
                    selectedService?.id === service.id
                      ? 'border-brand-gold border-2 shadow-lg'
                      : 'border-brand-sand/30'
                  }`}
                  data-testid={`service-card-${service.id}`}
                >
                  <h3 className="text-lg font-playfair font-semibold text-brand-charcoal">
                    {service.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <div className="flex justify-between items-center text-sm mt-3">
                    <span className="text-brand-gold font-semibold">€{service.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">{service.duration_minutes} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Parrucchieri */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal">
              Scegli il Parrucchiere
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {hairdressers.map((hairdresser) => (
                <div
                  key={hairdresser.id}
                  onClick={() => handleHairdresserSelect(hairdresser)}
                  className={`p-5 rounded-xl border bg-white cursor-pointer select-none ${
                    selectedHairdresser?.id === hairdresser.id
                      ? 'border-brand-gold border-2 shadow-lg'
                      : 'border-brand-sand/30'
                  }`}
                  data-testid={`hairdresser-card-${hairdresser.id}`}
                >
                  <h3 className="text-lg font-playfair font-semibold text-brand-charcoal">
                    {hairdresser.name}
                  </h3>
                  {hairdresser.specialties && hairdresser.specialties.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Specialità: {hairdresser.specialties.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Data e Ora */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-playfair font-semibold text-brand-charcoal">
              Scegli Data e Ora
            </h2>
            
            {/* Pulsante Trova Primo Disponibile */}
            <Button
              onClick={findFirstAvailable}
              disabled={searchingFirst}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              data-testid="find-first-available"
            >
              <Zap className="w-5 h-5 mr-2" />
              {searchingFirst ? 'Ricerca in corso...' : 'Trova Primo Appuntamento Libero'}
            </Button>

            {/* Legenda colori */}
            <div className="flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-200"></div>
                <span>Disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200"></div>
                <span>Pieno</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-200"></div>
                <span>Chiuso</span>
              </div>
            </div>
            
            <Card className="p-5 border-brand-sand/30">
              <div className="mb-6">
                <label className="text-sm font-medium uppercase mb-3 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
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
                      modifiers={{
                        available: (date) => daysStatus[format(date, 'yyyy-MM-dd')] === 'available',
                        full: (date) => daysStatus[format(date, 'yyyy-MM-dd')] === 'full',
                        closed: (date) => daysStatus[format(date, 'yyyy-MM-dd')] === 'closed',
                      }}
                      modifiersClassNames={{
                        available: 'bg-green-100 text-green-800 hover:bg-green-200',
                        full: 'bg-red-100 text-red-800 hover:bg-red-200',
                        closed: 'bg-gray-100 text-gray-400',
                      }}
                      locale={it}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium uppercase mb-3 block">Orario</label>
                {!selectedDate ? (
                  <p className="text-center py-6 text-muted-foreground">
                    Seleziona prima una data
                  </p>
                ) : loadingSlots ? (
                  <p className="text-center py-6 text-muted-foreground">Caricamento...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => {
                      const isAvailable = availableSlots.includes(time);
                      const isSelected = selectedTime === time;
                      
                      return isAvailable ? (
                        <Button
                          key={time}
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedTime(time)}
                          className={isSelected ? 'bg-brand-charcoal text-white' : ''}
                          data-testid={`time-slot-${time}`}
                        >
                          {time}
                        </Button>
                      ) : (
                        <div
                          key={time}
                          className="h-9 flex items-center justify-center text-sm border border-red-200 bg-red-50 text-red-300 rounded-md line-through"
                        >
                          {time}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Riepilogo */}
            {selectedDate && selectedTime && (
              <Card className="p-5 bg-brand-bone border-brand-sand">
                <h3 className="text-lg font-playfair font-semibold text-brand-charcoal mb-3">
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
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            onClick={() => goToStep(step - 1)}
            disabled={step === 1}
            variant="outline"
            className="px-6"
            data-testid="prev-button"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          
          {step < 3 ? (
            <Button
              type="button"
              onClick={() => goToStep(step + 1)}
              disabled={!canGoNext()}
              className="bg-brand-charcoal text-white px-6"
              data-testid="next-button"
            >
              Avanti
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canGoNext() || submitting}
              className="bg-brand-gold text-brand-charcoal px-6"
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
