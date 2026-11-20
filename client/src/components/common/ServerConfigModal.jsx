import React, { useState } from 'react';
import { X, Server, Wifi, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { setCustomServerUrl } from '../../services/api';

const ServerConfigModal = ({ isOpen, onClose, currentUrl, onServerUpdated }) => {
  const [urlInput, setUrlInput] = useState(currentUrl || 'http://10.98.125.78:5000');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  if (!isOpen) return null;

  const presets = [
    { label: 'Wi-Fi IP', url: 'http://10.98.125.78:5000' },
    { label: 'Mobile Hotspot', url: 'http://192.168.43.1:5000' },
    { label: 'Localhost', url: 'http://127.0.0.1:5000' }
  ];

  const handleTestConnection = async (targetUrl = urlInput) => {
    setTesting(true);
    setTestResult(null);

    let clean = (targetUrl || '').trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    const pingEndpoint = clean.endsWith('/api') ? `${clean}/auth/me` : `${clean}/api/auth/me`;

    try {
      const res = await axios.get(pingEndpoint, { timeout: 4000 });
      setTestResult({ success: true, message: 'Server Connected Successfully! (HTTP 200)' });
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 200)) {
        setTestResult({ success: true, message: 'Server Online & Responding! 🟢' });
      } else {
        setTestResult({
          success: false,
          message: 'Connection Failed 🔴. Make sure laptop and phone are on the same Wi-Fi or Mobile Hotspot.'
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    let clean = urlInput.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    setCustomServerUrl(clean);
    onServerUpdated(clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-batchit-card border border-batchit-border w-full max-w-md max-h-[92vh] overflow-y-auto smooth-scroll rounded-3xl p-5 sm:p-6 shadow-2xl relative text-batchit-textPrimary">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-batchit-textSecondary hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-batchit-purple/20 border border-batchit-purple/40 flex items-center justify-center text-batchit-purple">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Server Connection</h3>
            <p className="text-xs text-batchit-textSecondary">Connect app to your laptop backend</p>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-batchit-textSecondary mb-2">
            Quick IP Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setUrlInput(p.url);
                  handleTestConnection(p.url);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  urlInput === p.url
                    ? 'bg-batchit-purple text-white border-batchit-purple shadow-sm'
                    : 'bg-batchit-bg/80 text-batchit-textSecondary border-batchit-border hover:border-batchit-purple/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-batchit-textSecondary mb-1.5">
            Server IP / URL
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setTestResult(null);
            }}
            placeholder="http://10.98.125.78:5000"
            className="w-full bg-batchit-bg border border-batchit-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-batchit-purple transition-all font-mono"
          />
        </div>

        {/* Test Result Box */}
        {testResult && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Helpful Tip */}
        <div className="mb-5 p-3 rounded-xl bg-batchit-purple/5 border border-batchit-purple/20 text-[11px] text-batchit-textSecondary space-y-1">
          <p className="font-semibold text-batchit-purple flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" /> Connection Guide:
          </p>
          <p>• Make sure Laptop and Phone are on the <b>SAME Wi-Fi</b> or <b>Mobile Hotspot</b>.</p>
          <p>• On Laptop, keep <b>Start-BatchiT-Server.bat</b> running.</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleTestConnection()}
            disabled={testing}
            className="flex-1 py-2.5 px-4 rounded-xl bg-batchit-bg border border-batchit-border hover:border-batchit-purple/50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-batchit-purple" />
                Testing...
              </>
            ) : (
              'Test Ping'
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-batchit-purple to-batchit-pink text-white font-bold text-xs shadow-md shadow-batchit-purple/20 hover:opacity-95 transition-opacity"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerConfigModal;
