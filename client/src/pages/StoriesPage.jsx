import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';
import {
  Compass,
  Plus,
  X,
  Send,
  Eye,
  Heart,
  Flame,
  Smile,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const StoriesPage = () => {
  const { user } = useAuth();
  const [feedGroups, setFeedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Story Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyFile, setStoryFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState('friends');
  const [publishing, setPublishing] = useState(false);

  // Story Viewer State
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [storyViewers, setStoryViewers] = useState([]);

  const fileInputRef = useRef(null);
  const storyTimerRef = useRef(null);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stories/feed');
      if (res.data.success) {
        setFeedGroups(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stories feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStoryFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Publish Story
  const handlePublishStory = async () => {
    if (!storyFile) return;
    setPublishing(true);

    try {
      const formData = new FormData();
      formData.append('file', storyFile);

      const uploadRes = await api.post('/media/upload', formData);
      if (!uploadRes.data.success) throw new Error('Upload failed');

      const mediaUrl = uploadRes.data.data.url;
      const mediaType = storyFile.type.startsWith('video') ? 'video' : 'image';

      await api.post('/stories', {
        mediaUrl,
        mediaType,
        caption,
        audience
      });

      setShowCreateModal(false);
      setStoryFile(null);
      setPreviewUrl('');
      setCaption('');
      fetchFeed();
    } catch (err) {
      console.error('Publish story failed:', err);
      alert('Could not publish story.');
    } finally {
      setPublishing(false);
    }
  };

  // Open Story Viewer
  const openViewer = (groupIndex, storyIndex = 0) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(storyIndex);
    markStoryViewed(feedGroups[groupIndex].stories[storyIndex].id);
  };

  const markStoryViewed = async (storyId) => {
    try {
      await api.post(`/stories/${storyId}/view`);
    } catch (err) {}
  };

  // Handle progression through stories
  const nextStory = () => {
    const currentGroup = feedGroups[activeGroupIndex];
    if (activeStoryIndex < currentGroup.stories.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      setActiveStoryIndex(nextIdx);
      markStoryViewed(currentGroup.stories[nextIdx].id);
    } else if (activeGroupIndex < feedGroups.length - 1) {
      const nextGrp = activeGroupIndex + 1;
      setActiveGroupIndex(nextGrp);
      setActiveStoryIndex(0);
      markStoryViewed(feedGroups[nextGrp].stories[0].id);
    } else {
      setActiveGroupIndex(null);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      const prevGrp = activeGroupIndex - 1;
      setActiveGroupIndex(prevGrp);
      setActiveStoryIndex(feedGroups[prevGrp].stories.length - 1);
    }
  };

  // Auto advance timer
  useEffect(() => {
    if (activeGroupIndex === null) return;

    const currentStory = feedGroups[activeGroupIndex]?.stories[activeStoryIndex];
    const durationMs = (currentStory?.duration || 5) * 1000;

    storyTimerRef.current = setTimeout(() => {
      nextStory();
    }, durationMs);

    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    };
  }, [activeGroupIndex, activeStoryIndex]);

  // Send Story Reaction / Reply
  const handleSendReaction = async (emoji) => {
    if (activeGroupIndex === null) return;
    const currentStory = feedGroups[activeGroupIndex].stories[activeStoryIndex];
    try {
      await api.post(`/stories/${currentStory.id}/view`, { reaction: emoji });
      alert(`Sent ${emoji} to ${feedGroups[activeGroupIndex].user.displayName}`);
    } catch (err) {}
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || activeGroupIndex === null) return;
    const currentStory = feedGroups[activeGroupIndex].stories[activeStoryIndex];
    try {
      await api.post(`/stories/${currentStory.id}/view`, { reply: replyText.trim() });
      setReplyText('');
      alert('Reply sent!');
    } catch (err) {}
  };

  const currentGroup = activeGroupIndex !== null ? feedGroups[activeGroupIndex] : null;
  const currentStory = currentGroup ? currentGroup.stories[activeStoryIndex] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Header */}
      <div className="h-16 px-6 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-batchit-purple/15 text-batchit-purple flex items-center justify-center font-bold shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Stories</h1>
            <p className="text-[11px] text-batchit-textSecondary">24-hour visual updates from friends</p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setStoryFile(null);
            setPreviewUrl('');
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-transform flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Story</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-48 bg-batchit-card rounded-3xl animate-pulse" />
              ))}
          </div>
        ) : feedGroups.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No Stories Found"
            description="Be the first to share what you're up to! Your story stays visible for 24 hours."
            actionText="Publish Story"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {feedGroups.map((group, groupIdx) => {
              const latestStory = group.stories[group.stories.length - 1];
              const hasUnviewed = group.stories.some((s) => !s.hasViewed);

              return (
                <div
                  key={group.user.id}
                  onClick={() => openViewer(groupIdx, 0)}
                  className="relative h-60 rounded-3xl overflow-hidden cursor-pointer group shadow-xl border border-batchit-border hover:border-batchit-purple transition-all"
                >
                  {/* Background thumbnail */}
                  {latestStory.mediaType === 'video' ? (
                    <video src={latestStory.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <img src={latestStory.mediaUrl} alt="Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}

                  {/* Gradient shadow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Ring Indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl p-0.5 ${
                        hasUnviewed
                          ? 'bg-gradient-to-tr from-batchit-purple to-batchit-pink'
                          : 'bg-batchit-border'
                      }`}
                    >
                      <div className="w-full h-full rounded-2xl bg-batchit-card flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                        {group.user.avatar ? (
                          <img src={group.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          group.user.displayName?.[0] || 'U'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Caption & User Name */}
                  <div className="absolute bottom-3 inset-x-3 text-white">
                    <p className="text-xs font-bold truncate leading-tight">{group.user.displayName}</p>
                    <p className="text-[10px] text-white/70 truncate mt-0.5">
                      {group.stories.length} update{group.stories.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* STORY VIEWER MODAL (SNAPCHAT/INSTAGRAM STYLE SEGMENTED BARS)    */}
      {/* ============================================================== */}
      {currentGroup && currentStory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-fade-in">
          <div className="relative w-full max-w-md h-full flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Segmented Progress Bars at Top */}
            <div className="absolute top-3 inset-x-4 z-30 flex items-center gap-1.5">
              {currentGroup.stories.map((st, sIdx) => {
                const isPassed = sIdx < activeStoryIndex;
                const isCurrent = sIdx === activeStoryIndex;

                return (
                  <div key={st.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-white transition-all ${
                        isPassed ? 'w-full' : isCurrent ? 'w-full animate-[progress_5s_linear]' : 'w-0'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Header: User Info & Close */}
            <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-batchit-card border border-white/20 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {currentGroup.user.avatar ? (
                    <img src={currentGroup.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentGroup.user.displayName?.[0] || 'U'
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{currentGroup.user.displayName}</p>
                  <p className="text-[10px] text-white/70">
                    {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveGroupIndex(null)}
                className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {currentStory.mediaType === 'video' ? (
                <video src={currentStory.mediaUrl} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={currentStory.mediaUrl} alt="Story content" className="w-full h-full object-cover" />
              )}

              {/* Tap zones for left/right navigation */}
              <div onClick={prevStory} className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" />
              <div onClick={nextStory} className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer" />

              {/* Caption if present */}
              {currentStory.caption && (
                <div className="absolute bottom-20 inset-x-4 z-20 p-3 rounded-2xl bg-black/60 backdrop-blur-md text-white text-xs text-center border border-white/10 font-medium">
                  {currentStory.caption}
                </div>
              )}
            </div>

            {/* Footer: Quick Reactions and Direct Reply */}
            <div className="relative z-30 pb-6 px-4 flex flex-col gap-2">
              <div className="flex items-center justify-around py-1">
                {['❤️', '🔥', '😂', '😮', '👏', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${currentGroup.user.displayName}...`}
                  className="flex-1 h-10 bg-black/50 backdrop-blur-md border border-white/20 rounded-2xl px-4 text-xs text-white placeholder-white/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-10 h-10 rounded-2xl bg-batchit-purple text-white flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD STORY MODAL                                                */}
      {/* ============================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-batchit-border">
              <h3 className="text-base font-bold text-white">Create 24h Story</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-batchit-textSecondary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4">
              {previewUrl ? (
                <div className="relative h-64 rounded-2xl overflow-hidden border border-batchit-border">
                  {storyFile?.type?.startsWith('video') ? (
                    <video src={previewUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => {
                      setStoryFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 rounded-2xl border-2 border-dashed border-batchit-border hover:border-batchit-purple flex flex-col items-center justify-center text-batchit-textSecondary transition-colors"
                >
                  <Plus className="w-8 h-8 mb-2 text-batchit-purple" />
                  <span className="text-xs font-semibold">Choose photo or video</span>
                </button>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-xl px-3.5 text-xs text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-batchit-textSecondary font-semibold">Audience</span>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="bg-batchit-secondary border border-batchit-border text-white text-xs rounded-xl px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="friends">All Friends</option>
                  <option value="close_friends">Close Friends Only ⭐</option>
                  <option value="everyone">Public</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePublishStory}
              disabled={!storyFile || publishing}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-xs shadow-md shadow-purple-500/25 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {publishing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Publish Story</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
