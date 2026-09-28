import React, { useRef, useState } from 'react';
import {
  CURRENCIES,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import { CurrencyCode, UserProfile } from '../types/wallet';
import { UserClayAvatar } from './ClayAvatar';

interface VaultSettingsViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const VaultSettingsView: React.FC<VaultSettingsViewProps> = ({
  profile,
  onUpdateProfile,
  isDark,
  onToggleDark,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [customUrlInput, setCustomUrlInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [incomeRaw, setIncomeRaw] = useState(
    profile.monthlyIncome && profile.monthlyIncome > 0 ? String(profile.monthlyIncome) : ''
  );
  const [hormigaLimitRaw, setHormigaLimitRaw] = useState(
    profile.hormigaLimit && profile.hormigaLimit > 0 ? String(profile.hormigaLimit) : ''
  );

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Handle Custom Photo Upload from device
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
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Perfil de Usuario, Foto Personalizada y Moneda */}
      <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardCls}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#493ee5] dark:text-[#c3c0ff]">
              Mi Perfil
            </span>
            <h2 className="font-display text-[18px] font-extrabold">Foto Personalizada y Moneda</h2>
          </div>
          <button
            type="button"
            onClick={onToggleDark}
            className={`px-3 py-1.5 rounded-full font-display text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDark ? 'bg-[#635bff] text-white' : 'bg-[#f0f4f8] text-[#171c1f]'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
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
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
            <span>Subir Foto Personalizada desde mi Dispositivo</span>
          </button>

          {/* Optional Custom Image URL Input */}
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
            Moneda Principal de tu Billetera
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

      {/* 2. Presupuesto Mensual y Tope de Gastos Hormiga */}
      <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardCls}`}>
        <div>
          <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#006b5f] dark:text-[#62fae3]">
            Presupuesto y Límites
          </span>
          <h3 className="font-display text-[17px] font-extrabold">
            Ingreso Mensual y Tope Hormiga
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[12px] font-bold" htmlFor="settings-monthly-income">
            Ingreso Mensual Estimado ({curr.code})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] font-bold text-slate-400">
              {curr.symbol}
            </span>
            <input
              id="settings-monthly-income"
              type="text"
              inputMode="decimal"
              value={formatLiveNumberString(incomeRaw, curr.code)}
              onChange={(e) => {
                const canonical = parseTypedCurrencyInput(e.target.value, curr.code);
                setIncomeRaw(canonical);
                const val = parseFloat(canonical);
                onUpdateProfile({ monthlyIncome: !isNaN(val) && val >= 0 ? val : 0 });
              }}
              placeholder="0"
              className={`w-full h-12 pl-10 pr-4 rounded-2xl font-display text-[15px] font-bold tabular-nums focus:outline-none ${inputWell}`}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-display text-[12px] font-bold" htmlFor="settings-hormiga-limit">
            Tope Mensual de Gastos Hormiga 🐜 ({curr.code})
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
              placeholder="Ej. 150.000"
              className={`w-full h-12 pl-10 pr-4 rounded-2xl font-display text-[15px] font-bold tabular-nums focus:outline-none ${inputWell}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
