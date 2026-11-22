import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, X, Minimize2, Maximize2, HelpCircle } from 'lucide-react';
import { APP_CONFIG } from '../shared/constants';
import { useCameraStore } from './camera/cameraStore';
import { PermissionCard } from './camera/PermissionCard';
import { CameraViewport } from './camera/CameraViewport';
import { DropZone } from './ui/DropZone';
import { OutfitTray } from './ui/OutfitTray';
import { useGarmentStore } from './garments/garmentStore';
import { OnboardingModal } from './ui/OnboardingModal';

export const App: React.FC = () => {
  const { stream, permissionStatus, stopCamera } = useCameraStore();
  const { items, ingestItemFromUrl } = useGarmentStore();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('stylera_onboarding_completed');
  });

  const handleCompleteOnboarding = () => {
    localStorage.setItem('stylera_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  // Notify parent window when modal is closed
  const handleClose = () => {
    stopCamera();
    window.parent.postMessage({ type: 'STYLERIA_CLOSE_MODAL' }, '*');
  };

  const handleToggleMinimize = () => {
    const nextMinimized = !isMinimized;
    setIsMinimized(nextMinimized);
    window.parent.postMessage({ type: 'STYLERIA_TOGGLE_MINIMIZE', minimized: nextMinimized }, '*');
  };

  // Listen for parent messages (context menu, hover button, drag & drop)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STYLERIA_PARENT_CLOSED') {
        stopCamera();
      } else if (event.data?.type === 'INGEST_IMAGE_URL') {
        const payload = event.data.payload || { imageUrl: event.data.url };
        if (payload?.imageUrl) {
          ingestItemFromUrl(payload);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [stopCamera, ingestItemFromUrl]);

  return (
    <div className={`flex flex-col h-screen w-full bg-slate-950 text-slate-100 relative ${isMinimized ? 'overflow-hidden' : ''}`}>
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 border-b border-slate-800 select-none z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
            {APP_CONFIG.appName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium">
            v{APP_CONFIG.version}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Privacy badge */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium"
            title={APP_CONFIG.badgeText}
          >
            <ShieldCheck className="w-3 h-3" />
            <span className="hidden sm:inline">On-Device</span>
          </div>

          {/* Help / Tutorial button */}
          <button
            onClick={() => setShowOnboarding(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="How to use Stylera"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Maximize toggle */}
          <button
            onClick={handleToggleMinimize}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Stylera"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {!isMinimized && (
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {stream && permissionStatus === 'granted' ? (
            <DropZone>
              <CameraViewport>
                {/* Outfit Tray Controller */}
                <OutfitTray />
              </CameraViewport>
            </DropZone>
          ) : (
            <PermissionCard />
          )}
        </main>
      )}

      {/* Footer Info */}
      <footer className="px-3 py-1 bg-slate-900/80 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          {stream ? `${items.length} item${items.length === 1 ? '' : 's'} loaded` : 'Ready'}
        </span>
        <span className="truncate">{APP_CONFIG.badgeText}</span>
      </footer>

      {/* Onboarding Tutorial Modal */}
      {showOnboarding && <OnboardingModal onComplete={handleCompleteOnboarding} />}
    </div>
  );
};
