import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Save, Plus, X } from 'lucide-react';
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
    admin_phone: '',
    working_days: [1, 2, 3, 4, 5, 6],
    opening_time: '09:00',
    closing_time: '19:00',
    time_slots: []
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
