import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import { getApiBaseUrl, setCustomServerUrl } from '../services/api';
import ServerConfigModal from '../components/common/ServerConfigModal';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Server,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

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
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'connected' | 'unreachable'
  const [showServerModal, setShowServerModal] = useState(false);

  // Check backend server connection
  const checkServerHealth = async () => {
    setServerStatus('checking');
    try {
      const baseUrl = getApiBaseUrl();
      const res = await axios.get(`${baseUrl}/auth/me`, { timeout: 4000 });
      setServerStatus('connected');
    } catch (err) {
      // 401 means server is active and reachable (just unauthenticated)
      if (err.response && (err.response.status === 401 || err.response.status === 200)) {
        setServerStatus('connected');
      } else {
        setServerStatus('unreachable');
      }
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, [currentServerUrl]);

  const handleConfigureServer = () => {
    setShowServerModal(true);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const isMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isPasswordValid = isMinLength && hasUppercase && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, underscores and dots.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please meet all password requirements: 8+ chars, 1 uppercase & 1 number.');
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
          `Cannot reach server at ${currentServerUrl}. Please make sure phone and laptop are on the SAME Wi-Fi or Mobile Hotspot.`
        );
      } else {
        setError(err.response?.data?.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-batchit-bg text-batchit-textPrimary flex flex-col items-center justify-start sm:justify-center px-4 pt-6 pb-12 sm:py-10 relative overflow-y-auto smooth-scroll selection:bg-batchit-purple selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-batchit-purple/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-batchit-pink/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 my-auto py-2">
        <div className="flex justify-center mb-4">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo size="md" />
          </Link>
        </div>

        {/* Server Status Pill */}
        <div className="flex justify-center mb-3.5">
          <button
            type="button"
            onClick={handleConfigureServer}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-all active:scale-95 ${
              serverStatus === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : serverStatus === 'checking'
                ? 'bg-batchit-card border-batchit-border text-batchit-textSecondary'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 animate-pulse'
            }`}
          >
            {serverStatus === 'connected' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : serverStatus === 'checking' ? (
              <RefreshCw className="w-3 h-3 animate-spin text-batchit-purple" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-400" />
            )}
            <span>
              {serverStatus === 'connected'
                ? `Server Online (${currentServerUrl.replace(/^https?:\/\//, '')})`
                : serverStatus === 'checking'
                ? 'Connecting to Server...'
                : `Server Offline (Tap to Change IP)`}
            </span>
          </button>
        </div>

        <div className="bg-batchit-card border border-batchit-border rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-white">Create BatchiT Account</h2>
            <p className="text-xs sm:text-sm text-batchit-textSecondary mt-0.5">
              Your moments, your people, your privacy.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. raven_01"
                  required
                  autoCapitalize="none"
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl pl-10 pr-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="e.g. Raven Vance"
                  required
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl pl-10 pr-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="raven@domain.com"
                  required
                  autoCapitalize="none"
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl pl-10 pr-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters, 1 uppercase & 1 number"
                  required
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl pl-10 pr-12 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-batchit-textSecondary hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Requirements Checklist */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px]">
                <div
                  className={`flex items-center gap-1 transition-colors ${
                    isMinLength ? 'text-emerald-400 font-bold' : 'text-batchit-textMuted'
                  }`}
                >
                  <span>{isMinLength ? '✓' : '○'}</span>
                  <span>8+ Chars</span>
                </div>
                <div
                  className={`flex items-center gap-1 transition-colors ${
                    hasUppercase ? 'text-emerald-400 font-bold' : 'text-batchit-textMuted'
                  }`}
                >
                  <span>{hasUppercase ? '✓' : '○'}</span>
                  <span>Uppercase</span>
                </div>
                <div
                  className={`flex items-center gap-1 transition-colors ${
                    hasNumber ? 'text-emerald-400 font-bold' : 'text-batchit-textMuted'
                  }`}
                >
                  <span>{hasNumber ? '✓' : '○'}</span>
                  <span>1 Number</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-batchit-textSecondary pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>E2EE private keys generated locally on your device.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-batchit-purple via-batchit-blue to-batchit-pink text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 mt-3"
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

          <div className="mt-5 pt-4 border-t border-batchit-border/60 text-center space-y-2">
            <p className="text-xs text-batchit-textSecondary">
              Already have an account?{' '}
              <Link to="/login" className="text-batchit-purple font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Server Config Modal */}
      <ServerConfigModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        currentUrl={currentServerUrl}
        onServerUpdated={(newUrl) => {
          setCurrentServerUrl(newUrl);
          checkServerHealth();
        }}
      />
    </div>
  );
};

export default RegisterPage;
