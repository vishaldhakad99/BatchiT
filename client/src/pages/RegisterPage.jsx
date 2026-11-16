import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import { getApiBaseUrl, setCustomServerUrl } from '../services/api';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Server } from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState(() => getApiBaseUrl().replace('/api', ''));

  const handleConfigureServer = () => {
    const entered = window.prompt(
      'Enter your Laptop/PC Server IP (e.g. 10.98.125.78:5000 or 192.168.43.1:5000):',
      currentServerUrl
    );
    if (entered !== null && entered.trim()) {
      setCustomServerUrl(entered.trim());
      const updated = getApiBaseUrl().replace('/api', '');
      setCurrentServerUrl(updated);
      alert(`Server IP configured to: ${updated}`);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side quick checks
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, underscores and dots.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError('Password must include at least one uppercase letter (A-Z) and one number (0-9).');
      return;
    }

    setLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        navigate('/chat');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      if (!err.response) {
        setError(
          `Cannot reach server at ${currentServerUrl}. Please make sure your Phone and Laptop are connected to the SAME Wi-Fi or Mobile Hotspot, or tap "(Change IP)" below.`
        );
      } else {
        setError(err.response?.data?.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-batchit-bg text-batchit-textPrimary flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-batchit-purple/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-batchit-pink/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 py-6 sm:py-0">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-batchit-card border border-batchit-border rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Create BatchiT Account</h2>
            <p className="text-xs sm:text-sm text-batchit-textSecondary mt-1">
              Your moments, your people, your privacy.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. raven_01"
                required
                className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g. Raven Vance"
                required
                className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="raven@domain.com"
                required
                className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters, 1 uppercase & 1 number"
                  required
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 pr-12 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-batchit-textSecondary hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-batchit-textSecondary pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>E2EE ECDH keys are created locally in your browser.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-batchit-border/60 text-center space-y-3">
            <p className="text-xs text-batchit-textSecondary">
              Already have an account?{' '}
              <Link to="/login" className="text-batchit-purple font-bold hover:underline">
                Sign In
              </Link>
            </p>

            <button
              type="button"
              onClick={handleConfigureServer}
              className="text-[11px] text-batchit-textMuted hover:text-batchit-purple flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-full bg-batchit-secondary border border-batchit-border/60 transition-all"
            >
              <Server className="w-3 h-3 text-batchit-purple" />
              <span>Server: {currentServerUrl}</span>
              <span className="text-batchit-purple font-semibold ml-0.5">(Change)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
