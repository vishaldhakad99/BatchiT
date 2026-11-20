import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Logo from '../components/common/Logo';
import CallModal from '../components/calling/CallModal';
import api from '../services/api';
import {
  MessageSquare,
  Camera,
  Flame,
  Users,
  Compass,
  Phone,
  Bookmark,
  Settings,
  LogOut,
  Bell,
  Plus
} from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setUnreadNotifications(res.data.data.unreadCount || 0);
        }
      } catch (err) {}
    };
    fetchNotificationsCount();
  }, [location.pathname]);

  const navLinks = [
    { to: '/chat', label: 'Chats', icon: MessageSquare },
    { to: '/snaps', label: 'Snaps', icon: Flame },
    { to: '/camera', label: 'Camera', icon: Camera, highlight: true },
    { to: '/stories', label: 'Stories', icon: Compass },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/calls', label: 'Calls', icon: Phone },
    { to: '/memories', label: 'Vault', icon: Bookmark },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  // Check if current route should hide mobile bottom bar (e.g. Camera studio, active chat thread)
  const hideMobileNav =
    location.pathname.startsWith('/camera') ||
    (location.pathname.startsWith('/chat/') && location.pathname !== '/chat');

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-batchit-bg text-batchit-textPrimary">
      {/* Global Real-time WebRTC Calling Overlay */}
      <CallModal />

      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION                                     */}
      {/* ============================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-batchit-secondary border-r border-batchit-border shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-batchit-border/60">
          <NavLink to="/chat">
            <Logo size="md" />
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-batchit-purple/20 to-batchit-blue/15 text-white border border-batchit-purple/30 shadow-sm'
                    : 'text-batchit-textSecondary hover:text-white hover:bg-batchit-card'
                } ${item.highlight ? 'text-batchit-purple font-bold' : ''}`}
              >
                <div
                  className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-batchit-purple text-white shadow-md shadow-purple-500/20'
                      : item.highlight
                      ? 'bg-batchit-purple/20 text-batchit-purple'
                      : 'bg-batchit-card text-batchit-textSecondary group-hover:text-white group-hover:bg-batchit-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
                {item.to === '/snaps' && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-batchit-pink/20 text-batchit-pink font-bold">
                    ⚡
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card Profile & Logout */}
        <div className="p-4 border-t border-batchit-border/80 bg-batchit-secondary/90">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-batchit-card border border-batchit-border">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-batchit-purple to-batchit-blue flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.[0] || 'U'
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-batchit-card" />
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
                <p className="text-[11px] text-batchit-textSecondary truncate">@{user?.username}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-batchit-textSecondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT WORKSPACE                                         */}
      {/* ============================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Outlet />

        {/* ============================================================ */}
        {/* MOBILE BOTTOM NAVIGATION                                     */}
        {/* ============================================================ */}
        {!hideMobileNav && (
          <nav className="md:hidden flex items-center justify-around h-16 bg-batchit-card/95 backdrop-blur-xl border-t border-batchit-border shrink-0 px-2 z-40 pb-safe">
            {[
              { to: '/chat', icon: MessageSquare, label: 'Chat' },
              { to: '/snaps', icon: Flame, label: 'Snaps' },
              { to: '/camera', icon: Camera, label: 'Camera', center: true },
              { to: '/stories', icon: Compass, label: 'Stories' },
              { to: '/friends', icon: Users, label: 'Friends' },
              { to: '/settings', icon: Settings, label: 'Settings' }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              if (item.center) {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="relative -top-4 w-12 h-12 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-pink text-white flex items-center justify-center shadow-lg shadow-purple-500/40 border-2 border-batchit-card active:scale-95 transition-transform"
                  >
                    <Icon className="w-6 h-6" />
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center py-1 flex-1 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-batchit-purple font-bold' : 'text-batchit-textSecondary hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )}
      </main>
    </div>
  );
};

export default AppLayout;
