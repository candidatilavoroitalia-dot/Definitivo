import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, Plus, X, Calendar, Type } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    salon_name: 'parrucco..',
    hero_title: '',
    hero_subtitle: '',
    hero_description: '',
    hero_image_url: '',
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
    app_section_desc: 'Installa parrucco.. sul tuo dispositivo per un accesso ancora più rapido. Funziona anche offline!',
    working_days: [1, 2, 3, 4, 5, 6],
    opening_time: '09:00',
    closing_time: '19:00',
    time_slots: [],
    calendar_limit_type: 'always',
    calendar_limit_value: 0
  });
  const [newSlot, setNewSlot] = useState('');

  const suggestedImages = [
    { url: 'https://images.pexels.com/photos/7195799/pexels-photo-7195799.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', label: 'Salone Elegante' },
    { url: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Taglio Professionale' },
    { url: 'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Styling Moderno' },
    { url: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750', label: 'Salone Vintage' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/settings');
        setFormData(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        toast.error('Errore nel caricamento delle impostazioni');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

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
        
        {/* 1. NOME SALONE (Header) */}
        <Card className="p-8 border-brand-sand/30">
          <div className="flex items-center gap-3 mb-6">
            <Type className="w-6 h-6 text-brand-gold" />
            <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal">1. Nome del Salone</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Appare nell'header del sito</p>
          <Input
            value={formData.salon_name}
            onChange={(e) => setFormData({ ...formData, salon_name: e.target.value })}
            className="text-lg"
            placeholder="es. Il Mio Salone"
          />
        </Card>

        {/* 2. HERO SECTION */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">2. Sezione Hero (Principale)</h3>
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
              <Label className="text-sm font-medium tracking-widest uppercase mb-2">Immagine Hero</Label>
              <Input 
                type="url"
                value={formData.hero_image_url} 
                onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                placeholder="https://images.pexels.com/photos/..."
                className="mb-3"
              />
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Immagini Suggerite:</p>
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
                  <p className="text-xs text-muted-foreground mb-2">Anteprima:</p>
                  <img 
                    src={formData.hero_image_url} 
                    alt="Hero preview" 
                    className="w-full h-48 object-cover"
                    onError={(e) => { e.target.src = 'https://placehold.co/600x400/F9F9F7/1A1A1A?text=Immagine+non+disponibile'; }}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 3. FEATURES - Perché Scegliere Noi */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">3. Sezione "Perché Scegliere Noi"</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label className="font-semibold">Feature 1</Label>
              <Input
                value={formData.feature1_title}
                onChange={(e) => setFormData({ ...formData, feature1_title: e.target.value })}
                placeholder="Titolo"
              />
              <Input
                value={formData.feature1_desc}
                onChange={(e) => setFormData({ ...formData, feature1_desc: e.target.value })}
                placeholder="Descrizione"
              />
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label className="font-semibold">Feature 2</Label>
              <Input
                value={formData.feature2_title}
                onChange={(e) => setFormData({ ...formData, feature2_title: e.target.value })}
                placeholder="Titolo"
              />
              <Input
                value={formData.feature2_desc}
                onChange={(e) => setFormData({ ...formData, feature2_desc: e.target.value })}
                placeholder="Descrizione"
              />
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label className="font-semibold">Feature 3</Label>
              <Input
                value={formData.feature3_title}
                onChange={(e) => setFormData({ ...formData, feature3_title: e.target.value })}
                placeholder="Titolo"
              />
              <Input
                value={formData.feature3_desc}
                onChange={(e) => setFormData({ ...formData, feature3_desc: e.target.value })}
                placeholder="Descrizione"
              />
            </div>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label className="font-semibold">Feature 4</Label>
              <Input
                value={formData.feature4_title}
                onChange={(e) => setFormData({ ...formData, feature4_title: e.target.value })}
                placeholder="Titolo"
              />
              <Input
                value={formData.feature4_desc}
                onChange={(e) => setFormData({ ...formData, feature4_desc: e.target.value })}
                placeholder="Descrizione"
              />
            </div>
          </div>
        </Card>

        {/* 4. CTA - Call to Action */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">4. Sezione Call to Action</h3>
          <div className="space-y-4">
            <div>
              <Label>Titolo CTA</Label>
              <Input
                value={formData.cta_title}
                onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                className="mt-2"
                placeholder="Pronto a Trasformare il Tuo Look?"
              />
            </div>
            <div>
              <Label>Sottotitolo CTA</Label>
              <Input
                value={formData.cta_subtitle}
                onChange={(e) => setFormData({ ...formData, cta_subtitle: e.target.value })}
                className="mt-2"
                placeholder="Registrati ora e prenota il tuo primo appuntamento"
              />
            </div>
          </div>
        </Card>

        {/* 5. APP SECTION - Download App */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">5. Sezione Download App</h3>
          <div className="space-y-4">
            <div>
              <Label>Titolo</Label>
              <Input
                value={formData.app_section_title}
                onChange={(e) => setFormData({ ...formData, app_section_title: e.target.value })}
                className="mt-2"
                placeholder="Scarica l'App sul Tuo Telefono"
              />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={formData.app_section_desc}
                onChange={(e) => setFormData({ ...formData, app_section_desc: e.target.value })}
                className="mt-2"
                rows={2}
                placeholder="Installa l'app sul tuo dispositivo..."
              />
            </div>
          </div>
        </Card>

        {/* 6. GIORNI E ORARI LAVORATIVI */}
        <Card className="p-8 border-brand-sand/30">
          <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal mb-6">6. Giorni e Orari Lavorativi</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium tracking-widest uppercase mb-3 block">Giorni Lavorativi</label>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const newDays = formData.working_days.includes(index)
                        ? formData.working_days.filter(d => d !== index)
                        : [...formData.working_days, index];
                      setFormData({ ...formData, working_days: newDays });
                    }}
                    className={`p-3 text-sm font-medium border transition-colors ${
                      formData.working_days.includes(index)
                        ? 'bg-brand-charcoal text-white border-brand-charcoal'
                        : 'bg-white text-brand-charcoal border-brand-sand hover:border-brand-charcoal'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium tracking-widest uppercase mb-3 block">Orari Disponibili</label>
              <div className="flex gap-2 mb-3">
                <Input
                  type="time"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="w-32"
                />
                <Button type="button" onClick={addTimeSlot} variant="outline" className="border-brand-charcoal">
                  <Plus className="w-4 h-4 mr-1" /> Aggiungi
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.time_slots.sort().map((slot) => (
                  <div key={slot} className="flex items-center gap-1 px-3 py-2 bg-brand-sand/30 border border-brand-sand">
                    <span className="text-sm font-medium">{slot}</span>
                    <button type="button" onClick={() => removeTimeSlot(slot)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {formData.time_slots.length === 0 && (
                <p className="text-sm text-muted-foreground italic">Nessun orario configurato.</p>
              )}
            </div>
          </div>
        </Card>

        {/* 7. APERTURA CALENDARIO */}
        <Card className="p-8 border-brand-sand/30">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-brand-gold" />
            <h3 className="text-2xl font-playfair font-semibold text-brand-charcoal">7. Apertura Calendario Prenotazioni</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Scegli per quanto tempo in anticipo i clienti possono prenotare
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
                <div className="text-sm text-muted-foreground">Senza limiti</div>
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
                  Prenotazioni fino a {formData.calendar_limit_value || 1} {formData.calendar_limit_type === 'weeks' ? 'settimane' : 'mesi'} in anticipo
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 uppercase tracking-widest"
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
