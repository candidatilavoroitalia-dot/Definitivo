import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Calendar, Scissors, Users, FileText, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AdminLayout = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: Calendar, label: 'Appuntamenti', exact: true },
    { path: '/admin/nuovo', icon: UserPlus, label: 'Nuovo' },
    { path: '/admin/services', icon: Scissors, label: 'Servizi' },
    { path: '/admin/hairdressers', icon: Users, label: 'Parrucchieri' },
    { path: '/admin/settings', icon: FileText, label: 'Impostazioni' },
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
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <nav className="flex gap-1" data-testid="admin-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium tracking-wide transition-colors border-b-2 ${
                    active
                      ? 'border-brand-charcoal text-brand-charcoal'
                      : 'border-transparent text-muted-foreground hover:text-brand-charcoal'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
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
