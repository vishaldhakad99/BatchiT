import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import EmptyState from '../components/common/EmptyState';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Shield } from 'lucide-react';

const CallsPage = () => {
  const { user } = useAuth();
  const { startCall } = useSocket();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calls/history');
      if (res.data.success) {
        setCalls(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      {/* Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold shadow-md">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Calls</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                P2P WebRTC
              </span>
            </h1>
            <p className="text-[11px] text-batchit-textSecondary">Real-time encrypted audio & video logs</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-16 bg-batchit-card rounded-2xl animate-pulse" />
              ))}
          </div>
        ) : calls.length === 0 ? (
          <EmptyState
            icon={Phone}
            title="No Call History"
            description="Your audio and video call history with friends will show up here."
          />
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const isCaller = (call.caller?._id || call.caller?.id || call.caller) === user?.id;
              const peer = isCaller ? call.recipient : call.caller;
              const isMissed = call.status === 'missed';

              return (
                <div
                  key={call._id}
                  className="p-4 rounded-2xl bg-batchit-card border border-batchit-border hover:border-batchit-borderLight flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-pink flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                      {peer?.avatar ? (
                        <img src={peer.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        peer?.displayName?.[0] || 'U'
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{peer?.displayName || 'Private Contact'}</h4>
                        <span className="text-[11px] text-batchit-textSecondary">@{peer?.username}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        {isMissed ? (
                          <span className="flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                            <PhoneMissed className="w-3.5 h-3.5" />
                            <span>Missed</span>
                          </span>
                        ) : isCaller ? (
                          <span className="flex items-center gap-1 text-batchit-textSecondary text-[11px]">
                            <PhoneOutgoing className="w-3.5 h-3.5 text-batchit-purple" />
                            <span>Outgoing • {formatDuration(call.duration)}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                            <PhoneIncoming className="w-3.5 h-3.5" />
                            <span>Incoming • {formatDuration(call.duration)}</span>
                          </span>
                        )}

                        <span className="text-white/20">•</span>
                        <span className="text-[10px] text-batchit-textMuted font-mono">
                          {new Date(call.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {peer && (
                      <>
                        <button
                          onClick={() => startCall(peer, 'audio')}
                          className="w-9 h-9 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-emerald-400 flex items-center justify-center transition-all"
                          title="Call back (Audio)"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startCall(peer, 'video')}
                          className="w-9 h-9 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-batchit-pink flex items-center justify-center transition-all"
                          title="Call back (Video)"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsPage;
