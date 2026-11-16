import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';
import {
  Users,
  Search,
  UserPlus,
  QrCode,
  Flame,
  MessageSquare,
  Phone,
  Video,
  Check,
  X,
  Clock,
  Sparkles,
  Shield,
  Trash2
} from 'lucide-react';

const FriendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onlineUsers, startCall } = useSocket();

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'suggestions'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchFriendsData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, suggestionsRes] = await Promise.all([
        api.get('/friends/list'),
        api.get('/friends/requests'),
        api.get('/friends/suggestions')
      ]);

      if (friendsRes.data.success) setFriends(friendsRes.data.data);
      if (requestsRes.data.success) setRequests(requestsRes.data.data);
      if (suggestionsRes.data.success) setSuggestions(suggestionsRes.data.data);
    } catch (err) {
      console.error('Failed to load friends data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsData();
  }, []);

  // Search users live
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Send friend request
  const handleSendRequest = async (recipientId) => {
    try {
      const res = await api.post('/friends/request', { recipientId });
      if (res.data.success) {
        alert('Friend request sent!');
        fetchFriendsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send friend request.');
    }
  };

  // Accept request
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.post(`/friends/request/${requestId}/accept`);
      if (res.data.success) {
        fetchFriendsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reject request
  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/friends/request/${requestId}/reject`);
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel outgoing request
  const handleCancelRequest = async (requestId) => {
    try {
      await api.delete(`/friends/request/${requestId}/cancel`);
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Remove this friend from your circle?')) return;
    try {
      await api.delete(`/friends/${friendId}`);
      fetchFriendsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Open direct chat
  const handleOpenChat = async (friendId) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId: friendId });
      if (res.data.success) {
        navigate(`/chat/${res.data.data._id || res.data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      {/* Top Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-batchit-blue/15 text-batchit-blue flex items-center justify-center font-bold shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>Friends Circle</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-batchit-blue/20 text-batchit-blue font-mono">
                {friends.length} Friends
              </span>
            </h1>
            <p className="text-[11px] text-batchit-textSecondary">Manage your trusted connections</p>
          </div>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="px-3.5 py-2 rounded-xl bg-batchit-card hover:bg-batchit-border border border-batchit-border text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
        >
          <QrCode className="w-4 h-4 text-batchit-purple" />
          <span>My QR Code</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 border-b border-batchit-border/40 max-w-4xl mx-auto w-full">
        <div className="relative">
          <Search className="w-4 h-4 text-batchit-textMuted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or display name..."
            className="w-full h-11 bg-batchit-card border border-batchit-border rounded-2xl pl-11 pr-4 text-xs text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple transition-all"
          />
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 p-2 bg-batchit-card border border-batchit-border rounded-2xl shadow-xl space-y-1.5 animate-fade-in">
            {searchResults.map((usr) => (
              <div
                key={usr._id}
                className="p-2.5 rounded-xl bg-batchit-secondary flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-batchit-purple/20 text-white flex items-center justify-center font-bold text-xs">
                    {usr.displayName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{usr.displayName}</p>
                    <p className="text-[10px] text-batchit-textSecondary">@{usr.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendRequest(usr._id)}
                  className="px-3 py-1.5 rounded-xl bg-batchit-purple text-white text-xs font-bold flex items-center gap-1 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 pt-2 flex gap-4 border-b border-batchit-border/40 max-w-4xl mx-auto w-full">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-3 text-xs font-bold relative transition-colors ${
            activeTab === 'friends' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>My Friends ({friends.length})</span>
          {activeTab === 'friends' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-batchit-blue rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-xs font-bold relative transition-colors ${
            activeTab === 'requests' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>Requests ({requests.incoming.length})</span>
          {activeTab === 'requests' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-batchit-blue rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-3 text-xs font-bold relative transition-colors ${
            activeTab === 'suggestions' ? 'text-white' : 'text-batchit-textSecondary hover:text-white'
          }`}
        >
          <span>Suggestions ({suggestions.length})</span>
          {activeTab === 'suggestions' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-batchit-purple to-batchit-blue rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-3">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-16 bg-batchit-card rounded-2xl animate-pulse" />
              ))}
          </div>
        ) : activeTab === 'friends' ? (
          /* Active Friends List */
          friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Friends Added"
              description="Your circle is quiet. Search for other BatchiT members or share your QR code to connect!"
              actionText="View Suggestions"
              onAction={() => setActiveTab('suggestions')}
            />
          ) : (
            <div className="space-y-3">
              {friends.map((f) => {
                const isOnline = onlineUsers.has(f.id);

                return (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-2xl bg-batchit-card border border-batchit-border hover:border-batchit-borderLight flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-blue flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                        {f.avatar ? (
                          <img src={f.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          f.displayName?.[0] || 'U'
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-batchit-card" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{f.displayName}</h4>
                          <span className="text-[11px] text-batchit-textSecondary">@{f.username}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {f.streak && f.streak.count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                              <Flame className="w-3 h-3" />
                              <span>{f.streak.count} Day Streak</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-batchit-textMuted">No streak yet</span>
                          )}
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] text-batchit-textMuted">
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenChat(f.id)}
                        className="p-2 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-batchit-purple transition-all"
                        title="Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startCall(f, 'audio')}
                        className="p-2 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-emerald-400 transition-all"
                        title="Audio Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startCall(f, 'video')}
                        className="p-2 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-batchit-pink transition-all"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(f.id)}
                        className="p-2 rounded-xl bg-batchit-secondary hover:bg-rose-500/20 text-batchit-textMuted hover:text-rose-400 transition-all"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'requests' ? (
          /* Friend Requests Tab */
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-batchit-textSecondary uppercase tracking-wider mb-3">
                Incoming Requests ({requests.incoming.length})
              </h3>
              {requests.incoming.length === 0 ? (
                <p className="text-xs text-batchit-textMuted py-4">No pending incoming requests.</p>
              ) : (
                <div className="space-y-2">
                  {requests.incoming.map((req) => (
                    <div
                      key={req._id}
                      className="p-3.5 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-batchit-purple/20 text-white flex items-center justify-center font-bold text-xs">
                          {req.sender?.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{req.sender?.displayName}</p>
                          <p className="text-[10px] text-batchit-textSecondary">@{req.sender?.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req._id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req._id)}
                          className="px-3 py-1.5 rounded-xl bg-batchit-secondary hover:bg-batchit-border text-batchit-textSecondary text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-batchit-textSecondary uppercase tracking-wider mb-3">
                Sent Requests ({requests.outgoing.length})
              </h3>
              {requests.outgoing.length === 0 ? (
                <p className="text-xs text-batchit-textMuted py-4">No outgoing requests.</p>
              ) : (
                <div className="space-y-2">
                  {requests.outgoing.map((req) => (
                    <div
                      key={req._id}
                      className="p-3.5 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between opacity-80"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-batchit-secondary border border-batchit-border text-white flex items-center justify-center font-bold text-xs">
                          {req.recipient?.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{req.recipient?.displayName}</p>
                          <p className="text-[10px] text-batchit-textSecondary">@{req.recipient?.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelRequest(req._id)}
                        className="px-3 py-1.5 rounded-xl bg-batchit-secondary hover:bg-rose-500/20 text-rose-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Suggestions Tab */
          suggestions.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="All Caught Up"
              description="No new recommendations right now. Invite friends using your personal QR Code!"
              actionText="Show QR Code"
              onAction={() => setShowQrModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((sug) => (
                <div
                  key={sug._id}
                  className="p-4 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-blue flex items-center justify-center font-bold text-white text-xs">
                      {sug.displayName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{sug.displayName}</p>
                      <p className="text-[10px] text-batchit-textSecondary">@{sug.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendRequest(sug._id)}
                    className="px-3.5 py-1.5 rounded-xl bg-batchit-purple hover:bg-batchit-purpleDark text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-purple-500/20 active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* QR Code Profile Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
            <div className="w-full flex justify-end">
              <button onClick={() => setShowQrModal(false)} className="text-batchit-textSecondary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-batchit-purple to-batchit-pink p-1 shadow-xl mb-4">
              <div className="w-full h-full rounded-2xl bg-batchit-secondary flex items-center justify-center font-bold text-xl text-white overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.[0] || 'U'
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-0.5">{user?.displayName}</h3>
            <p className="text-xs text-batchit-textSecondary mb-6 font-mono">@{user?.username}</p>

            {/* Generated QR Code */}
            <div className="p-4 bg-white rounded-3xl shadow-xl mb-6">
              <QRCodeSVG
                value={`batchit://user/${user?.username}`}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-batchit-textSecondary leading-relaxed">
              Have a friend scan this QR code with their camera to immediately add you on BatchiT.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
