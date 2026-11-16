import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/common/Logo';
import {
  Shield,
  Zap,
  Camera,
  Lock,
  Phone,
  Flame,
  KeyRound,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-batchit-bg text-batchit-textPrimary flex flex-col selection:bg-batchit-purple selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-batchit-border/70 backdrop-blur-xl bg-batchit-bg/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="lg" />

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl border border-batchit-border text-white text-sm font-semibold hover:bg-batchit-card transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-batchit-purple to-batchit-blue text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden flex flex-col items-center text-center">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-batchit-purple/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-batchit-pink/15 rounded-full blur-[128px] pointer-events-none" />

        <div className="max-w-4xl mx-auto z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-batchit-card border border-batchit-border text-xs font-semibold text-batchit-purpleLight mb-8 shadow-inner">
            <Sparkles className="w-4 h-4 text-batchit-pink" />
            <span>Next-Gen Private Social Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Your Moments. <br className="hidden sm:inline" />
            Your People.{' '}
            <span className="bg-gradient-to-r from-batchit-purple via-batchit-blue to-batchit-pink bg-clip-text text-transparent">
              Your Privacy.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-batchit-textSecondary max-w-2xl mb-10 leading-relaxed font-normal">
            BatchiT fuses ephemeral camera snaps, real-time WebRTC audio & video calling, and client-side end-to-end encryption into a sleek, private sanctuary for genuine friends.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-base shadow-xl shadow-purple-500/30 hover:opacity-95 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-batchit-card hover:bg-batchit-cardHover border border-batchit-border text-white font-bold text-base transition-all flex items-center justify-center gap-2"
            >
              <span>Open BatchiT Web</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-xs text-batchit-textSecondary font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Plaintext Key Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ephemeral 24h Snaps</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>P2P WebRTC HD Calling</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Engineered For Pure Intimacy & Privacy
          </h2>
          <p className="text-sm sm:text-base text-batchit-textSecondary max-w-xl mx-auto">
            No public algorithms. No data brokers. No endless doom-scrolling. Only your closest circle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Snaps */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-batchit-purple/15 text-batchit-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ephemeral Camera Snaps</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Capture quick moments with live device camera, custom filters, drawing tools, and customizable view-once or 1–10 second timers that disappear after viewing.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-batchit-purple font-semibold flex items-center gap-1">
              <span>View-once & replay alerts</span>
            </div>
          </div>

          {/* Feature 2: E2EE Messaging */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Direct chats employ audited W3C Web Crypto ECDH and AES-GCM 256-bit encryption. Keys never touch our servers in plaintext.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <span>Zero-knowledge server model</span>
            </div>
          </div>

          {/* Feature 3: WebRTC Calling */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">P2P Audio & Video Calls</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Real-time WebRTC audio and video calling with STUN/TURN traversal, camera toggling, mic mute, picture-in-picture, and call logging.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Direct peer-to-peer media</span>
            </div>
          </div>

          {/* Feature 4: Streaks */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Daily Snap Streaks</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Exchange snaps with your closest friends within 24-hour windows to build and preserve dynamic fire streaks powered by server-side verification.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-amber-400 font-semibold flex items-center gap-1">
              <span>Milestones & expiration timers</span>
            </div>
          </div>

          {/* Feature 5: 24h Stories */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-pink-500/15 text-pink-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">24-Hour Stories</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Share daily highlights with segmented progress bars, viewer metrics, emoji reactions, and Close Friends privacy controls.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-pink-400 font-semibold flex items-center gap-1">
              <span>Automatic 24-hour cleanup</span>
            </div>
          </div>

          {/* Feature 6: Private Vault */}
          <div className="p-8 rounded-3xl bg-batchit-card border border-batchit-border hover:border-batchit-purple/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Private Vault & PIN</h3>
              <p className="text-sm text-batchit-textSecondary leading-relaxed">
                Store personal media memories in a separate, encrypted vault secured by a separate 4-digit PIN with server-authorized tokens.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-batchit-border/40 text-xs text-cyan-400 font-semibold flex items-center gap-1">
              <span>Isolated PIN authorization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Manifesto */}
      <section className="py-20 px-6 bg-batchit-secondary border-y border-batchit-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>Zero-Compromise Security Architecture</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">Your data stays yours. Period.</h2>
            <p className="text-sm text-batchit-textSecondary leading-relaxed">
              BatchiT implements HTTP-only security cookies, short-lived JWT access tokens with rotating refresh tokens, rate limiting, MongoDB injection protection, and MIME type verification.
            </p>
            <ul className="space-y-3 pt-2 text-sm text-batchit-textSecondary">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-batchit-purple" />
                <span>Audited password hashing using bcrypt with 12 salt rounds</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-batchit-purple" />
                <span>Active session revocation and logged-in device auditing</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-batchit-purple" />
                <span>Client-side key derivation via Web Crypto API</span>
              </li>
            </ul>
          </div>

          <div className="flex-1 p-8 rounded-3xl bg-batchit-card border border-batchit-border w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-batchit-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-batchit-purple/20 text-batchit-purple flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Security Checklist</h4>
                  <p className="text-[11px] text-batchit-textSecondary">Production Certified</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                100% SECURE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-batchit-border/40 text-batchit-textSecondary">
                <span>Encryption Standard</span>
                <span className="text-white font-mono">ECDH + AES-256-GCM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-batchit-border/40 text-batchit-textSecondary">
                <span>Signaling Protocol</span>
                <span className="text-white font-mono">Socket.IO WebSockets</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-batchit-border/40 text-batchit-textSecondary">
                <span>Media Traversal</span>
                <span className="text-white font-mono">WebRTC PeerConnection</span>
              </div>
              <div className="flex justify-between py-1.5 text-batchit-textSecondary">
                <span>Persistent Database</span>
                <span className="text-white font-mono">MongoDB Atlas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-batchit-border/60 bg-batchit-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />

          <p className="text-xs text-batchit-textSecondary">
            © {new Date().getFullYear()} BatchiT Inc. Your Moments. Your People. Your Privacy.
          </p>

          <div className="flex items-center gap-6 text-xs text-batchit-textSecondary font-medium">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Sign Up</Link>
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
