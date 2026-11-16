import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Camera,
  RefreshCw,
  Image as ImageIcon,
  Send,
  Type,
  Palette,
  Clock,
  Eye,
  Check,
  X,
  Sparkles,
  Download,
  Trash2,
  Video
} from 'lucide-react';

const FILTERS = [
  { id: 'normal', name: 'Normal', css: '' },
  { id: 'violet', name: 'Vivid Violet', css: 'hue-rotate-[280deg] saturate-150 contrast-110' },
  { id: 'cyberpunk', name: 'Cyberpunk', css: 'contrast-125 saturate-200 hue-rotate-[190deg]' },
  { id: 'noir', name: 'Noir', css: 'grayscale contrast-150 brightness-90' },
  { id: 'sunset', name: 'Warm Sunset', css: 'sepia-[0.35] saturate-150 hue-rotate-[-20deg]' },
  { id: 'vintage', name: 'Vintage', css: 'sepia-[0.6] contrast-95 brightness-95' }
];

const COLORS = ['#FFFFFF', '#8B5CF6', '#EC4899', '#06B6D4', '#FBBF24', '#10B981', '#000000'];

const CameraPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Media Capture State
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [capturedMedia, setCapturedMedia] = useState(null); // { type: 'photo'|'video', url: string, blob: Blob }
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Editor Tools State
  const [activeTool, setActiveTool] = useState(null); // 'text' | 'draw' | 'filter' | 'timer'
  const [textOverlay, setTextOverlay] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [snapDuration, setSnapDuration] = useState(5); // 1-10s
  const [viewOnce, setViewOnce] = useState(true);

  // Drawing Canvas State
  const [drawColor, setDrawColor] = useState('#8B5CF6');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);

  // Send Snap Modal State
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [sending, setSending] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Start Device Camera
  const startCamera = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied:', err);
    }
  };

  useEffect(() => {
    if (!capturedMedia) {
      startCamera();
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, capturedMedia]);

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;

    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ type: 'photo', url, blob });
    }, 'image/jpeg', 0.95);
  };

  // Video Recording
  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ type: 'video', url, blob });
    };

    recorder.start();
    setRecording(true);
    setRecordDuration(0);

    const timer = setInterval(() => {
      setRecordDuration((prev) => {
        if (prev >= 15) {
          stopVideoRecording();
          clearInterval(timer);
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // File Upload fallback
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'photo';
    setCapturedMedia({ type, url, blob: file });
  };

  // Drawing Canvas setup
  useEffect(() => {
    if (capturedMedia && drawCanvasRef.current) {
      const canvas = drawCanvasRef.current;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
  }, [capturedMedia, activeTool]);

  const startDraw = (e) => {
    if (activeTool !== 'draw') return;
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Fetch Friends for Send dialog
  const openRecipientDialog = async () => {
    setShowRecipientModal(true);
    try {
      const res = await api.get('/friends/list');
      if (res.data.success) {
        setFriends(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send Snap API
  const handleSendSnap = async () => {
    if (!capturedMedia || selectedFriends.length === 0) return;
    setSending(true);

    try {
      // 1. Upload media blob
      const formData = new FormData();
      const ext = capturedMedia.type === 'video' ? 'webm' : 'jpg';
      const file = new File([capturedMedia.blob], `snap_${Date.now()}.${ext}`, {
        type: capturedMedia.type === 'video' ? 'video/webm' : 'image/jpeg'
      });
      formData.append('file', file);

      const uploadRes = await api.post('/media/upload', formData);
      if (!uploadRes.data.success) throw new Error('Upload failed');

      const uploadedUrl = uploadRes.data.data.url;

      // 2. Export drawing data URL if any
      let drawingData = '';
      if (drawCanvasRef.current) {
        drawingData = drawCanvasRef.current.toDataURL();
      }

      // 3. Post Snap
      await api.post('/snaps', {
        recipients: selectedFriends,
        mediaUrl: uploadedUrl,
        mediaType: capturedMedia.type,
        duration: snapDuration,
        viewOnce,
        textOverlay,
        filter: selectedFilter,
        drawingData
      });

      // Reset & redirect to snaps inbox
      setCapturedMedia(null);
      setShowRecipientModal(false);
      navigate('/snaps');
    } catch (err) {
      console.error('Failed to send snap:', err);
      alert('Could not deliver snap. Please check connection.');
    } finally {
      setSending(false);
    }
  };

  // Save to memories / Private Vault directly from camera
  const handleSaveToMemories = async (isVault = false) => {
    if (!capturedMedia) return;

    try {
      const formData = new FormData();
      const ext = capturedMedia.type === 'video' ? 'webm' : 'jpg';
      formData.append(
        'file',
        new File([capturedMedia.blob], `memory_${Date.now()}.${ext}`, {
          type: capturedMedia.type === 'video' ? 'video/webm' : 'image/jpeg'
        })
      );

      const uploadRes = await api.post('/media/upload', formData);
      if (uploadRes.data.success) {
        await api.post('/memories', {
          mediaUrl: uploadRes.data.data.url,
          mediaType: capturedMedia.type,
          title: textOverlay || 'Camera Capture',
          isVault
        });
        alert(isVault ? 'Saved to Private Vault 🔒' : 'Saved to Memories 📸');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filterClass = FILTERS.find((f) => f.id === selectedFilter)?.css || '';

  return (
    <div className="relative flex-1 h-full w-full bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Main Viewport */}
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-between overflow-hidden shadow-2xl">
        {/* ========================================================== */}
        {/* VIEW A: LIVE CAMERA STREAM                                 */}
        {/* ========================================================== */}
        {!capturedMedia ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Top Bar Controls */}
            <div className="relative z-20 w-full pt-6 px-6 flex items-center justify-between text-white">
              <button
                onClick={toggleFacingMode}
                className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                title="Flip Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <div className="px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-batchit-pink animate-pulse" />
                <span>Snap Camera</span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                title="Upload Photo or Video"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Shutter Controls */}
            <div className="relative z-20 w-full pb-10 px-8 flex items-center justify-around">
              {/* Shutter Button */}
              <div className="relative flex items-center justify-center">
                {recording && (
                  <div className="absolute -top-12 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold font-mono animate-pulse">
                    00:{recordDuration.toString().padStart(2, '0')}
                  </div>
                )}
                <button
                  onClick={capturePhoto}
                  onMouseDown={startVideoRecording}
                  onMouseUp={stopVideoRecording}
                  onTouchStart={startVideoRecording}
                  onTouchEnd={stopVideoRecording}
                  className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                    recording
                      ? 'border-rose-500 bg-rose-500/20 scale-110 shadow-lg shadow-rose-500/50'
                      : 'border-white bg-white/20 active:scale-95 shadow-lg'
                  }`}
                  title="Click to Photo, Hold to Record Video"
                >
                  <div
                    className={`rounded-full transition-all ${
                      recording ? 'w-8 h-8 rounded-lg bg-rose-500' : 'w-14 h-14 bg-white'
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ========================================================== */
          /* VIEW B: SNAP STUDIO & CREATIVE TOOLS                       */
          /* ========================================================== */
          <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
            {/* Captured Media Display */}
            {capturedMedia.type === 'photo' ? (
              <img
                src={capturedMedia.url}
                alt="Captured Snap"
                className={`absolute inset-0 w-full h-full object-cover ${filterClass}`}
              />
            ) : (
              <video
                src={capturedMedia.url}
                autoPlay
                loop
                playsInline
                className={`absolute inset-0 w-full h-full object-cover ${filterClass}`}
              />
            )}

            {/* Drawing Canvas Overlay */}
            <canvas
              ref={drawCanvasRef}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className="absolute inset-0 z-10 w-full h-full touch-none"
            />

            {/* Text Overlay Display */}
            {textOverlay && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-center text-white text-base font-bold shadow-xl border border-white/10">
                {textOverlay}
              </div>
            )}

            {/* Studio Top Control Icons */}
            <div className="relative z-30 pt-6 px-4 flex items-center justify-between text-white">
              <button
                onClick={() => setCapturedMedia(null)}
                className="w-10 h-10 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {/* Text Tool */}
                <button
                  onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
                  className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                    activeTool === 'text'
                      ? 'bg-batchit-purple border-batchit-purple text-white shadow-purple-500/30'
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  title="Add Caption"
                >
                  <Type className="w-5 h-5" />
                </button>

                {/* Drawing Tool */}
                <button
                  onClick={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}
                  className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                    activeTool === 'draw'
                      ? 'bg-batchit-purple border-batchit-purple text-white shadow-purple-500/30'
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  title="Drawing Brush"
                >
                  <Palette className="w-5 h-5" />
                </button>

                {/* Filters Tool */}
                <button
                  onClick={() => setActiveTool(activeTool === 'filter' ? null : 'filter')}
                  className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                    activeTool === 'filter'
                      ? 'bg-batchit-purple border-batchit-purple text-white shadow-purple-500/30'
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  title="Color Filters"
                >
                  <Sparkles className="w-5 h-5" />
                </button>

                {/* Timer / View Once */}
                <button
                  onClick={() => setActiveTool(activeTool === 'timer' ? null : 'timer')}
                  className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                    activeTool === 'timer'
                      ? 'bg-batchit-purple border-batchit-purple text-white shadow-purple-500/30'
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  title="Snap Duration"
                >
                  <Clock className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Active Tool Sub-Drawer */}
            {activeTool && (
              <div className="relative z-30 mx-4 my-2 p-3 bg-black/75 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in text-white">
                {/* Text Tool Drawer */}
                {activeTool === 'text' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      placeholder="Add a snap caption..."
                      autoFocus
                      className="w-full h-10 bg-white/10 border border-white/20 rounded-xl px-3 text-sm text-white placeholder-white/50 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setActiveTool(null)}
                        className="px-3 py-1 rounded-lg bg-batchit-purple text-xs font-bold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                {/* Draw Tool Drawer */}
                {activeTool === 'draw' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setDrawColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              drawColor === c ? 'border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={clearDrawing}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-rose-300"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Filters Drawer */}
                {activeTool === 'filter' && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border ${
                          selectedFilter === f.id
                            ? 'bg-batchit-purple border-batchit-purple text-white'
                            : 'bg-white/10 border-white/10 text-white/80'
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Timer Drawer */}
                {activeTool === 'timer' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">View Once Mode</span>
                      <input
                        type="checkbox"
                        checked={viewOnce}
                        onChange={(e) => setViewOnce(e.target.checked)}
                        className="w-4 h-4 accent-batchit-purple"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, 10].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setSnapDuration(sec)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border ${
                            snapDuration === sec
                              ? 'bg-batchit-purple border-batchit-purple text-white'
                              : 'bg-white/10 border-white/10 text-white/80'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Studio Bottom Bar: Save & Send */}
            <div className="relative z-30 pb-10 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveToMemories(false)}
                  className="px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => handleSaveToMemories(true)}
                  className="px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 active:scale-95"
                  title="Save directly into Private Vault"
                >
                  <span>🔒 Vault</span>
                </button>
              </div>

              <button
                onClick={openRecipientDialog}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-sm shadow-xl shadow-purple-500/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>Send To</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Select Recipients Dialog */}
      {showRecipientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-batchit-card border border-batchit-border rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-batchit-border">
              <h3 className="text-base font-bold text-white">Send Snap To</h3>
              <button
                onClick={() => setShowRecipientModal(false)}
                className="text-batchit-textSecondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-4 pr-1">
              {friends.length === 0 ? (
                <p className="text-xs text-center text-batchit-textSecondary py-6">
                  No friends found yet. Add friends first to exchange snaps!
                </p>
              ) : (
                friends.map((f) => {
                  const isSelected = selectedFriends.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFriends((prev) =>
                          prev.includes(f.id) ? prev.filter((id) => id !== f.id) : [...prev, f.id]
                        );
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

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isSelected ? 'bg-batchit-purple border-batchit-purple text-white' : 'border-batchit-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={handleSendSnap}
              disabled={selectedFriends.length === 0 || sending}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Snap ({selectedFriends.length})</span>
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

export default CameraPage;
