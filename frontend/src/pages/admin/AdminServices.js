import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Scissors } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', duration_minutes: 30, price: 0, description: '' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService && editingService.id) {
        await axios.put(`/admin/services/${editingService.id}`, formData);
        toast.success('Servizio aggiornato');
      } else {
        await axios.post('/admin/services', formData);
        toast.success('Servizio creato');
      }
      setEditingService(null);
      setFormData({ name: '', duration_minutes: 30, price: 0, description: '' });
      fetchServices();
    } catch (error) {
      toast.error('Errore durante il salvataggio');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/admin/services/${id}`);
      toast.success('Servizio eliminato');
      fetchServices();
      setDeletingId(null);
    } catch (error) {
      toast.error('Errore durante l\'eliminazione');
    }
  };

  const openEdit = (service) => {
    setEditingService(service);
    setFormData({ name: service.name, duration_minutes: service.duration_minutes, price: service.price, description: service.description });
  };

  if (loading) return <div className="text-center py-12"><div className="animate-pulse text-xl font-playfair">Caricamento...</div></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-playfair font-semibold text-brand-charcoal">Gestione Servizi</h2>
        <Button onClick={() => { setEditingService({}); setFormData({ name: '', duration_minutes: 30, price: 0, description: '' }); }} className="bg-brand-charcoal text-white hover:bg-black rounded-none px-6 py-3">
          <Plus className="w-4 h-4 mr-2" /> Nuovo Servizio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="p-6 border-brand-sand/30 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <Scissors className="w-8 h-8 text-brand-gold" />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(service)} className="text-brand-charcoal hover:text-brand-gold">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingId(service.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h3 className="text-xl font-playfair font-semibold text-brand-charcoal mb-2">{service.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-gold font-semibold">€{service.price.toFixed(2)}</span>
              <span className="text-muted-foreground">{service.duration_minutes} min</span>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair">{editingService?.id ? 'Modifica Servizio' : 'Nuovo Servizio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>Descrizione</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durata (minuti)</Label>
                <Input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })} required />
              </div>
              <div>
                <Label>Prezzo (€)</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingService(null)}>Annulla</Button>
              <Button type="submit" className="bg-brand-charcoal text-white hover:bg-black">Salva</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>Sei sicuro di voler eliminare questo servizio? L'azione non può essere annullata.</AlertDialogDescription>
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

export default AdminServices;
