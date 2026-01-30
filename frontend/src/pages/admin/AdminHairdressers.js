import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

const AdminHairdressers = () => {
  const [hairdressers, setHairdressers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', specialties: '' });

  useEffect(() => {
    fetchHairdressers();
  }, []);

  const fetchHairdressers = async () => {
    try {
      const response = await axios.get('/hairdressers');
      setHairdressers(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...formData, specialties: formData.specialties.split(',').map(s => s.trim()) };
    try {
      if (editing?.id) {
        await axios.put(`/admin/hairdressers/${editing.id}`, data);
        toast.success('Parrucchiere aggiornato');
      } else {
        await axios.post('/admin/hairdressers', data);
        toast.success('Parrucchiere creato');
      }
      setEditing(null);
      setFormData({ name: '', specialties: '' });
      fetchHairdressers();
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/admin/hairdressers/${id}`);
      toast.success('Parrucchiere eliminato');
      fetchHairdressers();
      setDeletingId(null);
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const openEdit = (hairdresser) => {
    setEditing(hairdresser);
    setFormData({ name: hairdresser.name, specialties: hairdresser.specialties.join(', ') });
  };

  if (loading) return <div className="text-center py-12"><div className="animate-pulse text-xl font-playfair">Caricamento...</div></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal">Gestione Parrucchieri</h2>
        <Button onClick={() => { setEditing({}); setFormData({ name: '', specialties: '' }); }} className="bg-brand-charcoal text-white hover:bg-black rounded-none px-6 py-3">
          <Plus className="w-4 h-4 mr-2" /> Nuovo Parrucchiere
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hairdressers.map((hairdresser) => (
          <Card key={hairdresser.id} className="p-6 border-brand-sand/30 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <User className="w-8 h-8 text-brand-gold" />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(hairdresser)} className="text-brand-charcoal hover:text-brand-gold">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(hairdresser.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-2">{hairdresser.name}</h3>
            <p className="text-sm text-muted-foreground">
              <strong>Specialità:</strong> {hairdresser.specialties.join(', ')}
            </p>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair">{editing?.id ? 'Modifica Parrucchiere' : 'Nuovo Parrucchiere'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>Specialità (separate da virgola)</Label>
              <Input value={formData.specialties} onChange={(e) => setFormData({ ...formData, specialties: e.target.value })} placeholder="Taglio Uomo, Colore, Piega" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Annulla</Button>
              <Button type="submit" className="bg-brand-charcoal text-white hover:bg-black">Salva</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questo parrucchiere?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deletingId)} className="bg-red-600 hover:bg-red-700">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHairdressers;
