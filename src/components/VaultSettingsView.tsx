import React, { useRef, useState } from 'react';
import {
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import { ActiveTab, CurrencyCode, PaymentReminder, UserProfile } from '../types/wallet';
import { AppIcon } from './AntIcon';
import { UserClayAvatar } from './ClayAvatar';
import { usePWAInstall } from './PWAInstallPrompt';

interface VaultSettingsViewProps {
  profile: UserProfile;
  reminders: PaymentReminder[];
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<boolean>;
  onResetAllApp: () => void;
  onTriggerNotification: (opts: {
    title: string;
    body: string;
    emoji: string;
    accent?: 'indigo' | 'mint' | 'rose' | 'amber';
    actionTab?: ActiveTab;
    actionLabel?: string;
  }) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const VaultSettingsView: React.FC<VaultSettingsViewProps> = ({
  profile,
  reminders,
  onUpdateProfile,
  onExportBackup,
  onImportBackup,
  onResetAllApp,
  onTriggerNotification,
  isDark,
  onToggleDark,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const [customUrlInput, setCustomUrlInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [incomeRaw, setIncomeRaw] = useState(
    profile.monthlyIncome && profile.monthlyIncome > 0 ? String(profile.monthlyIncome) : ''
  );
  const [hormigaLimitRaw, setHormigaLimitRaw] = useState(
    profile.hormigaLimit && profile.hormigaLimit > 0 ? String(profile.hormigaLimit) : ''
  );

  const [pinInput, setPinInput] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [acceptedPinWarning, setAcceptedPinWarning] = useState(false);
  const [pinValidationError, setPinValidationError] = useState<string | null>(null);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const fmt = (val: number) => formatCurrencyAmount(val, curr.code);
  const notificationsEnabled = profile.notificationsEnabled !== false;
  const notificationSound = profile.notificationSound !== false;
  const dailyReminder9pm = profile.dailyReminder9pm !== false;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    onUpdateProfile({ notificationsEnabled: next });

    if (next && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }
  };

  const handleTestNativeNotification = async () => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // Ignore
      }
    }

    const firstReminder = reminders[0];
    if (firstReminder) {
      onTriggerNotification({
        title: `Pago próximo: ${firstReminder.title}`,
        body: `Vence el día ${firstReminder.dayOfMonth} · ${curr.symbol}${fmt(
          firstReminder.amount
        )} ${curr.code}`,
        emoji: 'event_repeat',
        actionTab: 'pagos',
      });
    } else {
      onTriggerNotification({
        title: 'Notificación de prueba activa',
        body: `Tus alertas de pagos y alcancías están listas en ${curr.code}.`,
        emoji: 'notifications_active',
        actionTab: 'pagos',
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 320;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxSize) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
          onUpdateProfile({
            customAvatarImg: dataUrl,
            useCustomAvatar: true,
          });
          showToast('¡Foto personalizada actualizada en tu perfil!');
        }
      };
      if (typeof ev.target?.result === 'string') {
        img.src = ev.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    onUpdateProfile({
      customAvatarImg: customUrlInput.trim(),
      useCustomAvatar: true,
    });
    setCustomUrlInput('');
    showToast('¡Foto personalizada aplicada al perfil!');
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPin = pinInput.replace(/[^0-9]/g, '').slice(0, 4);
    if (cleanedPin.length !== 4) {
      setPinValidationError('Debes escribir un PIN numérico de exactamente 4 dígitos.');
      const el = document.getElementById('pin-in');
      el?.focus();
      return;
    }
    if (!acceptedPinWarning) {
      setPinValidationError('Marca la casilla de confirmación para activar tu PIN.');
      return;
    }
    setPinValidationError(null);
    onUpdateProfile({ pinCode: cleanedPin });
    setPinInput('');
    setAcceptedPinWarning(false);
    showToast('PIN de 4 dígitos activado correctamente.');
  };

  const handleRemovePin = () => {
    onUpdateProfile({ pinCode: '' });
    setPinValidationError(null);
    showToast('PIN de bloqueo desactivado.');
  };

  const handleBackupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await onImportBackup(file);
    if (ok) {
      showToast('Copia de seguridad restaurada correctamente.');
    } else {
      showToast('Archivo inválido. Selecciona un respaldo .json de FlickWallet.');
    }
    e.target.value = '';
  };

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  const inputWell = isDark
    ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.55)]'
    : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]';

  return (
    <div className="flex flex-col gap-5 pb-8">
      {statusMessage && (
        <div className="rounded-2xl p-3.5 bg-[#62fae3] text-[#00201c] font-display text-[12px] font-bold flex items-center gap-2 shadow-md">
          <AppIcon name="check_circle" size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start gap-5">
        {/* Columna Izquierda (7 cols): Perfil, Apariencia y Moneda */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 ${cardCls}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="font-display text-[18px] font-extrabold">
                Perfil, Apariencia y Moneda
              </h2>

              <div className="flex items-center gap-2">
                {!isInstalled && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isInstallable) {
                        await install();
                      } else {
                        showToast(
                          isIOS
                            ? 'En Safari toca Compartir → Agregar a Inicio'
                            : 'Abre el menú del navegador (⋮) → Instalar aplicación'
                        );
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#62fae3] text-[#00201c] font-display text-[11px] font-extrabold flex items-center gap-1 shadow-2xs"
                  >
                    <AppIcon name="install_mobile" size={15} />
                    <span>Instalar App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onToggleDark}
                  className={`px-3.5 py-1.5 rounded-full font-display text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isDark
                      ? 'bg-[#635bff] text-white'
                      : 'bg-[#f0f4f8] text-[#171c1f] shadow-2xs'
                  }`}
                >
                  <AppIcon name={isDark ? 'light_mode' : 'dark_mode'} size={15} />
                  <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
              </div>
            </div>

            {/* Live Profile Preview Box */}
            <div
              className={`p-4 rounded-2xl flex items-center gap-4 ${
                isDark
                  ? 'bg-[#12161f]'
                  : 'bg-[#f0f4f8] shadow-[inset_1px_1px_3px_rgba(15,23,42,0.06),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]'
              }`}
            >
              <UserClayAvatar profile={profile} sizeClass="w-20 h-20" showBadge={false} />
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <span className="font-display text-[17px] font-extrabold truncate">
                  {profile.name || 'Usuario'}
                </span>
                <span className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                  {profile.useCustomAvatar && profile.customAvatarImg
                    ? 'Foto personalizada activa'
                    : 'Avatar predeterminado activo'}
                </span>
                {profile.useCustomAvatar && profile.customAvatarImg && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateProfile({ useCustomAvatar: false });
                      showToast('Se restauró tu avatar predeterminado.');
                    }}
                    className="text-left font-display text-[11px] font-bold text-[#493ee5] dark:text-[#c3c0ff] hover:underline mt-0.5"
                  >
                    Restaurar avatar predeterminado
                  </button>
                )}
              </div>
            </div>

            {/* Upload Custom Photo Button */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#635bff] text-white font-display text-[13px] font-bold flex items-center justify-center gap-2 shadow-[0_12px_24px_-4px_rgba(99,91,255,0.4),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:scale-95 transition-all"
              >
                <AppIcon name="add_a_photo" size={18} />
                <span>Subir Foto Personalizada desde mi Dispositivo</span>
              </button>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="O pega la URL de una foto personalizada..."
                  className={`flex-1 h-10 px-3.5 rounded-xl text-[12px] focus:outline-none ${
                    isDark
                      ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500'
                      : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587]'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className={`h-10 px-3.5 rounded-xl font-display text-[11px] font-bold transition-all active:scale-95 ${
                    isDark
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-[#e2dfff] text-[#493ee5]'
                  }`}
                >
                  Usar URL
                </button>
              </div>
            </div>

            {/* Selector de Moneda Principal */}
            <div className="pt-1">
              <span className="font-display text-[12px] font-bold block mb-2">
                Moneda Principal
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                  const item = CURRENCIES[code];
                  const active = (profile.currency || 'USD') === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        onUpdateProfile({ currency: code });
                        showToast(`Moneda cambiada a ${item.name}`);
                      }}
                      className={`py-2 px-2 rounded-2xl font-display text-[11px] font-bold flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                        active
                          ? 'border-[#635bff] bg-[#e2dfff]/50 text-[#0f0069] dark:bg-[#635bff]/25 dark:text-white'
                          : isDark
                          ? 'border-transparent bg-[#12161f] text-slate-400'
                          : 'border-transparent bg-[#f0f4f8] text-[#464555]'
                      }`}
                    >
                      <span className="text-[13px] font-extrabold">{item.symbol}</span>
                      <span>{item.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (5 cols): Notificaciones (Limpio) + Presupuesto + PIN */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Notificaciones (Compacto y Sin Texto Innecesario) */}
          <div className={`rounded-3xl p-5 flex flex-col gap-3 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#e2dfff] text-[#321ed2] flex items-center justify-center">
                  <AppIcon name="notifications" size={19} />
                </div>
                <h3 className="font-display text-[16px] font-extrabold">Notificaciones</h3>
              </div>

              <button
                type="button"
                onClick={handleTestNativeNotification}
                className="px-3 py-1.5 rounded-xl bg-[#635bff] text-white font-display text-[11px] font-bold active:scale-95 transition-transform"
              >
                Probar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                }`}
              >
                <span className="font-display text-[12px] font-bold">Alertas</span>
                <span
                  className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                    notificationsEnabled ? 'bg-[#635bff] justify-end' : 'bg-slate-400/50 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateProfile({ notificationSound: !notificationSound })}
                className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                }`}
              >
                <span className="font-display text-[12px] font-bold">Sonido</span>
                <span
                  className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                    notificationSound ? 'bg-[#006b5f] justify-end' : 'bg-slate-400/50 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                </span>
              </button>
            </div>

            {/* Recordatorio Diario 9:00 PM */}
            <button
              type="button"
              onClick={() => {
                const next = !dailyReminder9pm;
                onUpdateProfile({ dailyReminder9pm: next });
                showToast(
                  next
                    ? 'Recordatorio diario de las 9:00 PM activado.'
                    : 'Recordatorio diario de las 9:00 PM desactivado.'
                );
              }}
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all text-left ${
                isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AppIcon
                  name="schedule"
                  size={19}
                  className="text-[#635bff] dark:text-[#c3c0ff] shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-display text-[12.5px] font-extrabold block">
                    Recordatorio a las 9:00 PM
                  </span>
                  <span
                    className={`text-[11px] block truncate ${
                      isDark ? 'text-slate-400' : 'text-[#464555]'
                    }`}
                  >
                    Aviso diario para registrar tus gastos del día
                  </span>
                </div>
              </div>
              <span
                className={`w-9 h-5 rounded-full p-0.5 flex items-center shrink-0 transition-colors ${
                  dailyReminder9pm ? 'bg-[#635bff] justify-end' : 'bg-slate-400/50 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </span>
            </button>
          </div>

          {/* Presupuesto Mensual y Tope de Gastos Hormiga */}
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 ${cardCls}`}>
            <h3 className="font-display text-[16px] font-extrabold">
              Ingreso Mensual y Tope Hormiga
            </h3>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-display text-[12px] font-bold"
                htmlFor="settings-monthly-income"
              >
                Ingreso Mensual ({curr.code})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] font-bold text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="settings-monthly-income"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formatLiveNumberString(incomeRaw, curr.code)}
                  onChange={(e) => {
                    const canonical = parseTypedCurrencyInput(e.target.value, curr.code);
                    setIncomeRaw(canonical);
                    const val = parseFloat(canonical);
                    if (!isNaN(val) && val > 0) {
                      onUpdateProfile({ monthlyIncome: val });
                    }
                  }}
                  onBlur={() => {
                    const val = parseFloat(incomeRaw);
                    if (isNaN(val) || val <= 0) {
                      setIncomeRaw(String(profile.monthlyIncome || ''));
                      showToast('El ingreso mensual es obligatorio y debe ser mayor a 0.');
                    }
                  }}
                  placeholder="Ingresa tu ingreso mensual"
                  className={`w-full h-11 pl-10 pr-4 rounded-2xl font-display text-[15px] font-bold tabular-nums focus:outline-none ${inputWell}`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-display text-[12px] font-bold"
                htmlFor="settings-hormiga-limit"
              >
                Tope Gastos Hormiga ({curr.code})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] font-bold text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="settings-hormiga-limit"
                  type="text"
                  inputMode="decimal"
                  value={formatLiveNumberString(hormigaLimitRaw, curr.code)}
                  onChange={(e) => {
                    const canonical = parseTypedCurrencyInput(e.target.value, curr.code);
                    setHormigaLimitRaw(canonical);
                    const val = parseFloat(canonical);
                    onUpdateProfile({ hormigaLimit: !isNaN(val) && val >= 0 ? val : 0 });
                  }}
                  placeholder="0"
                  className={`w-full h-11 pl-10 pr-4 rounded-2xl font-display text-[15px] font-bold tabular-nums focus:outline-none ${inputWell}`}
                />
              </div>
            </div>
          </div>

          {/* Bloqueo por PIN de 4 Dígitos con Alerta de Restablecimiento */}
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#ffdadc] text-[#400010] flex items-center justify-center">
                  <AppIcon name="lock" size={19} />
                </div>
                <div>
                  <h3 className="font-display text-[16px] font-extrabold">PIN al Iniciar la App</h3>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                    {profile.pinCode
                      ? 'Activo · Se pide automáticamente al entrar'
                      : 'Desactivado'}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl flex items-start gap-2 border ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-[#fef9c3]/80 border-amber-300 text-[#854d0e]'
              }`}
            >
              <AppIcon name="warning" size={18} className="shrink-0 mt-0.5" />
              <p className="text-[11.5px] leading-relaxed font-medium">
                Si olvidas tu PIN <strong>se restablecerá la aplicación</strong> al no poder
                recuperarse.
              </p>
            </div>

            {profile.pinCode ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="font-display text-[12px] font-bold text-[#006b5f] dark:text-[#62fae3]">
                  PIN de 4 dígitos activo
                </span>
                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="px-3.5 py-2 rounded-xl bg-[#ffdadc] text-[#7a0016] font-display text-[11px] font-extrabold active:scale-95"
                >
                  Quitar PIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    id="pin-in"
                    type={showPinText ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      setPinInput(next);
                      if (next.length === 4) setPinValidationError(null);
                    }}
                    placeholder="Escribe 4 dígitos"
                    className={`w-full h-12 pl-4 pr-11 rounded-2xl font-display text-[15px] font-extrabold text-center focus:outline-none ${
                      pinValidationError ? 'ring-2 ring-rose-500' : ''
                    } ${inputWell}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinText((v) => !v)}
                    aria-label="Mostrar u ocultar PIN"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <AppIcon name={showPinText ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>

                <label className="flex items-start gap-2 cursor-pointer text-[11.5px]">
                  <input
                    type="checkbox"
                    checked={acceptedPinWarning}
                    onChange={(e) => {
                      setAcceptedPinWarning(e.target.checked);
                      if (e.target.checked) setPinValidationError(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded accent-[#635bff]"
                  />
                  <span className={isDark ? 'text-slate-300' : 'text-[#464555]'}>
                    Entiendo que si olvido mi PIN se restablecerá la app.
                  </span>
                </label>

                {pinValidationError && (
                  <div className="px-3 py-2 rounded-xl bg-[#ffdadc] text-[#7a0016] font-display text-[11px] font-bold flex items-center gap-1.5">
                    <AppIcon name="error" size={15} />
                    <span>{pinValidationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#635bff] text-white font-display text-[12.5px] font-extrabold shadow-sm active:scale-98 transition-all"
                >
                  Activar PIN
                </button>
              </form>
            )}
          </div>

          {/* Copia de Seguridad Local (Exportar e Importar Datos) */}
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-3.5 ${cardCls}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#62fae3]/40 text-[#006b5f] dark:text-[#62fae3] flex items-center justify-center">
                <AppIcon name="backup" size={19} />
              </div>
              <div>
                <h3 className="font-display text-[16px] font-extrabold">Copia de Seguridad</h3>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                  Descarga o restaura tus datos en este u otro dispositivo
                </span>
              </div>
            </div>

            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleBackupFileChange}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onExportBackup();
                  showToast('Respaldo descargado en tu dispositivo.');
                }}
                className="py-3 px-3.5 rounded-2xl bg-[#635bff] text-white font-display text-[12px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              >
                <AppIcon name="download" size={17} />
                <span>Descargar Respaldo</span>
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className={`py-3 px-3.5 rounded-2xl font-display text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  isDark
                    ? 'bg-[#12161f] text-slate-200 border border-white/10'
                    : 'bg-[#f0f4f8] text-[#171c1f]'
                }`}
              >
                <AppIcon name="upload_file" size={17} />
                <span>Restaurar Respaldo</span>
              </button>
            </div>
          </div>

          {/* Botón al final de Ajustes para Reiniciar Todo */}
          <div className={`rounded-3xl p-5 flex flex-col gap-3 ${cardCls}`}>
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className={`w-full py-3.5 px-4 rounded-2xl font-display text-[13px] font-extrabold flex items-center justify-center gap-2 transition-all active:scale-98 ${
                  isDark
                    ? 'bg-rose-500/25 text-rose-100 border border-rose-500/40'
                    : 'bg-[#ffdadc] text-[#7a0016] border border-[#f43f5e]/30'
                }`}
              >
                <AppIcon name="restart_alt" size={18} />
                <span>Reiniciar Todo</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-display text-[12px] font-bold text-center text-rose-500 dark:text-rose-300">
                  ¿Seguro que deseas borrar todos tus datos y reiniciar la app desde cero?
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(false)}
                    className={`py-2.5 rounded-xl font-display text-[12px] font-bold ${
                      isDark ? 'bg-[#12161f] text-slate-300' : 'bg-[#f0f4f8] text-[#464555]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={onResetAllApp}
                    className="py-2.5 rounded-xl bg-[#e11d48] text-white font-display text-[12px] font-extrabold active:scale-95"
                  >
                    Sí, reiniciar todo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
