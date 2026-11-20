import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api, { getServerBaseUrl } from '../services/api';

const SocketContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    // OpenRelay Public TURN Relay for cross-country and mobile carrier NAT traversal (4G/5G, India to UAE/Global)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // conversationId -> Set of usernames

  // WebRTC Calling State
  const [callState, setCallState] = useState(null); 
  // null | { callId, type: 'audio'|'video', status: 'incoming'|'outgoing'|'connected', peerUser: {...}, isMuted: false, isCameraOff: false }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  // Synthesize Ringtone using Web Audio API (cross-platform, zero external audio file required)
  const startRingtone = (isIncoming) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const freq = isIncoming ? 440 : 480;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      };

      playBeep();
      ringtoneIntervalRef.current = setInterval(playBeep, 2400);
    } catch (e) {
      console.warn('AudioContext not allowed yet:', e);
    }
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
  };

  // Socket initialization
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const getSocketUrl = () => {
      const serverUrl = getServerBaseUrl();
      return serverUrl || '/';
    };

    const newSocket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to BatchiT real-time network');
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on('user_typing', ({ conversationId, username }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || new Set();
        const updated = new Set(current).add(username);
        return { ...prev, [conversationId]: updated };
      });
    });

    newSocket.on('user_stop_typing', ({ conversationId, username }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || new Set();
        const updated = new Set(current);
        updated.delete(username);
        return { ...prev, [conversationId]: updated };
      });
    });

    // ==========================================
    // WEBRTC CALLING EVENTS
    // ==========================================

    newSocket.on('incoming_call', async ({ callId, caller, type, offer }) => {
      startRingtone(true);
      setCallState({
        callId,
        type,
        status: 'incoming',
        peerUser: caller,
        offer,
        isMuted: false,
        isCameraOff: false
      });
    });

    newSocket.on('call_answered', async ({ callId, answer }) => {
      stopRingtone();
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState((prev) => (prev ? { ...prev, status: 'connected' } : null));
        api.put(`/calls/${callId}/status`, { status: 'accepted' }).catch(() => {});
      }
    });

    newSocket.on('ice_candidate', async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding received ICE candidate:', err);
        }
      }
    });

    newSocket.on('call_declined', () => {
      stopRingtone();
      cleanupCall();
      alert('Call was declined.');
    });

    newSocket.on('call_terminated', () => {
      stopRingtone();
      cleanupCall();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      stopRingtone();
    };
  }, [token, user?.id]);

  // Cleanup WebRTC Media & Connection
  const cleanupCall = () => {
    stopRingtone();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallState(null);
  };

  // Initiate Outgoing Call
  const startCall = async (recipient, type = 'audio') => {
    try {
      cleanupCall();

      // Get user media stream
      const constraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Create Call record on server
      const callRes = await api.post('/calls/initiate', {
        recipientId: recipient.id || recipient._id,
        type
      });

      const callId = callRes.data.data._id;

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Add local tracks to PeerConnection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle Remote Stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            callId,
            targetUserId: recipient.id || recipient._id,
            candidate: event.candidate
          });
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      startRingtone(false);

      setCallState({
        callId,
        type,
        status: 'outgoing',
        peerUser: recipient,
        isMuted: false,
        isCameraOff: false
      });

      // Emit to socket
      socket.emit('call_initiate', {
        callId,
        recipientId: recipient.id || recipient._id,
        type,
        offer
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      cleanupCall();
      alert(`Could not start ${type} call: ${err.message}. Please check camera/microphone permissions.`);
    }
  };

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!callState || !callState.offer) return;
    stopRingtone();

    try {
      const constraints = {
        audio: true,
        video: callState.type === 'video' ? { facingMode: 'user' } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            callId: callState.callId,
            targetUserId: callState.peerUser.id || callState.peerUser._id,
            candidate: event.candidate
          });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callState.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setCallState((prev) => ({ ...prev, status: 'connected' }));

      socket.emit('call_accept', {
        callId: callState.callId,
        callerId: callState.peerUser.id || callState.peerUser._id,
        answer
      });
    } catch (err) {
      console.error('Failed to accept call:', err);
      rejectCall();
      alert(`Failed to connect call: ${err.message}`);
    }
  };

  // Reject Call
  const rejectCall = () => {
    stopRingtone();
    if (callState && socket) {
      socket.emit('call_reject', {
        callId: callState.callId,
        callerId: callState.peerUser.id || callState.peerUser._id
      });
      api.put(`/calls/${callState.callId}/status`, { status: 'rejected' }).catch(() => {});
    }
    cleanupCall();
  };

  // End Active Call
  const endCall = () => {
    stopRingtone();
    if (callState && socket) {
      socket.emit('call_end', {
        callId: callState.callId,
        targetUserId: callState.peerUser.id || callState.peerUser._id
      });
      api.put(`/calls/${callState.callId}/status`, { status: 'ended' }).catch(() => {});
    }
    cleanupCall();
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
      }
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState((prev) => (prev ? { ...prev, isCameraOff: !videoTrack.enabled } : null));
      }
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        typingUsers,
        callState,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
