import React from 'react';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { useCameraStore } from './cameraStore';

export const PermissionCard: React.FC = () => {
  const { permissionStatus, errorMessage, startCamera } = useCameraStore();

  const handleRequestCamera = () => {
    startCamera();
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-slate-900/60 rounded-xl border border-red-500/20 m-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-500/5">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">Camera Access Blocked</h3>
        <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
          {errorMessage || 'Stylera needs camera access to superimpose clothes in real time.'}
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-left text-xs text-slate-300 mb-5 max-w-sm space-y-1.5">
          <div className="font-semibold text-pink-400">How to unblock:</div>
          <div>1. Click the <strong>lock / site settings icon</strong> in Chrome's address bar.</div>
          <div>2. Set <strong>Camera</strong> to <strong>Allow</strong>.</div>
          <div>3. Click "Retry Camera" below.</div>
        </div>

        <button
          onClick={handleRequestCamera}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs shadow-md shadow-pink-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Camera</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full bg-slate-900/40 rounded-xl border border-slate-800/80 m-4">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/20">
          <Camera className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-slate-950" title="100% On-Device Privacy">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2">Enable Real-Time Try-On</h3>
      <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
        Stylera superimposes fashion items onto your webcam stream in real time.
      </p>

      {/* Privacy guarantee highlight */}
      <div className="flex items-start gap-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-lg p-3 text-left text-xs text-emerald-300 mb-6 max-w-sm">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-emerald-200">100% Private & On-Device</span>
          Your video never leaves this device or gets uploaded to any server. Everything runs locally in WebGL.
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mb-4 max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        onClick={handleRequestCamera}
        disabled={permissionStatus === 'requesting'}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-pink-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {permissionStatus === 'requesting' ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Requesting Access...</span>
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            <span>Enable Camera</span>
          </>
        )}
      </button>
    </div>
  );
};
