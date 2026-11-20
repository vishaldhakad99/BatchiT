import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { deriveSharedKey, encryptMessage, decryptMessage } from '../services/crypto';
import { MessageSkeleton, ConversationSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  MessageSquare,
  Send,
  Phone,
  Video,
  Smile,
  Image as ImageIcon,
  Mic,
  MicOff,
  MoreVertical,
  Lock,
  Clock,
  Check,
  CheckCheck,
  Pin,
  Archive,
  Search,
  Plus,
  ArrowLeft,
  X,
  Reply,
  Trash2,
  Edit2
} from 'lucide-react';

const ChatPage = () => {
  const { conversationId: paramConvId } = useParams();
  const navigate = useNavigate();
  const { user, e2eeKeys } = useAuth();
  const { socket, onlineUsers, typingUsers, startCall } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sharedKey, setSharedKey] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);

  // New Chat Modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Set selected conversation when URL param changes
  useEffect(() => {
    if (paramConvId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === paramConvId || c._id === paramConvId);
      if (found) {
        setSelectedConv(found);
      }
    }
  }, [paramConvId, conversations]);

  // Derive E2EE key for 1-to-1 conversation
  useEffect(() => {
    const initE2EE = async () => {
      setSharedKey(null);
      if (!selectedConv || selectedConv.isGroup || !e2eeKeys?.privateKey) return;

      const otherUser = selectedConv.participants.find((p) => p._id !== user?.id && p.id !== user?.id);
      if (otherUser && otherUser.publicKey) {
        const key = await deriveSharedKey(e2eeKeys.privateKey, otherUser.publicKey);
        if (key) setSharedKey(key);
      }
    };
    initE2EE();
  }, [selectedConv, e2eeKeys, user?.id]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/messages/conversation/${selectedConv.id || selectedConv._id}`);
        if (res.data.success) {
          const rawMsgs = res.data.data;

          // Decrypt E2EE messages if shared key is available
          const processed = await Promise.all(
            rawMsgs.map(async (msg) => {
              if (msg.isEncrypted && msg.iv && sharedKey) {
                const plaintext = await decryptMessage(msg.content, msg.iv, sharedKey);
                return { ...msg, decryptedContent: plaintext };
              }
              return msg;
            })
          );

          setMessages(processed);
          // Mark as read
          api.post(`/messages/conversation/${selectedConv.id || selectedConv._id}/read`).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Join socket room
    if (socket) {
      const cId = selectedConv.id || selectedConv._id;
      socket.emit('join_conversation', cId);
    }

    return () => {
      if (socket && selectedConv) {
        const cId = selectedConv.id || selectedConv._id;
        socket.emit('leave_conversation', cId);
      }
    };
  }, [selectedConv?.id, sharedKey, socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket message listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (newMsg) => {
      if (selectedConv && (newMsg.conversation === selectedConv.id || newMsg.conversation === selectedConv._id)) {
        let displayMsg = newMsg;
        if (newMsg.isEncrypted && newMsg.iv && sharedKey) {
          const plaintext = await decryptMessage(newMsg.content, newMsg.iv, sharedKey);
          displayMsg = { ...newMsg, decryptedContent: plaintext };
        }
        setMessages((prev) => [...prev, displayMsg]);
      }
      fetchConversations();
    };

    const handleMessageReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m))
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_reaction_updated', handleMessageReaction);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_reaction_updated', handleMessageReaction);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, selectedConv, sharedKey]);

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const cId = selectedConv.id || selectedConv._id;
    const textToSend = inputText.trim();
    setInputText('');

    let isEncrypted = false;
    let content = textToSend;
    let iv = '';

    // Encrypt if 1-to-1 and shared key available
    if (sharedKey && !selectedConv.isGroup) {
      const encrypted = await encryptMessage(textToSend, sharedKey);
      if (encrypted) {
        content = encrypted.ciphertext;
        iv = encrypted.iv;
        isEncrypted = true;
      }
    }

    try {
      const res = await api.post('/messages', {
        conversationId: cId,
        type: 'text',
        content,
        isEncrypted,
        iv,
        replyTo: replyingTo?._id || null
      });

      if (res.data.success) {
        const saved = res.data.data;
        if (isEncrypted) {
          saved.decryptedContent = textToSend;
        }
        setMessages((prev) => [...prev, saved]);
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Upload and send media (Photo/Video)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (uploadRes.data.success) {
        const media = uploadRes.data.data;
        const cId = selectedConv.id || selectedConv._id;
        const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';

        const res = await api.post('/messages', {
          conversationId: cId,
          type,
          mediaUrl: media.url,
          mediaSize: media.size,
          mediaMime: media.mimeType,
          content: ''
        });

        if (res.data.success) {
          setMessages((prev) => [...prev, res.data.data]);
        }
      }
    } catch (err) {
      console.error('Media upload failed:', err);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', audioFile);

        const uploadRes = await api.post('/media/upload', formData);
        if (uploadRes.data.success) {
          const media = uploadRes.data.data;
          const cId = selectedConv.id || selectedConv._id;

          const res = await api.post('/messages', {
            conversationId: cId,
            type: 'audio',
            mediaUrl: media.url,
            mediaSize: media.size,
            mediaMime: 'audio/webm'
          });

          if (res.data.success) {
            setMessages((prev) => [...prev, res.data.data]);
          }
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to record audio:', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // React to message
  const handleReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reaction`, { emoji });
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Fetch friends for new chat modal
  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    setCreatingGroup(false);
    setSelectedFriendIds([]);
    try {
      const res = await api.get('/friends/list');
      if (res.data.success) {
        setFriendsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startDirectChat = async (friendId) => {
    try {
      const res = await api.post('/conversations/direct', { recipientId: friendId });
      if (res.data.success) {
        setShowNewChatModal(false);
        await fetchConversations();
        setSelectedConv(res.data.data);
        navigate(`/chat/${res.data.data._id || res.data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedFriendIds.length === 0) return;
    try {
      const res = await api.post('/groups', {
        name: groupName.trim(),
        memberIds: selectedFriendIds
      });
      if (res.data.success) {
        setShowNewChatModal(false);
        await fetchConversations();
        navigate(`/chat/${res.data.data.conversationId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = (conv) => {
    if (conv.isGroup) return null;
    return conv.participants?.find((p) => (p._id || p.id) !== user?.id);
  };

  return (
    <div className="flex h-full w-full bg-batchit-bg overflow-hidden relative">
      {/* ============================================================== */}
      {/* CONVERSATIONS SIDEBAR LIST                                     */}
      {/* ============================================================== */}
      <div
        className={`w-full md:w-80 lg:w-96 bg-batchit-secondary border-r border-batchit-border flex flex-col shrink-0 ${
          selectedConv ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-batchit-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Chats</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-batchit-purple/20 text-batchit-purple font-mono">
              {conversations.length}
            </span>
          </h1>

          <button
            onClick={openNewChatModal}
            className="w-9 h-9 rounded-xl bg-batchit-purple hover:bg-batchit-purpleDark text-white flex items-center justify-center shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            title="Start New Chat or Group"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-batchit-border/40">
          <div className="relative">
            <Search className="w-4 h-4 text-batchit-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-10 bg-batchit-card border border-batchit-border rounded-xl pl-9 pr-3 text-xs text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-batchit-border/30">
          {loadingConvs ? (
            Array(5)
              .fill(0)
              .map((_, i) => <ConversationSkeleton key={i} />)
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No chats yet"
              description="Connect with friends to start chatting with end-to-end encryption!"
              actionText="Find Friends"
              onAction={() => navigate('/friends')}
            />
          ) : (
            conversations
              .filter((c) => {
                if (!searchQuery) return true;
                const other = getOtherParticipant(c);
                const name = c.isGroup ? c.group?.name : other?.displayName || other?.username;
                return name?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv) => {
                const other = getOtherParticipant(conv);
                const isOnline = other ? onlineUsers.has(other._id || other.id) : false;
                const isSelected = (selectedConv?.id || selectedConv?._id) === (conv.id || conv._id);
                const title = conv.isGroup ? conv.group?.name : other?.displayName;
                const subtitle = conv.isGroup ? `${conv.participants?.length} members` : `@${other?.username}`;

                return (
                  <button
                    key={conv.id || conv._id}
                    onClick={() => {
                      setSelectedConv(conv);
                      navigate(`/chat/${conv.id || conv._id}`);
                    }}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? 'bg-batchit-card border-l-4 border-batchit-purple'
                        : 'hover:bg-batchit-card/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-pink flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-sm">
                      {conv.isGroup ? (
                        <span>👥</span>
                      ) : other?.avatar ? (
                        <img src={other.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        other?.displayName?.[0] || 'U'
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-batchit-secondary" />
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden leading-snug">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-bold text-white truncate">{title}</span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-batchit-textMuted font-mono">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-batchit-textSecondary truncate">
                        {conv.lastMessage?.content
                          ? conv.lastMessage.isEncrypted
                            ? '🔒 Encrypted message'
                            : conv.lastMessage.content
                          : subtitle}
                      </p>
                    </div>
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ACTIVE CONVERSATION WORKSPACE                                  */}
      {/* ============================================================== */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col h-full bg-batchit-bg overflow-hidden relative">
          {/* Conversation Header */}
          <div className="h-16 px-4 bg-batchit-secondary border-b border-batchit-border flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedConv(null);
                  navigate('/chat');
                }}
                className="md:hidden p-2 rounded-xl text-batchit-textSecondary hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {(() => {
                const other = getOtherParticipant(selectedConv);
                const isOnline = other ? onlineUsers.has(other._id || other.id) : false;
                const title = selectedConv.isGroup ? selectedConv.group?.name : other?.displayName;

                return (
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-center font-bold text-white overflow-hidden">
                      {selectedConv.isGroup ? (
                        '👥'
                      ) : other?.avatar ? (
                        <img src={other.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        other?.displayName?.[0] || 'U'
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-batchit-secondary" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                        <span>{title}</span>
                        {sharedKey && !selectedConv.isGroup && (
                          <span title="Audited E2EE Active">
                            <Lock className="w-3 h-3 text-emerald-400" />
                          </span>
                        )}
                      </h2>
                      <p className="text-[11px] text-batchit-textSecondary">
                        {isOnline ? 'Active now' : 'Offline'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Calling & Options */}
            <div className="flex items-center gap-2">
              {!selectedConv.isGroup && (
                <>
                  <button
                    onClick={() => {
                      const other = getOtherParticipant(selectedConv);
                      if (other) startCall(other, 'audio');
                    }}
                    className="w-9 h-9 rounded-xl bg-batchit-card hover:bg-batchit-border text-batchit-purple flex items-center justify-center transition-all"
                    title="Start Audio Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const other = getOtherParticipant(selectedConv);
                      if (other) startCall(other, 'video');
                    }}
                    className="w-9 h-9 rounded-xl bg-batchit-card hover:bg-batchit-border text-batchit-pink flex items-center justify-center transition-all"
                    title="Start Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="w-9 h-9 rounded-xl bg-batchit-card hover:bg-batchit-border text-batchit-textSecondary flex items-center justify-center transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 top-11 w-48 bg-batchit-card border border-batchit-border rounded-2xl p-1.5 shadow-xl z-50 animate-fade-in text-xs font-semibold">
                    <button
                      onClick={() => {
                        setShowDisappearingModal(true);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-batchit-textSecondary hover:text-white hover:bg-batchit-border/40"
                    >
                      <Clock className="w-4 h-4 text-batchit-purple" />
                      <span>Disappearing Messages</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <MessageSkeleton />
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-batchit-textSecondary">
                <div className="w-14 h-14 rounded-2xl bg-batchit-card border border-batchit-border flex items-center justify-center text-batchit-purple mb-3 shadow-md">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Encrypted Conversation</h4>
                <p className="text-xs max-w-xs leading-relaxed">
                  Messages in this chat are protected by client-side Web Crypto E2EE. Send a message to break the ice!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = (msg.sender?._id || msg.sender?.id || msg.sender) === user?.id;
                const displayText = msg.decryptedContent || msg.content;

                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Reply quote banner if replying to another message */}
                    {msg.replyTo && (
                      <div className="text-[11px] px-3 py-1 bg-batchit-card/80 border-l-2 border-batchit-purple rounded-t-lg max-w-xs truncate text-batchit-textSecondary mb-0.5">
                        ↳ {msg.replyTo.content || 'Media message'}
                      </div>
                    )}

                    <div className="flex items-end gap-2 max-w-[75%] sm:max-w-[65%]">
                      {!isMe && (
                        <div className="w-7 h-7 rounded-xl bg-batchit-card border border-batchit-border flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden mb-1">
                          {msg.sender?.avatar ? (
                            <img src={msg.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            msg.sender?.displayName?.[0] || 'U'
                          )}
                        </div>
                      )}

                      <div
                        className={`relative rounded-3xl p-3.5 text-sm shadow-md transition-all ${
                          isMe
                            ? 'bg-gradient-to-r from-batchit-purple to-batchit-purpleDark text-white rounded-br-sm'
                            : 'bg-batchit-card border border-batchit-border text-white rounded-bl-sm'
                        }`}
                      >
                        {/* Media content */}
                        {msg.type === 'image' && msg.mediaUrl && (
                          <div className="mb-2 rounded-2xl overflow-hidden max-h-72">
                            <img src={msg.mediaUrl} alt="Sent media" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {msg.type === 'video' && msg.mediaUrl && (
                          <div className="mb-2 rounded-2xl overflow-hidden max-h-72">
                            <video src={msg.mediaUrl} controls className="w-full h-full object-cover" />
                          </div>
                        )}

                        {msg.type === 'audio' && msg.mediaUrl && (
                          <div className="mb-2 w-64">
                            <audio src={msg.mediaUrl} controls className="w-full h-10" />
                          </div>
                        )}

                        {/* Text */}
                        {displayText && (
                          <p className={`whitespace-pre-wrap break-words leading-relaxed ${msg.isDeleted ? 'italic text-batchit-textMuted' : ''}`}>
                            {displayText}
                          </p>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-white/70">
                          {msg.isEncrypted && <Lock className="w-2.5 h-2.5 text-white/60" />}
                          {msg.isEdited && <span className="italic text-[9px]">edited</span>}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span>
                              {msg.status === 'READ' ? (
                                <CheckCheck className="w-3 h-3 text-cyan-300" />
                              ) : (
                                <Check className="w-3 h-3 text-white/60" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick action buttons on hover */}
                      <div className="hidden group-hover:flex items-center gap-1 shrink-0 pb-1">
                        <button
                          onClick={() => setReplyingTo(msg)}
                          title="Reply"
                          className="p-1.5 rounded-lg bg-batchit-card text-batchit-textSecondary hover:text-white"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReaction(msg._id, '❤️')}
                          title="Heart"
                          className="p-1 rounded-lg bg-batchit-card text-xs hover:scale-125 transition-transform"
                        >
                          ❤️
                        </button>
                        <button
                          onClick={() => handleReaction(msg._id, '🔥')}
                          title="Fire"
                          className="p-1 rounded-lg bg-batchit-card text-xs hover:scale-125 transition-transform"
                        >
                          🔥
                        </button>
                        {isMe && !msg.isDeleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            title="Delete"
                            className="p-1.5 rounded-lg bg-batchit-card text-batchit-textSecondary hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reactions Pill Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 px-2">
                        {msg.reactions.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-batchit-secondary border border-batchit-border text-[11px] shadow-sm"
                          >
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Replying banner */}
          {replyingTo && (
            <div className="px-4 py-2 bg-batchit-secondary border-t border-batchit-border flex items-center justify-between text-xs text-batchit-textSecondary">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-4 h-4 text-batchit-purple shrink-0" />
                <span className="truncate">Replying to: {replyingTo.content || 'Media'}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-batchit-secondary border-t border-batchit-border shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-2xl bg-batchit-card hover:bg-batchit-border text-batchit-textSecondary hover:text-white flex items-center justify-center transition-all"
                title="Attach Photo or Video"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-batchit-card hover:bg-batchit-border text-batchit-textSecondary hover:text-white'
                }`}
                title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? 'Recording voice note...' : 'Type a private message...'}
                disabled={isRecording}
                className="flex-1 h-11 bg-batchit-card border border-batchit-border rounded-2xl px-4 text-sm text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-pink text-white flex items-center justify-center shadow-lg shadow-purple-500/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* No Conversation Selected Placeholder */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-batchit-bg">
          <EmptyState
            icon={MessageSquare}
            title="BatchiT Private Chat"
            description="Select a conversation from the sidebar or click '+' to start a new private message."
            actionText="New Message"
            onAction={openNewChatModal}
          />
        </div>
      )}

      {/* Disappearing Messages Setting Modal */}
      {showDisappearingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Disappearing Messages</h3>
            <p className="text-xs text-batchit-textSecondary mb-4">
              When enabled, new messages sent in this conversation will automatically vanish after the selected duration.
            </p>

            <div className="space-y-2 mb-6">
              {[
                { label: 'Off', seconds: 0 },
                { label: '24 Hours', seconds: 86400 },
                { label: '7 Days', seconds: 604800 },
                { label: '90 Days', seconds: 7776000 }
              ].map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={async () => {
                    const cId = selectedConv.id || selectedConv._id;
                    await api.put(`/conversations/${cId}/settings`, { disappearingDuration: opt.seconds });
                    setSelectedConv((prev) => ({ ...prev, disappearingDuration: opt.seconds }));
                    setShowDisappearingModal(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    selectedConv?.disappearingDuration === opt.seconds
                      ? 'bg-batchit-purple/20 border-batchit-purple text-white'
                      : 'bg-batchit-secondary border-batchit-border text-batchit-textSecondary hover:text-white'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedConv?.disappearingDuration === opt.seconds && <Check className="w-4 h-4 text-batchit-purple" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowDisappearingModal(false)}
              className="w-full h-11 rounded-2xl bg-batchit-secondary text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New Chat & Group Creation Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-batchit-border">
              <h3 className="text-base font-bold text-white">
                {creatingGroup ? 'Create New Group' : 'Start a Conversation'}
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-batchit-textSecondary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 my-4">
              <button
                onClick={() => setCreatingGroup(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !creatingGroup ? 'bg-batchit-purple text-white shadow-md' : 'bg-batchit-secondary text-batchit-textSecondary'
                }`}
              >
                Direct Message
              </button>
              <button
                onClick={() => setCreatingGroup(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  creatingGroup ? 'bg-batchit-purple text-white shadow-md' : 'bg-batchit-secondary text-batchit-textSecondary'
                }`}
              >
                New Group
              </button>
            </div>

            {creatingGroup && (
              <div className="mb-4">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full h-11 bg-batchit-secondary border border-batchit-border rounded-2xl px-4 text-xs text-white placeholder-batchit-textMuted focus:outline-none focus:border-batchit-purple"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {friendsList.length === 0 ? (
                <p className="text-xs text-center text-batchit-textSecondary py-8">
                  No friends found. Add friends in the Friends tab first!
                </p>
              ) : (
                friendsList.map((f) => {
                  const isSelected = selectedFriendIds.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        if (creatingGroup) {
                          setSelectedFriendIds((prev) =>
                            prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                          );
                        } else {
                          startDirectChat(f.id);
                        }
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-batchit-purple/20 border-batchit-purple'
                          : 'bg-batchit-secondary border-batchit-border hover:border-batchit-borderLight'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-batchit-purple to-batchit-blue flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                          {f.avatar ? (
                            <img src={f.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            f.displayName?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{f.displayName}</p>
                          <p className="text-[11px] text-batchit-textSecondary">@{f.username}</p>
                        </div>
                      </div>

                      {creatingGroup && (
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isSelected ? 'bg-batchit-purple border-batchit-purple text-white' : 'border-batchit-border'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {creatingGroup && (
              <button
                onClick={createGroupChat}
                disabled={!groupName.trim() || selectedFriendIds.length === 0}
                className="w-full h-11 mt-4 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-xs shadow-lg shadow-purple-500/20 disabled:opacity-40"
              >
                Create Group ({selectedFriendIds.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
