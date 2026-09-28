import React, { useCallback, useEffect, useState } from 'react';
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

  const expectedPin = String(profile.pinCode || '').replace(/[^0-9]/g, '').slice(0, 4);

  const handleDigit = useCallback(
    (digit: string) => {
      if (errorShake) return;
      setEnteredPin((prev) => {
        if (prev.length >= 4) return prev;
        return prev + digit;
      });
    },
    [errorShake]
  );

  const handleBackspace = useCallback(() => {
    setErrorShake(false);
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    if (enteredPin.length === 4) {
      if (!expectedPin || enteredPin === expectedPin) {
        const t = setTimeout(() => {
          onUnlock();
        }, 100);
        return () => clearTimeout(t);
      } else {
        setErrorShake(true);
        const t = setTimeout(() => {
          setEnteredPin('');
          setErrorShake(false);
        }, 550);
        return () => clearTimeout(t);
      }
    }
  }, [enteredPin, expectedPin, onUnlock]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEnteredPin('');
        setErrorShake(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleBackspace]);

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

        {/* 4 PIN Boxes */}
        <div
          className={`flex items-center justify-center gap-3 my-1 ${
            errorShake ? 'animate-bounce' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display text-[20px] font-extrabold transition-all duration-150 ${
                  errorShake
                    ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-500 scale-105'
                    : filled
                    ? 'bg-[#635bff] text-white border-2 border-[#635bff] scale-105 shadow-[0_6px_14px_rgba(99,91,255,0.4)]'
                    : isDark
                    ? 'bg-[#12161f] border-2 border-white/15 text-slate-400'
                    : 'bg-[#f0f4f8] border-2 border-slate-300/70 text-[#171c1f]'
                }`}
              >
                {filled ? '•' : ''}
              </div>
            );
          })}
        </div>

        {errorShake && (
          <span className="font-display text-[12px] font-bold text-rose-500">
            PIN incorrecto. Intenta nuevamente.
          </span>
        )}

        {/* Keypad */}
        <div
          className={`w-full rounded-2xl p-3 grid grid-cols-3 gap-2.5 ${
            isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
          }`}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'BACK') handleBackspace();
                else if (k === 'CLEAR') {
                  setEnteredPin('');
                  setErrorShake(false);
                } else handleDigit(k);
              }}
              className={`h-13 rounded-2xl font-display text-[20px] font-extrabold flex items-center justify-center transition-all ${keyBtnCls}`}
            >
              {k === 'BACK' ? (
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              ) : k === 'CLEAR' ? (
                <span className="text-[12px] font-bold opacity-70">Limpiar</span>
              ) : (
                k
              )}
            </button>
          ))}
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
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-100'
                : 'bg-[#ffdadc] border-rose-300 text-[#7a0016]'
            }`}
          >
            <p className="text-[11.5px] leading-relaxed font-semibold">
              <strong>Atención:</strong> Al restablecer la aplicación se borrarán todos los datos,
              metas y movimientos guardados en este dispositivo para poder entrar de nuevo.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#e11d48] text-white font-display text-[11.5px] font-extrabold"
              >
                Sí, restablecer todo
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className={`py-2.5 px-3 rounded-xl font-display text-[11.5px] font-bold ${
                  isDark ? 'bg-[#12161f] text-slate-200' : 'bg-white text-[#171c1f]'
                }`}
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
