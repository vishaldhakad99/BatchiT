import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Shield } from 'lucide-react';

const CallModal = () => {
  const { callState, localStream, remoteStream, acceptCall, rejectCall, endCall, toggleMute, toggleCamera } = useSocket();
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Call duration counter
  useEffect(() => {
    let timer = null;
    if (callState?.status === 'connected') {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState?.status]);

  // Attach media streams to DOM video/audio elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState?.type]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState?.type]);

  if (!callState) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideo = callState.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      {/* Hidden Audio element for Audio-only calls */}
      {!isVideo && <audio ref={remoteAudioRef} autoPlay />}

      <div className="relative w-full max-w-2xl bg-batchit-card border border-batchit-border rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Video Canvas Area */}
        {isVideo ? (
          <div className="relative w-full h-[460px] bg-black flex items-center justify-center overflow-hidden">
            {/* Remote Peer Video Stream */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-24 h-24 rounded-full bg-batchit-secondary border-2 border-batchit-purple flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                  {callState.peerUser.avatar ? (
                    <img src={callState.peerUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    callState.peerUser.displayName?.[0] || 'U'
                  )}
                </div>
                <p className="text-sm text-batchit-textSecondary animate-pulse">
                  {callState.status === 'connected' ? 'Connecting media...' : 'Ringing...'}
                </p>
              </div>
            )}

            {/* Local Video Stream in Picture-in-Picture Corner */}
            <div className="absolute top-4 right-4 w-36 h-48 bg-batchit-secondary rounded-2xl border-2 border-batchit-border overflow-hidden shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {callState.isCameraOff && (
                <div className="absolute inset-0 bg-batchit-card flex items-center justify-center text-xs text-batchit-textSecondary">
                  Camera Off
                </div>
              )}
            </div>

            {/* Top Bar Info */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>P2P Encrypted</span>
              {callState.status === 'connected' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="font-mono text-emerald-400">{formatDuration(duration)}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Audio-only Call Interface */
          <div className="py-16 px-6 flex flex-col items-center text-center bg-gradient-to-b from-batchit-card to-batchit-secondary">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-batchit-purple to-batchit-pink p-1 animate-pulse-slow">
                <div className="w-full h-full rounded-full bg-batchit-secondary flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
                  {callState.peerUser.avatar ? (
                    <img src={callState.peerUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    callState.peerUser.displayName?.[0] || 'U'
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-batchit-bg border border-batchit-border text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {callState.status === 'connected' ? 'Connected' : callState.status === 'incoming' ? 'Incoming Call' : 'Calling...'}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">{callState.peerUser.displayName}</h2>
            <p className="text-sm text-batchit-textSecondary mb-4">@{callState.peerUser.username}</p>

            {callState.status === 'connected' ? (
              <p className="font-mono text-lg text-emerald-400 font-semibold">{formatDuration(duration)}</p>
            ) : (
              <p className="text-sm text-batchit-textMuted animate-pulse">
                {callState.status === 'incoming' ? 'Incoming audio call...' : 'Waiting for answer...'}
              </p>
            )}
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="p-6 bg-batchit-card border-t border-batchit-border flex items-center justify-center gap-5">
          {callState.status === 'incoming' ? (
            /* Incoming Call Actions: Accept / Reject */
            <>
              <button
                onClick={rejectCall}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 font-semibold text-sm transition-all active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 animate-bounce"
              >
                <Phone className="w-5 h-5" />
                Answer
              </button>
            </>
          ) : (
            /* Active / Outgoing Controls */
            <>
              <button
                onClick={toggleMute}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                  callState.isMuted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-batchit-secondary text-white border-batchit-border hover:bg-batchit-border'
                }`}
                title={callState.isMuted ? 'Unmute' : 'Mute'}
              >
                {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {isVideo && (
                <button
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                    callState.isCameraOff
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-batchit-secondary text-white border-batchit-border hover:bg-batchit-border'
                  }`}
                  title={callState.isCameraOff ? 'Turn Video On' : 'Turn Video Off'}
                >
                  {callState.isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={endCall}
                className="px-6 h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
