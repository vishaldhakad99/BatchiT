import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import api, { getApiBaseUrl, setCustomServerUrl } from '../services/api';
import ServerConfigModal from '../components/common/ServerConfigModal';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Server,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentServerUrl, setCurrentServerUrl] = useState(() => getApiBaseUrl().replace('/api', ''));
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'connected' | 'unreachable'
  const [showServerModal, setShowServerModal] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Check backend server connection
  const checkServerHealth = async () => {
    setServerStatus('checking');
    try {
      const baseUrl = getApiBaseUrl();
      await axios.get(`${baseUrl}/auth/me`, { timeout: 4000 });
      setServerStatus('connected');
    } catch (err) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide your username/email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await login(identifier.trim(), password);
      if (res.success) {
        navigate('/chat');
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err) {
      if (!err.response) {
        setError(
          `Cannot reach server at ${currentServerUrl}. Please make sure phone and laptop are on the SAME Wi-Fi or Mobile Hotspot.`
        );
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotSuccess('');

    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(res.data.message || 'Instructions sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-batchit-bg text-batchit-textPrimary flex flex-col items-center justify-start sm:justify-center px-4 pt-6 pb-12 sm:py-10 relative overflow-y-auto smooth-scroll selection:bg-batchit-purple selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-batchit-purple/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-batchit-pink/15 rounded-full blur-[100px] pointer-events-none" />

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
            <h2 className="text-xl sm:text-2xl font-black text-white">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-batchit-textSecondary mt-0.5">
              Sign in to your private BatchiT circle
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider mb-1">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. raven_01 or raven@domain.com"
                  required
                  autoCapitalize="none"
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl pl-10 pr-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-batchit-textSecondary uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-batchit-purpleLight hover:underline font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-batchit-purple via-batchit-blue to-batchit-pink text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-40 mt-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-batchit-border/60 text-center">
            <p className="text-xs text-batchit-textSecondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-batchit-purple font-bold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-batchit-textSecondary mb-4">
              Enter your registered email address to receive reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-xl px-3.5 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSuccess('');
                    }}
                    className="flex-1 h-10 rounded-xl bg-batchit-secondary text-batchit-textSecondary hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 h-10 rounded-xl bg-batchit-purple hover:bg-batchit-purpleDark text-white text-xs font-bold"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>
            )}

            {forgotSuccess && (
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess('');
                }}
                className="w-full h-10 mt-3 rounded-xl bg-batchit-secondary text-white text-xs font-semibold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

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

export default LoginPage;
