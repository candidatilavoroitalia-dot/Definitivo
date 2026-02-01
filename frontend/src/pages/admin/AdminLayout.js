import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Calendar, Scissors, Users, FileText, UserPlus, CalendarDays, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLayout = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [pendingClients, setPendingClients] = useState(0);

  useEffect(() => {
    fetchCounts();
    // Aggiorna ogni 30 secondi
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending appointments
      const aptsResponse = await fetch(`${API_URL}/api/appointments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (aptsResponse.ok) {
        const apts = await aptsResponse.json();
        const pending = apts.filter(a => a.status === 'pending').length;
        setPendingAppointments(pending);
      }

      // Fetch pending clients
      const clientsResponse = await fetch(`${API_URL}/api/admin/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (clientsResponse.ok) {
        const clients = await clientsResponse.json();
        const pendingC = clients.filter(c => !c.is_approved).length;
        setPendingClients(pendingC);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const menuItems = [
    { path: '/admin', icon: Calendar, label: 'Appuntamenti', exact: true, badge: pendingAppointments },
    { path: '/admin/calendario', icon: CalendarDays, label: 'Calendario' },
    { path: '/admin/nuovo', icon: UserPlus, label: 'Nuovo' },
    { path: '/admin/clienti', icon: UserCheck, label: 'Clienti', badge: pendingClients },
    { path: '/admin/servizi', icon: Scissors, label: 'Servizi' },
    { path: '/admin/parrucchieri', icon: Users, label: 'Parrucchieri' },
    { path: '/admin/impostazioni', icon: FileText, label: 'Impostazioni' },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-brand-bone">
      {/* Header */}
      <header className="bg-white border-b border-brand-sand/20" data-testid="admin-header">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-playfair font-bold text-brand-charcoal">
              Pannello Amministratore
            </h1>
            <p className="text-sm text-muted-foreground">Gestione completa</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="home-button"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              className="text-brand-charcoal hover:text-brand-gold font-medium tracking-wide"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-brand-sand/20">
        <div className="w-full px-4">
          <nav className="flex gap-1 overflow-x-auto" data-testid="admin-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium tracking-wide transition-colors border-b-2 whitespace-nowrap ${
                    active
                      ? 'border-brand-charcoal text-brand-charcoal'
                      : 'border-transparent text-muted-foreground hover:text-brand-charcoal'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
