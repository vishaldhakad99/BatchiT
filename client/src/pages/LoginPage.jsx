import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
import api, { getApiBaseUrl, setCustomServerUrl } from '../services/api';
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Server } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
      setError(err.response?.data?.message || 'Login failed. Please check your network.');
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
    <div className="min-h-screen bg-batchit-bg text-batchit-textPrimary flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-batchit-purple/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-batchit-pink/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 py-6 sm:py-0">
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-batchit-card border border-batchit-border rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white">Welcome Back</h2>
            <p className="text-xs sm:text-sm text-batchit-textSecondary mt-1">Sign in to your private BatchiT circle</p>
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
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. alex or alex@batchit.app"
                  required
                  className="w-full h-12 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
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
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 pr-12 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple focus:ring-1 focus:ring-batchit-purple transition-all"
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
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 mt-2"
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

          <div className="mt-6 pt-5 border-t border-batchit-border/60 text-center space-y-3">
            <p className="text-xs text-batchit-textSecondary">
              Don't have an account?{' '}
              <Link to="/register" className="text-batchit-purple font-bold hover:underline">
                Sign Up
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
    </div>
  );
};

export default LoginPage;
