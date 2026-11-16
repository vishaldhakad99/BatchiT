import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Settings,
  User,
  Shield,
  Key,
  Smartphone,
  Palette,
  Bell,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  LogOut
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('account'); // 'account' | 'privacy' | 'security' | 'appearance'

  // Profile Form
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Privacy Settings
  const [isPrivateAccount, setIsPrivateAccount] = useState(user?.isPrivateAccount || false);
  const [onlineStatusVisible, setOnlineStatusVisible] = useState(user?.onlineStatusVisible ?? true);
  const [lastSeenVisible, setLastSeenVisible] = useState(user?.lastSeenVisible ?? true);
  const [messagePrivacy, setMessagePrivacy] = useState(user?.messagePrivacy || 'friends');
  const [storyPrivacy, setStoryPrivacy] = useState(user?.storyPrivacy || 'friends');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  // Active Sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (activeSection === 'security') {
      fetchSessions();
    }
  }, [activeSection]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/devices');
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({ displayName, bio, avatar });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePrivacyToggle = async (key, val) => {
    try {
      await updateProfile({ [key]: val });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    try {
      const res = await api.post('/auth/change-password', { currentPassword, newPassword });
      if (res.data.success) {
        setPasswordMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setPasswordMsg(err.response?.data?.message || 'Failed to update password.');
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await api.delete(`/devices/${sessionId}`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("Type 'DELETE' to permanently delete your account and all associated data:");
    if (confirmation === 'DELETE') {
      try {
        await api.delete('/auth/account');
        logout();
      } catch (err) {
        alert('Could not delete account.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-batchit-purple/15 text-batchit-purple flex items-center justify-center font-bold shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Settings</h1>
            <p className="text-[11px] text-batchit-textSecondary">Account, Privacy, Security & Preferences</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-6 border-b border-batchit-border/40">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'security', label: 'Security & Devices', icon: Smartphone },
            { id: 'appearance', label: 'Appearance', icon: Palette }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-batchit-purple text-white shadow-md shadow-purple-500/20'
                    : 'bg-batchit-card text-batchit-textSecondary hover:text-white border border-batchit-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: ACCOUNT SETTINGS                                   */}
        {/* ============================================================== */}
        {activeSection === 'account' && (
          <div className="py-6 space-y-8 animate-fade-in max-w-xl">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Profile Information</h3>

              <div>
                <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 bg-batchit-card border border-batchit-border rounded-xl px-4 text-xs text-white focus:outline-none focus:border-batchit-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">
                  Username (Permanent ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.username || ''}
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-xl px-4 text-xs text-batchit-textMuted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio..."
                  className="w-full bg-batchit-card border border-batchit-border rounded-xl p-3 text-xs text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="px-6 py-2.5 rounded-xl bg-batchit-purple hover:bg-batchit-purpleDark text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-4 pt-6 border-t border-batchit-border">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Change Password</h3>

              {passwordMsg && (
                <div className="p-3 rounded-xl bg-batchit-card border border-batchit-purple text-xs text-batchit-purple">
                  {passwordMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full h-11 bg-batchit-card border border-batchit-border rounded-xl px-4 text-xs text-white focus:outline-none focus:border-batchit-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min. 8 chars, 1 uppercase & 1 number"
                  className="w-full h-11 bg-batchit-card border border-batchit-border rounded-xl px-4 text-xs text-white focus:outline-none focus:border-batchit-purple"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-batchit-card hover:bg-batchit-border border border-batchit-border text-white font-bold text-xs transition-all"
              >
                Update Password
              </button>
            </form>

            {/* Delete Account */}
            <div className="pt-6 border-t border-batchit-border/80">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2">Danger Zone</h3>
              <p className="text-xs text-batchit-textSecondary mb-4">
                Permanently delete your BatchiT account and erase all associated messages, snaps, and memories.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: PRIVACY SETTINGS                                   */}
        {/* ============================================================== */}
        {activeSection === 'privacy' && (
          <div className="py-6 space-y-6 animate-fade-in max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Privacy Controls</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Private Profile</h4>
                  <p className="text-[11px] text-batchit-textSecondary mt-0.5">
                    Only accepted friends can see your full bio and activity
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivateAccount}
                  onChange={(e) => {
                    setIsPrivateAccount(e.target.checked);
                    handlePrivacyToggle('isPrivateAccount', e.target.checked);
                  }}
                  className="w-4 h-4 accent-batchit-purple"
                />
              </div>

              <div className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Online Presence</h4>
                  <p className="text-[11px] text-batchit-textSecondary mt-0.5">
                    Allow friends to see when you are active on BatchiT
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={onlineStatusVisible}
                  onChange={(e) => {
                    setOnlineStatusVisible(e.target.checked);
                    handlePrivacyToggle('onlineStatusVisible', e.target.checked);
                  }}
                  className="w-4 h-4 accent-batchit-purple"
                />
              </div>

              <div className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Last Seen Timestamp</h4>
                  <p className="text-[11px] text-batchit-textSecondary mt-0.5">
                    Show the time you were last connected
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={lastSeenVisible}
                  onChange={(e) => {
                    setLastSeenVisible(e.target.checked);
                    handlePrivacyToggle('lastSeenVisible', e.target.checked);
                  }}
                  className="w-4 h-4 accent-batchit-purple"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: SECURITY & SESSIONS                                */}
        {/* ============================================================== */}
        {activeSection === 'security' && (
          <div className="py-6 space-y-6 animate-fade-in max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Logged In Devices & Sessions</h3>

            {loadingSessions ? (
              <div className="space-y-3">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-16 bg-batchit-card rounded-2xl animate-pulse" />
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((sess) => (
                  <div
                    key={sess.sessionId}
                    className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-batchit-purple/15 text-batchit-purple flex items-center justify-center">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">
                            {sess.device?.deviceName || 'Web Browser'}
                          </h4>
                          {sess.isCurrent && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-batchit-textSecondary mt-0.5">
                          IP: {sess.ipAddress || 'Protected'} • Active:{' '}
                          {new Date(sess.lastActive).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: APPEARANCE                                         */}
        {/* ============================================================== */}
        {activeSection === 'appearance' && (
          <div className="py-6 space-y-6 animate-fade-in max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Appearance & Theme</h3>

            <div className="p-4 rounded-2xl bg-batchit-card border border-batchit-border space-y-4">
              <h4 className="text-xs font-bold text-white">Premium Dark System</h4>
              <p className="text-xs text-batchit-textSecondary">
                BatchiT is crafted with a high-contrast dark aesthetic (#09090F) to optimize battery life and reduce eye strain during nighttime communication.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-batchit-bg border-2 border-batchit-purple flex items-center justify-center text-xs text-white">
                  ✓
                </div>
                <span className="text-xs font-bold text-white">Dark Aesthetic (Active)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
