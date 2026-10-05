import React from 'react';
import { ActiveTab, AppNotification } from '../types/wallet';
import { AppIcon } from './AntIcon';
import { WalletClayLogo } from './ClayAvatar';

const resolveNotifIcon = (val?: string) =>
  val && /^[a-z0-9_]+$/.test(val) ? val : 'notifications_active';

// Singleton Web Audio API Context (prevents browser 6-AudioContext limit & memory leaks)
let sharedAudioCtx: AudioContext | null = null;

export function playNotificationChime(enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    const ctx = sharedAudioCtx;

    const playTone = (freq: number, startTime: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    };

    const now = ctx.currentTime;
    playTone(783.99, now, 0.16, 0.11);
    playTone(1174.66, now + 0.08, 0.24, 0.09);
  } catch {
    // Ignore audio context restrictions
  }
}

// Trigger Native Browser / PWA Notification (ServiceWorker + Fallback)
export async function triggerNativeDeviceNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/notification-badge.png',
        });
        return true;
      }
    }
  } catch {
    // Fallback to standard Notification constructor
  }

  try {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
    });
    return true;
  } catch {
    return false;
  }
}

interface FloatingNotificationToastsProps {
  toasts: AppNotification[];
  isDark: boolean;
  onDismiss: (id: string) => void;
  onAction: (id: string, tab?: ActiveTab) => void;
}

export const FloatingNotificationToasts: React.FC<FloatingNotificationToastsProps> = ({
  toasts,
  isDark,
  onDismiss,
  onAction,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-2.5 left-1/2 -translate-x-1/2 w-[92vw] max-w-[340px] z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onAction(toast.id, toast.actionTab)}
          className={`pointer-events-auto cursor-pointer rounded-[20px] px-3.5 py-2.5 border backdrop-blur-xl transition-all duration-200 active:scale-98 pop-in ${
            isDark
              ? 'bg-[#1c212e]/95 border-white/12 text-slate-100 shadow-[0_14px_30px_rgba(0,0,0,0.55)]'
              : 'bg-white/95 border-slate-200/80 text-[#171c1f] shadow-[0_14px_30px_rgba(15,23,42,0.16)]'
          }`}
        >
          {/* Compact Native OS Notification Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <img
                src="/pwa-192x192.png"
                alt=""
                className="w-4 h-4 rounded-[5px] object-cover"
              />
              <span className="font-display text-[10px] font-bold uppercase tracking-wider opacity-70">
                FLICKWALLET
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] opacity-55">ahora</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(toast.id);
                }}
                aria-label="Cerrar"
                className="w-4 h-4 rounded-full flex items-center justify-center opacity-50 hover:opacity-100"
              >
                <AppIcon name="close" size={13} />
              </button>
            </div>
          </div>

          {/* Native Notification Content Row */}
          <div className="flex items-start gap-2.5">
            <div className="flex-1 min-w-0">
              <p className="font-display text-[12.5px] font-extrabold leading-snug">
                {toast.title}
              </p>
              <p
                className={`text-[11.5px] leading-snug line-clamp-2 mt-0.5 ${
                  isDark ? 'text-slate-300' : 'text-[#464555]'
                }`}
              >
                {toast.body}
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#e2dfff]/70 dark:bg-[#635bff]/25 text-[#493ee5] dark:text-[#c3c0ff] flex items-center justify-center shrink-0 mt-0.5">
              <AppIcon name={resolveNotifIcon(toast.emoji)} size={18} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface NotificationCenterDrawerProps {
  open: boolean;
  notifications: AppNotification[];
  isDark: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onSelectNotification: (n: AppNotification) => void;
  onOpenSettings: () => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  open,
  notifications,
  isDark,
  onClose,
  onClearAll,
  onSelectNotification,
  onOpenSettings,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div
        className={`w-full max-w-sm h-full flex flex-col justify-between p-5 overflow-y-auto shadow-2xl drawer-slide-in ${
          isDark ? 'bg-[#171c28] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <WalletClayLogo size="sm" />
              <div>
                <h3 className="font-display text-[15px] font-extrabold leading-none">
                  Notificaciones
                </h3>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                  {notifications.length} alertas
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-[#1b202c] text-slate-300' : 'bg-white text-[#171c1f] shadow-xs'
              }`}
            >
              <AppIcon name="close" size={17} />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div
              className={`rounded-3xl p-7 text-center flex flex-col items-center gap-2 my-6 ${
                isDark ? 'bg-[#1b202c]' : 'bg-white shadow-sm'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#e2dfff]/70 text-[#493ee5] flex items-center justify-center">
                <AppIcon name="notifications_none" size={24} />
              </div>
              <p className="font-display text-[14px] font-extrabold">Sin notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-[10px] font-bold uppercase tracking-wider opacity-65">
                  Recientes
                </span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="font-display text-[11px] font-bold text-[#635bff] dark:text-[#c3c0ff] hover:underline"
                >
                  Borrar
                </button>
              </div>

              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNotification(n)}
                  className={`w-full text-left rounded-2xl p-3 flex items-center gap-3 transition-all active:scale-98 ${
                    isDark
                      ? 'bg-[#1b202c] hover:bg-[#222836]'
                      : 'bg-white hover:bg-[#f0f4f8] shadow-xs'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#e2dfff]/70 dark:bg-[#635bff]/20 text-[#493ee5] dark:text-[#c3c0ff] flex items-center justify-center shrink-0">
                    <AppIcon name={resolveNotifIcon(n.emoji)} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-[12.5px] font-extrabold block truncate">
                      {n.title}
                    </span>
                    <p
                      className={`text-[11px] truncate ${
                        isDark ? 'text-slate-400' : 'text-[#464555]'
                      }`}
                    >
                      {n.body}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#635bff] text-white font-display text-[12px] font-bold flex items-center justify-center gap-1.5"
        >
          <AppIcon name="settings" size={16} />
          <span>Ajustes</span>
        </button>
      </div>
    </div>
  );
};
