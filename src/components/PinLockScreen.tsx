import React, { useState } from 'react';
import { UserProfile } from '../types/wallet';
import { UserClayAvatar, WalletClayLogo } from './ClayAvatar';

interface PinLockScreenProps {
  profile: UserProfile;
  isDark: boolean;
  onUnlock: () => void;
  onResetApp: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  profile,
  isDark,
  onUnlock,
  onResetApp,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);

    if (next.length === 4) {
      if (next === profile.pinCode) {
        setTimeout(() => {
          onUnlock();
        }, 120);
      } else {
        setErrorShake(true);
        setTimeout(() => {
          setEnteredPin('');
          setErrorShake(false);
        }, 480);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const keyBtnCls = isDark
    ? 'bg-[#242b3a] text-white shadow-[0_6px_12px_rgba(0,0,0,0.35),inset_1px_2px_3px_rgba(255,255,255,0.08)] active:scale-95'
    : 'bg-white text-[#171c1f] shadow-[0_8px_16px_-4px_rgba(15,23,42,0.08),inset_2px_2px_4px_rgba(255,255,255,0.95)] active:scale-95';

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 transition-colors ${
        isDark ? 'dark bg-[#12161f] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
      }`}
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-6 flex flex-col items-center text-center gap-5 ${
          isDark
            ? 'bg-[#1b202c] shadow-[0_20px_40px_rgba(0,0,0,0.55),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
            : 'bg-white shadow-[0_20px_40px_-8px_rgba(99,91,255,0.16),inset_3px_3px_6px_rgba(255,255,255,0.9)]'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          {profile.name ? (
            <UserClayAvatar profile={profile} sizeClass="w-16 h-16" showBadge={false} />
          ) : (
            <WalletClayLogo size="sm" />
          )}
          <h2 className="font-display text-[20px] font-extrabold mt-1">
            {profile.name ? `Hola, ${profile.name}` : 'Billetera Protegida'}
          </h2>
          <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
            Ingresa tu PIN de 4 dígitos para desbloquear FlickWallet
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className={`flex items-center justify-center gap-4 my-1 ${errorShake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  errorShake
                    ? 'bg-rose-500 scale-110'
                    : filled
                    ? 'bg-[#635bff] scale-110 shadow-[0_0_10px_rgba(99,91,255,0.65)]'
                    : isDark
                    ? 'bg-[#12161f] border border-white/15'
                    : 'bg-[#e4e9ed]'
                }`}
              />
            );
          })}
        </div>

        {errorShake && (
          <span className="font-display text-[12px] font-bold text-rose-500">
            PIN incorrecto. Intenta de nuevo.
          </span>
        )}

        {/* Keypad */}
        <div
          className={`w-full rounded-2xl p-3 grid grid-cols-3 gap-2.5 ${
            isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
          }`}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'BACK'].map((k, i) => {
            if (k === '') return <div key={i} />;
            return (
              <button
                key={k}
                type="button"
                onClick={() => (k === 'BACK' ? handleBackspace() : handleDigit(k))}
                className={`h-13 rounded-2xl font-display text-[20px] font-extrabold flex items-center justify-center transition-all ${keyBtnCls}`}
              >
                {k === 'BACK' ? (
                  <span className="material-symbols-outlined text-[20px]">backspace</span>
                ) : (
                  k
                )}
              </button>
            );
          })}
        </div>

        {/* Forgot PIN -> Reset App */}
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="font-display text-[12px] font-bold text-rose-500 hover:underline pt-1"
          >
            ¿Olvidaste tu PIN? Restablecer aplicación
          </button>
        ) : (
          <div
            className={`w-full p-3.5 rounded-2xl flex flex-col gap-2.5 text-left border ${
              isDark
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                : 'bg-[#ffdad6]/70 border-rose-300 text-[#93000a]'
            }`}
          >
            <p className="text-[11px] leading-relaxed font-semibold">
              <strong>Atención:</strong> Al restablecer la aplicación se borrarán todos los datos,
              metas y movimientos guardados en este dispositivo para poder entrar de nuevo.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetApp}
                className="flex-1 py-2 px-3 rounded-xl bg-[#ba1a1a] text-white font-display text-[11px] font-bold"
              >
                Sí, restablecer todo
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="py-2 px-3 rounded-xl bg-black/10 dark:bg-white/10 font-display text-[11px] font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
