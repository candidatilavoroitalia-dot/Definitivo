import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';

const AuthPage = ({ login }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [salonName, setSalonName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/settings');
        setSalonName(response.data.salon_name || '');
      } catch (error) {
        console.error('Error fetching settings');
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      await login(response.data.access_token, response.data.user);
      
      if (response.data.user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bone flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-playfair text-brand-charcoal mb-2" data-testid="auth-title">
            {salonName || <span className="bg-gray-200 animate-pulse rounded w-48 h-12 inline-block"></span>}
          </h1>
          <p className="text-base text-muted-foreground">
            {isLogin ? 'Accedi al tuo account' : 'Crea il tuo account'}
          </p>
        </div>

        <Card className="p-8 border-brand-sand/30 shadow-xl" data-testid="auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium tracking-widest uppercase">
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-transparent border-b border-brand-charcoal/20 focus:border-brand-charcoal rounded-none px-0 py-4 text-lg focus:ring-0 placeholder:text-muted-foreground/50 transition-colors"
                  placeholder="Mario Rossi"
                  data-testid="name-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium tracking-widest uppercase">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-transparent border-b border-brand-charcoal/20 focus:border-brand-charcoal rounded-none px-0 py-4 text-lg focus:ring-0 placeholder:text-muted-foreground/50 transition-colors"
                placeholder="mario@example.com"
                data-testid="email-input"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium tracking-widest uppercase">
                  Telefono (con prefisso internazionale)
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required={!isLogin}
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-transparent border-b border-brand-charcoal/20 focus:border-brand-charcoal rounded-none px-0 py-4 text-lg focus:ring-0 placeholder:text-muted-foreground/50 transition-colors"
                  placeholder="+393331234567"
                  data-testid="phone-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium tracking-widest uppercase">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-transparent border-b border-brand-charcoal/20 focus:border-brand-charcoal rounded-none px-0 py-4 text-lg focus:ring-0 placeholder:text-muted-foreground/50 transition-colors"
                placeholder="••••••••"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-charcoal text-white hover:bg-black rounded-none px-8 py-6 text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
              data-testid="submit-button"
            >
              {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-brand-charcoal hover:text-brand-gold font-medium tracking-wide transition-colors"
              data-testid="toggle-auth-mode-button"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-brand-charcoal font-medium tracking-wide transition-colors"
              data-testid="back-home-button"
            >
              Torna alla home
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
