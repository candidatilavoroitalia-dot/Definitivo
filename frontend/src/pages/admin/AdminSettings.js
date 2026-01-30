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
    time_slots: []
  });
  const [newSlot, setNewSlot] = useState('');

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
