import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import InstallPWA from './components/InstallPWA';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminServices from './pages/admin/AdminServices';
import AdminHairdressers from './pages/admin/AdminHairdressers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminClients from './pages/admin/AdminClients';
import ManualBooking from './pages/admin/ManualBooking';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        // Assicura che is_approved sia definito (per utenti vecchi)
        if (parsedUser.is_approved === undefined) {
          parsedUser.is_approved = true; // Default per utenti esistenti
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Attiva automaticamente le notifiche push
    try {
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
          });
          
          // Salva la subscription nel backend
          await axios.post('/api/push/subscribe', {
            subscription: subscription.toJSON()
          });
          console.log('Notifiche push attivate automaticamente');
        }
      }
    } catch (error) {
      console.log('Errore attivazione notifiche automatiche:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logout effettuato');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bone">
        <div className="animate-pulse text-xl font-playfair">Caricamento...</div>
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage user={user} logout={logout} />} />
          <Route
            path="/auth"
            element={user ? <Navigate to="/dashboard" /> : <AuthPage login={login} />}
          />
          <Route
            path="/dashboard"
            element={user && !user.is_admin ? <Dashboard user={user} logout={logout} /> : <Navigate to={user?.is_admin ? "/admin" : "/auth"} />}
          />
          <Route
            path="/book"
            element={user && !user.is_admin && user.is_approved ? <BookingPage user={user} logout={logout} /> : <Navigate to={user?.is_admin ? "/admin" : (user ? "/dashboard" : "/auth")} />}
          />
          <Route
            path="/admin/*"
            element={user && user.is_admin ? <AdminLayout user={user} logout={logout} /> : <Navigate to={user ? "/dashboard" : "/auth"} />}
          >
            <Route index element={<AdminAppointments />} />
            <Route path="calendario" element={<AdminCalendar />} />
            <Route path="nuovo" element={<ManualBooking />} />
            <Route path="clienti" element={<AdminClients />} />
            <Route path="servizi" element={<AdminServices />} />
            <Route path="parrucchieri" element={<AdminHairdressers />} />
            <Route path="impostazioni" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <InstallPWA />
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
