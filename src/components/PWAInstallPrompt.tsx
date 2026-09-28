import React, { useEffect, useState } from 'react';
import { WalletClayLogo } from './ClayAvatar';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

interface PWAEntryPromptProps {
  isDark: boolean;
  onInstalledOrDismissed?: () => void;
}

export const PWAEntryPrompt: React.FC<PWAEntryPromptProps> = ({
  isDark,
  onInstalledOrDismissed,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('flickwallet_pwa_prompt_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [showManualSteps, setShowManualSteps] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('flickwallet_pwa_prompt_dismissed', 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
    onInstalledOrDismissed?.();
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        handleDismiss();
      }
    } else {
      setShowManualSteps(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 flex flex-col gap-4 transition-all ${
          isDark
            ? 'bg-[#1b202c] text-slate-100 border border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.65)]'
            : 'bg-white text-[#171c1f] shadow-[0_24px_48px_rgba(99,91,255,0.28),inset_3px_3px_6px_rgba(255,255,255,0.9)]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <WalletClayLogo size="sm" />
            <div>
              <span className="font-display text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#62fae3] text-[#00201c]">
                App Nativa Móvil & PC
              </span>
              <h3 className="font-display text-[17px] font-extrabold leading-snug mt-1">
                Para mejor experiencia, instalar como app nativa
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className={`text-[13px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#464555]'}`}>
          Instala <strong>FlickWallet</strong> en tu pantalla de inicio para abrirla al instante a
          pantalla completa, usarla sin conexión y recibir recordatorios de tus pagos y deudas del
          mes.
        </p>

        {showManualSteps && (
          <div
            className={`p-3.5 rounded-2xl text-[12px] flex flex-col gap-1.5 ${
              isDark ? 'bg-[#12161f] text-slate-200' : 'bg-[#f0f4f8] text-[#171c1f]'
            }`}
          >
            <span className="font-display font-bold text-[#493ee5] dark:text-[#c3c0ff]">
              {isIOS ? 'Cómo instalar en iPhone / iPad:' : 'Cómo instalar desde tu navegador:'}
            </span>
            {isIOS ? (
              <>
                <span>1. Toca el botón <strong>Compartir</strong> en la barra de Safari.</span>
                <span>2. Desliza y selecciona <strong>&ldquo;Agregar a Inicio&rdquo;</strong>.</span>
              </>
            ) : (
              <>
                <span>1. Abre el menú de tu navegador (⋮ arriba a la derecha).</span>
                <span>2. Toca <strong>&ldquo;Instalar aplicación&rdquo;</strong> o <strong>&ldquo;Agregar a pantalla principal&rdquo;</strong>.</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-[#635bff] text-white font-display text-[13px] font-bold flex items-center justify-center gap-2 shadow-[0_12px_24px_-4px_rgba(99,91,255,0.45),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
            <span>{showManualSteps ? 'Entendido' : 'Instalar App Nativa'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className={`py-3.5 px-4 rounded-2xl font-display text-[12px] font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-[#12161f] text-slate-300 hover:bg-slate-800'
                : 'bg-[#f0f4f8] text-[#464555] hover:bg-[#e4e9ed]'
            }`}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
};

export const PWAInstallHeaderButton: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showTip, setShowTip] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowTip(true);
          }
        }}
        title="Instalar como App Nativa"
        className={`h-9 px-3 rounded-full font-display text-[11px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 ${
          isDark
            ? 'bg-[#635bff]/25 text-[#62fae3] border border-[#635bff]/40'
            : 'bg-[#e2dfff] text-[#321ed2] shadow-2xs'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">install_mobile</span>
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      {showTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 flex flex-col gap-3 ${
              isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
            }`}
          >
            <h4 className="font-display text-[16px] font-extrabold">
              Instalar FlickWallet como App Nativa
            </h4>
            <p className={`text-[13px] ${isDark ? 'text-slate-300' : 'text-[#464555]'}`}>
              {isIOS
                ? 'En Safari toca el icono Compartir y elige "Agregar a Inicio" para instalarla como app nativa.'
                : 'Abre el menú del navegador (⋮) y selecciona "Instalar aplicación" o "Agregar a pantalla principal".'}
            </p>
            <button
              type="button"
              onClick={() => setShowTip(false)}
              className="mt-1 w-full py-2.5 rounded-2xl bg-[#635bff] text-white font-display text-[13px] font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
