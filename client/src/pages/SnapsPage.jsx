import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import { Flame, Clock, Eye, AlertTriangle, Send, Sparkles, Check, CheckCheck, RefreshCw } from 'lucide-react';

const SnapsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'sent'
  const [receivedSnaps, setReceivedSnaps] = useState([]);
  const [sentSnaps, setSentSnaps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Viewing Snap
  const [activeSnap, setActiveSnap] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const fetchSnaps = async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        api.get('/snaps/inbox'),
        api.get('/snaps/sent')
      ]);

      if (inboxRes.data.success) setReceivedSnaps(inboxRes.data.data);
      if (sentRes.data.success) setSentSnaps(sentRes.data.data);
    } catch (err) {
      console.error('Failed to load snaps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnaps();
  }, []);

  // Open Snap
  const openSnap = async (snapItem) => {
    try {
      const res = await api.post(`/snaps/${snapItem.id}/open`);
      if (res.data.success) {
        const snapData = res.data.data;
        setActiveSnap(snapData);
        setTimeLeft(snapData.duration || 5);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Snap cannot be viewed.');
      fetchSnaps();
    }
  };

  // Countdown timer for active snap
  useEffect(() => {
    if (!activeSnap) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setActiveSnap(null);
          fetchSnaps();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Screenshot / Blur Detection Event
    const handleVisibilityChange = () => {
      if (document.hidden && activeSnap) {
        api.post(`/snaps/${activeSnap.id}/screenshot`).catch(() => {});
      }
    };

    window.addEventListener('blur', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('blur', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSnap]);

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      {/* Top Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-batchit-pink/15 text-batchit-pink flex items-center justify-center font-bold shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Snaps</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-batchit-pink/20 text-batchit-pink font-mono">
                {receivedSnaps.filter((s) => s.status !== 'OPENED').length} Unopened
              </span>
            </h1>
            <p className="text-[11px] text-batchit-textSecondary">Ephemeral moments that disappear</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/camera')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-transform"
          >
            Take Snap
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-3 border-b border-batchit-border/40">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'inbox' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>Inbox ({receivedSnaps.length})</span>
          {activeTab === 'inbox' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-batchit-pink rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'sent' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>Sent Snaps ({sentSnaps.length})</span>
          {activeTab === 'sent' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-batchit-pink rounded-full" />
          )}
        </button>
      </div>

      {/* Snap List */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-18 bg-batchit-card rounded-2xl animate-pulse" />
              ))}
          </div>
        ) : activeTab === 'inbox' ? (
          receivedSnaps.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No Snaps Yet"
              description="Your inbox is empty. Capture a quick moment and send a snap to your friends!"
              actionText="Open Camera"
              onAction={() => navigate('/camera')}
            />
          ) : (
            <div className="space-y-3">
              {receivedSnaps.map((snap) => {
                const isOpened = snap.status === 'OPENED';

                return (
                  <div
                    key={snap.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      isOpened
                        ? 'bg-batchit-secondary/60 border-batchit-border/60 opacity-60'
                        : 'bg-batchit-card border-batchit-border hover:border-batchit-pink/50 shadow-md shadow-pink-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-pink flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                        {snap.sender?.avatar ? (
                          <img src={snap.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          snap.sender?.displayName?.[0] || 'U'
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{snap.sender?.displayName}</h4>
                          <span className="text-[11px] text-batchit-textSecondary">@{snap.sender?.username}</span>
                        </div>
                        <p className="text-xs text-batchit-textSecondary mt-0.5 flex items-center gap-2">
                          <span>{snap.mediaType === 'video' ? '🎬 Video Snap' : '📸 Photo Snap'}</span>
                          <span>•</span>
                          <span>{snap.duration}s timer</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-batchit-textMuted">
                            {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {isOpened ? (
                        <div className="flex items-center gap-1.5 text-xs text-batchit-textMuted font-semibold px-3 py-1.5 rounded-xl bg-batchit-card">
                          <Eye className="w-4 h-4" />
                          <span>Opened</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openSnap(snap)}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-batchit-pink to-batchit-purple text-white font-bold text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Flame className="w-4 h-4" />
                          <span>View Snap</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Sent Snaps Tab */
          sentSnaps.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No Sent Snaps"
              description="Snaps you deliver to friends will display their delivery and opened status here."
              actionText="Send First Snap"
              onAction={() => navigate('/camera')}
            />
          ) : (
            <div className="space-y-3">
              {sentSnaps.map((snap) => (
                <div
                  key={snap._id}
                  className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-batchit-secondary border border-batchit-border flex items-center justify-center font-bold text-white">
                      {snap.mediaType === 'video' ? '🎬' : '📸'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Sent to {snap.recipients?.length} friend{snap.recipients?.length > 1 ? 's' : ''}
                      </h4>
                      <p className="text-[11px] text-batchit-textSecondary mt-0.5">
                        {new Date(snap.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {snap.recipients?.map((r, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          r.status === 'OPENED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {r.recipient?.username}: {r.status}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* ============================================================== */}
      {/* FULLSCREEN SNAP VIEWER MODAL                                   */}
      {/* ============================================================== */}
      {activeSnap && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none animate-fade-in">
          {/* Top Progress Countdown Bar */}
          <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-xs font-bold text-white">
                {activeSnap.sender?.displayName?.[0] || 'U'}
              </div>
              <span className="text-xs font-bold text-white">{activeSnap.sender?.displayName}</span>
            </div>

            {/* Countdown Badge */}
            <div className="px-3 py-1 rounded-full bg-black/60 border border-white/20 font-mono text-xs font-bold text-batchit-pink flex items-center gap-1.5 shadow-lg">
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Media Viewport */}
          <div className="relative w-full max-w-md h-full flex items-center justify-center overflow-hidden">
            {activeSnap.mediaType === 'video' ? (
              <video
                src={activeSnap.mediaUrl}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeSnap.mediaUrl}
                alt="Snap"
                className="w-full h-full object-cover"
              />
            )}

            {/* Drawing Layer Overlay */}
            {activeSnap.drawingData && (
              <img
                src={activeSnap.drawingData}
                alt="Drawing"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Text Overlay */}
            {activeSnap.textOverlay && (
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-center text-white text-base font-bold shadow-2xl border border-white/10">
                {activeSnap.textOverlay}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnapsPage;
