import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
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
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
            element={user && !user.is_admin ? <BookingPage user={user} logout={logout} /> : <Navigate to={user?.is_admin ? "/admin" : "/auth"} />}
          />
          <Route
            path="/admin"
            element={user && user.is_admin ? <AdminDashboard user={user} logout={logout} /> : <Navigate to={user ? "/dashboard" : "/auth"} />}
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
