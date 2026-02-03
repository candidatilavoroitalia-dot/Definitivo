import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, Plus, X, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_image_url: '',
    working_days: [1, 2, 3, 4, 5, 6],
    opening_time: '09:00',
    closing_time: '19:00',
    time_slots: [],
    calendar_limit_type: 'always',
    calendar_limit_value: 0,
    salon_name: 'parrucco..',
    feature1_title: 'Prenota Online',
    feature1_desc: 'Scegli data e ora per il tuo appuntamento',
    feature2_title: 'Scegli il Parrucchiere',
    feature2_desc: 'Prenota con il tuo parrucchiere preferito',
    feature3_title: 'Promemoria Automatici',
    feature3_desc: 'Ricevi notifiche prima del tuo appuntamento',
    feature4_title: 'Gestione Facile',
    feature4_desc: 'Modifica o cancella i tuoi appuntamenti',
    cta_title: 'Pronto a Trasformare il Tuo Look?',
    cta_subtitle: 'Registrati ora e prenota il tuo primo appuntamento',
    app_section_title: "Scarica l'App sul Tuo Telefono",
    app_section_desc: 'Installa parrucco.. sul tuo dispositivo per un accesso ancora più rapido. Funziona anche offline!'
  });
  const [newSlot, setNewSlot] = useState('');

  const suggestedImages = [
    { url: 'https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', label: 'Salone Moderno' },
    { url: 'https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Forbici Professionali' },
    { url: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Salone Elegante' },
    { url: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Salone Vintage' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setFormData(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/admin/settings', formData);
      toast.success('Impostazioni salvate');
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    if (newSlot && !formData.time_slots.includes(newSlot)) {
      setFormData({ ...formData, time_slots: [...formData.time_slots, newSlot].sort() });
      setNewSlot('');
    }
  };

  const removeTimeSlot = (slot) => {
    setFormData({ ...formData, time_slots: formData.time_slots.filter(s => s !== slot) });
  };

  if (loading) return <div className="text-center py-12"><div className="animate-pulse text-xl font-playfair">Caricamento...</div></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal">Impostazioni Generali</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Hero Section Settings */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">Testi Home Page</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2">Titolo Principale</Label>
              <Input 
                value={formData.hero_title} 
                onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                placeholder="Il Tuo Salone, Sempre Disponibile"
                className="text-lg"
              />
            </div>
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2">Sottotitolo (opzionale)</Label>
              <Input 
                value={formData.hero_subtitle} 
                onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                placeholder="Lascia vuoto per non mostrare"
              />
            </div>
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2">Descrizione</Label>
              <Textarea 
                value={formData.hero_description} 
                onChange={(e) => setFormData({ ...formData, hero_description: e.target.value })}
                placeholder="Prenota il tuo appuntamento in pochi secondi..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-sm font-medium tracking-widest uppercase mb-2">URL Immagine Hero</Label>
              <Input 
                type="url"
                value={formData.hero_image_url} 
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                placeholder="https://images.pexels.com/photos/..."
                className="mb-3"
              />
              
              {/* Suggested Images */}
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Immagini Suggerite:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, hero_image_url: img.url })}
                      className="text-xs px-3 py-1 bg-brand-sand/30 hover:bg-brand-gold/30 border border-brand-sand hover:border-brand-gold transition-colors"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {formData.hero_image_url && (
                <div className="mt-3 border border-brand-sand/30 p-4">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Anteprima:</p>
                  <img 
                    src={formData.hero_image_url} 
                    alt="Hero preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x400/F9F9F7/1A1A1A?text=Immagine+non+disponibile';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Working Days and Hours Settings */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">Giorni e Orari Lavorativi</h3>
          
          <div className="space-y-6">
            {/* Working Days */}
            <div>
              <label className="text-sm font-medium tracking-widest uppercase mb-3 block">
                Giorni Lavorativi
              </label>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const newDays = formData.working_days.includes(index)
                        ? formData.working_days.filter(d => d !== index)
                        : [...formData.working_days, index].sort((a, b) => a - b);
                      setFormData({ ...formData, working_days: newDays });
                    }}
                    className={`py-3 text-sm font-medium transition-all ${
                      formData.working_days.includes(index)
                        ? 'bg-brand-charcoal text-white'
                        : 'bg-brand-sand/30 text-brand-charcoal hover:bg-brand-sand'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                I clienti potranno prenotare solo nei giorni selezionati
              </p>
            </div>

            {/* Working Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                  Apertura
                </label>
                <Input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium tracking-widest uppercase mb-2 block">
                  Chiusura
                </label>
                <Input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Time Slots Settings */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">Orari Disponibili</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                type="time"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                placeholder="09:00"
                className="flex-1"
              />
              <Button type="button" onClick={addTimeSlot} className="bg-brand-charcoal text-white hover:bg-black rounded-none">
                <Plus className="w-4 h-4 mr-2" />
                Aggiungi
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {formData.time_slots.map((slot) => (
                <div key={slot} className="flex items-center justify-between bg-brand-sand/30 px-3 py-2 border border-brand-sand">
                  <span className="font-medium">{slot}</span>
                  <button
                    type="button"
                    onClick={() => removeTimeSlot(slot)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {formData.time_slots.length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nessun orario configurato. Aggiungi almeno un orario.</p>
            )}
          </div>
        </Card>

        {/* Calendar Booking Limit */}
        <Card className="p-8 border-brand-sand/30">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-brand-gold" />
            <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal">Apertura Calendario Prenotazioni</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Scegli per quanto tempo in anticipo i clienti possono prenotare appuntamenti
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, calendar_limit_type: 'always', calendar_limit_value: 0 })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.calendar_limit_type === 'always'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">Sempre Aperto</div>
                <div className="text-sm text-muted-foreground">Prenotazioni senza limiti</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, calendar_limit_type: 'weeks', calendar_limit_value: formData.calendar_limit_value || 2 })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.calendar_limit_type === 'weeks'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">Settimane</div>
                <div className="text-sm text-muted-foreground">Limita a X settimane</div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, calendar_limit_type: 'months', calendar_limit_value: formData.calendar_limit_value || 1 })}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  formData.calendar_limit_type === 'months'
                    ? 'border-purple-500 bg-purple-50 text-purple-800'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-lg">Mesi</div>
                <div className="text-sm text-muted-foreground">Limita a X mesi</div>
              </button>
            </div>
            
            {formData.calendar_limit_type !== 'always' && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <label className="font-medium">
                  {formData.calendar_limit_type === 'weeks' ? 'Numero di settimane:' : 'Numero di mesi:'}
                </label>
                <Input
                  type="number"
                  min="1"
                  max={formData.calendar_limit_type === 'weeks' ? 52 : 12}
                  value={formData.calendar_limit_value || ''}
                  onChange={(e) => setFormData({ ...formData, calendar_limit_value: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  onBlur={(e) => {
                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                      setFormData({ ...formData, calendar_limit_value: 1 });
                    }
                  }}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  I clienti potranno prenotare fino a {formData.calendar_limit_value || 1} {formData.calendar_limit_type === 'weeks' ? 'settimane' : 'mesi'} in anticipo
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-brand-gold text-brand-charcoal hover:bg-brand-gold-light rounded-none px-8 py-6 text-sm uppercase tracking-widest"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
