import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { User, Phone, Mail, Check, X, Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveClient = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/clients/${clientId}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setClients(clients.map(c => 
          c.id === clientId ? { ...c, is_approved: true } : c
        ));
      }
    } catch (error) {
      console.error('Error approving client:', error);
    }
  };

  const revokeClient = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/clients/${clientId}/revoke`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setClients(clients.map(c => 
          c.id === clientId ? { ...c, is_approved: false } : c
        ));
      }
    } catch (error) {
      console.error('Error revoking client:', error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm);
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && !client.is_approved) ||
      (filter === 'approved' && client.is_approved);
    
    return matchesSearch && matchesFilter;
  });

  const pendingCount = clients.filter(c => !c.is_approved).length;
  const approvedCount = clients.filter(c => c.is_approved).length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-playfair font-semibold text-brand-charcoal">
        Gestione Clienti
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-brand-sand/30">
          <div className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-1">
            Totale Clienti
          </div>
          <div className="text-3xl font-playfair font-bold text-brand-charcoal">
            {clients.length}
          </div>
        </Card>
        <Card className="p-4 border-orange-300 bg-orange-50">
          <div className="text-sm font-medium tracking-widest uppercase text-orange-800 mb-1">
            Da Approvare
          </div>
          <div className="text-3xl font-playfair font-bold text-orange-800">
            {pendingCount}
          </div>
        </Card>
        <Card className="p-4 border-green-300 bg-green-50">
          <div className="text-sm font-medium tracking-widest uppercase text-green-800 mb-1">
            Approvati
          </div>
          <div className="text-3xl font-playfair font-bold text-green-800">
            {approvedCount}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, email o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="rounded-none"
          >
            Tutti
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            className="rounded-none"
          >
            Da Approvare ({pendingCount})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            className="rounded-none"
          >
            Approvati ({approvedCount})
          </Button>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <Card className="p-8 text-center border-brand-sand/30">
            <p className="text-muted-foreground">Nessun cliente trovato</p>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`p-4 ${client.is_approved ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${client.is_approved ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                        {client.is_approved ? 'Approvato' : 'In Attesa'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${client.phone}`} className="hover:text-brand-gold">
                          {client.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!client.is_approved ? (
                      <Button
                        onClick={() => approveClient(client.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-none"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approva
                      </Button>
                    ) : (
                      <Button
                        onClick={() => revokeClient(client.id)}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50 rounded-none"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Revoca
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminClients;
