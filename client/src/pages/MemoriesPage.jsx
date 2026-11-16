import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import { Bookmark, Lock, Unlock, KeyRound, Image as ImageIcon, Trash2, Plus, X } from 'lucide-react';

const MemoriesPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('memories'); // 'memories' | 'vault'
  const [memories, setMemories] = useState([]);
  const [vaultMemories, setVaultMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vault PIN state
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showSetupPin, setShowSetupPin] = useState(!user?.vaultPinSet);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/memories');
      if (res.data.success) {
        setMemories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // Unlock Vault with PIN
  const handleUnlockVault = async (e) => {
    e?.preventDefault();
    if (pinInput.length !== 4) return;
    setPinError('');

    try {
      const res = await api.post('/memories/vault', { pin: pinInput });
      if (res.data.success) {
        setVaultMemories(res.data.data);
        setIsVaultUnlocked(true);
        setPinInput('');
      }
    } catch (err) {
      setPinError(err.response?.data?.message || 'Incorrect PIN.');
      setPinInput('');
    }
  };

  // Set new Vault PIN
  const handleSetPin = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) return;
    try {
      const res = await api.post('/users/vault/pin', { pin: pinInput });
      if (res.data.success) {
        alert('Vault PIN set successfully!');
        setShowSetupPin(false);
        setIsVaultUnlocked(true);
        setPinInput('');
        // Fetch vault media
        const vaultRes = await api.post('/memories/vault', { pin: pinInput });
        if (vaultRes.data.success) setVaultMemories(vaultRes.data.data);
      }
    } catch (err) {
      setPinError(err.response?.data?.message || 'Could not configure PIN.');
    }
  };

  // Delete memory
  const handleDeleteMemory = async (memoryId, isVault = false) => {
    if (!window.confirm('Delete this item from your memory archive?')) return;
    try {
      await api.delete(`/memories/${memoryId}`);
      if (isVault) {
        setVaultMemories((prev) => prev.filter((m) => m._id !== memoryId));
      } else {
        setMemories((prev) => prev.filter((m) => m._id !== memoryId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold shadow-md">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Memories & Vault</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
                Encrypted Storage
              </span>
            </h1>
            <p className="text-[11px] text-batchit-textSecondary">Your personal saved snaps and private album</p>
          </div>
        </div>

        {activeTab === 'vault' && isVaultUnlocked && (
          <button
            onClick={() => {
              setIsVaultUnlocked(false);
              setVaultMemories([]);
            }}
            className="px-3 py-1.5 rounded-xl bg-batchit-card hover:bg-batchit-border border border-batchit-border text-xs font-semibold text-batchit-textSecondary flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 pt-3 flex gap-4 border-b border-batchit-border/40 max-w-4xl mx-auto w-full">
        <button
          onClick={() => setActiveTab('memories')}
          className={`pb-3 text-xs font-bold relative transition-colors ${
            activeTab === 'memories' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>Memories ({memories.length})</span>
          {activeTab === 'memories' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-cyan-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`pb-3 text-xs font-bold relative transition-colors flex items-center gap-1.5 ${
            activeTab === 'vault' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Private Vault {isVaultUnlocked && `(${vaultMemories.length})`}</span>
          {activeTab === 'vault' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-cyan-400 to-batchit-purple rounded-full" />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {activeTab === 'memories' ? (
          /* Regular Memories Grid */
          loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="h-48 bg-batchit-card rounded-2xl animate-pulse" />
                ))}
            </div>
          ) : memories.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No Memories Saved"
              description="Save your favourite snaps from the camera studio to build your personal memory book."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {memories.map((m) => (
                <div
                  key={m._id}
                  className="relative h-60 rounded-3xl overflow-hidden group border border-batchit-border shadow-lg"
                >
                  {m.mediaType === 'video' ? (
                    <video src={m.mediaUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.mediaUrl} alt="Memory" className="w-full h-full object-cover" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDeleteMemory(m._id, false)}
                        className="p-1.5 rounded-full bg-black/60 text-white hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      {m.title && <p className="text-xs font-bold text-white truncate">{m.title}</p>}
                      <p className="text-[10px] text-white/70">
                        {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Private Vault Tab (PIN Guarded) */
          !isVaultUnlocked ? (
            <div className="max-w-xs mx-auto py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold mb-4 shadow-xl border border-cyan-500/30">
                <Lock className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                {showSetupPin ? 'Set Up Private Vault PIN' : 'Enter 4-Digit Vault PIN'}
              </h3>
              <p className="text-xs text-batchit-textSecondary mb-6 leading-relaxed">
                {showSetupPin
                  ? 'Choose a 4-digit PIN to secure your sensitive personal photos and videos.'
                  : 'Private Vault media is isolated with server-authorized PIN verification.'}
              </p>

              {pinError && (
                <div className="mb-4 text-xs text-rose-400 font-semibold">{pinError}</div>
              )}

              <form onSubmit={showSetupPin ? handleSetPin : handleUnlockVault} className="w-full space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-full h-14 bg-batchit-card border border-batchit-border rounded-2xl text-center text-3xl font-mono tracking-widest text-white focus:outline-none focus:border-cyan-400"
                />

                <button
                  type="submit"
                  disabled={pinInput.length !== 4}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-batchit-purple text-white font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-40"
                >
                  {showSetupPin ? 'Create PIN' : 'Unlock Vault'}
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Vault Grid */
            vaultMemories.length === 0 ? (
              <EmptyState
                icon={Lock}
                title="Vault is Empty"
                description="Save confidential media directly into your vault from the Camera Studio."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {vaultMemories.map((m) => (
                  <div
                    key={m._id}
                    className="relative h-60 rounded-3xl overflow-hidden group border border-cyan-500/30 shadow-lg"
                  >
                    {m.mediaType === 'video' ? (
                      <video src={m.mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.mediaUrl} alt="Vault Media" className="w-full h-full object-cover" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeleteMemory(m._id, true)}
                          className="p-1.5 rounded-full bg-black/60 text-white hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        {m.title && <p className="text-xs font-bold text-white truncate">{m.title}</p>}
                        <p className="text-[10px] text-white/70">
                          {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
};

export default MemoriesPage;
