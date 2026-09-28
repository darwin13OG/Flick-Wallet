import React, { useState } from 'react';
import {
  CURRENCIES,
  formatLiveNumberString,
  GENDER_DATA,
  ONBOARDING_GOALS,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import { CurrencyCode, GenderKey, UserProfile } from '../types/wallet';
import { WalletClayLogo } from './ClayAvatar';

interface OnboardingViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onComplete: () => void;
  isDark: boolean;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  profile,
  onUpdateProfile,
  onComplete,
  isDark,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(profile.name || '');
  const [incomeRaw, setIncomeRaw] = useState(
    profile.monthlyIncome && profile.monthlyIncome > 0
      ? String(profile.monthlyIncome)
      : ''
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    profile.goals?.length ? profile.goals : []
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const activeCurrency = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const formattedIncomeDisplay = formatLiveNumberString(incomeRaw, activeCurrency.code);

  const handleSelectGender = (genderKey: GenderKey) => {
    onUpdateProfile({
      gender: genderKey,
      avatarImg: GENDER_DATA[genderKey].img,
      useCustomAvatar: false,
    });
  };

  const toggleGoal = (goalId: string) => {
    const next = selectedGoals.includes(goalId)
      ? selectedGoals.filter((g) => g !== goalId)
      : [...selectedGoals, goalId];
    setSelectedGoals(next);
    onUpdateProfile({ goals: next });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
    });
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const parsedIncome = parseFloat(incomeRaw) || 0;
    onUpdateProfile({
      name: name.trim(),
      monthlyIncome: parsedIncome,
      goals: selectedGoals,
      configuredAt: new Date().toISOString(),
    });

    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onComplete();
      }, 500);
    }, 150);
  };

  const cardSurface = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-[#ffffff] text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  const inputWell = isDark
    ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.55)] focus:shadow-[inset_2px_2px_4px_rgba(99,91,255,0.35)]'
    : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] focus:shadow-[inset_2px_2px_4px_rgba(73,62,229,0.18),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]';

  return (
    <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:py-12 pb-10 flex flex-col lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center gap-6 max-w-md md:max-w-xl lg:max-w-5xl mx-auto w-full">
      {/* Left Column on PC / Top on Mobile: Hero + Step Indicator */}
      <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left gap-5">
        <div className="flex flex-col items-center lg:items-start pt-1">
          <WalletClayLogo size="lg" />
          <h2
            className={`font-display text-[24px] lg:text-[32px] leading-[32px] lg:leading-[40px] font-bold tracking-tight mb-1.5 ${
              isDark ? 'text-white' : 'text-[#171c1f]'
            }`}
          >
            Configura tu Billetera Viva
          </h2>
          <p
            className={`text-[14px] lg:text-[15px] leading-[20px] lg:leading-[24px] px-1 lg:px-0 ${
              isDark ? 'text-slate-400' : 'text-[#464555]'
            }`}
          >
            Sin contraseñas ni fricción. Personaliza tu experiencia en 30 segundos y guarda todo 100%
            privado en tu dispositivo.
          </p>
        </div>

        {/* Step Indicator Pill */}
        <div
          className={`w-full flex items-center justify-between px-4 py-2 rounded-full ${
            isDark
              ? 'bg-[#1b202c]'
              : 'bg-[#f0f4f8] shadow-[inset_1px_1px_3px_rgba(15,23,42,0.06),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#493ee5] shadow-[0_0_8px_rgba(99,91,255,0.6)]" />
            <span className="font-display text-[11px] font-extrabold text-[#493ee5] dark:text-[#c3c0ff] uppercase tracking-wider">
              Paso {step} de 2
            </span>
          </div>
          <span
            className={`font-display text-[11px] font-semibold ${
              isDark ? 'text-slate-400' : 'text-[#464555]'
            }`}
          >
            {step === 1 ? 'Datos Personales' : 'Presupuesto y Metas'}
          </span>
        </div>
      </div>

      {/* Right Column on PC / Bottom on Mobile: Step Forms */}
      <div className="lg:col-span-7 w-full">

      {/* PASO 1: Nombre y ¿Cómo te identificas? */}
      {step === 1 && (
        <form className="flex flex-col gap-6" onSubmit={handleNextStep}>
          {/* Input Card 1: Nombre */}
          <div className={`rounded-3xl p-6 flex flex-col gap-1.5 ${cardSurface}`}>
            <label
              className="font-display text-[12px] font-bold flex items-center justify-between"
              htmlFor="user-name"
            >
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-lg bg-[#e2dfff] text-[#493ee5] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[15px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    person
                  </span>
                </span>
                ¿Cómo te llamas?
              </span>
              <span className="font-display text-[10px] font-extrabold text-[#493ee5] dark:text-[#c3c0ff]">
                Obligatorio
              </span>
            </label>
            <div className="relative mt-1">
              <input
                id="user-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  onUpdateProfile({ name: e.target.value });
                }}
                placeholder="Escribe tu nombre..."
                className={`w-full h-13 py-3 px-4 rounded-2xl text-[16px] font-medium focus:outline-none transition-all duration-200 ${inputWell}`}
              />
              {name.trim().length > 0 && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#006b5f] dark:text-[#62fae3]">
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Input Card 2: ¿Cómo te identificas? (Sin caja de perfil) */}
          <div className={`rounded-3xl p-6 flex flex-col gap-4 ${cardSurface}`}>
            <label className="font-display text-[12px] font-bold flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-lg bg-[#e2dfff] text-[#493ee5] flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[15px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  face
                </span>
              </span>
              ¿Cómo te identificas?
            </label>

            <div className="grid grid-cols-3 gap-2.5" role="radiogroup">
              {(['hombre', 'mujer', 'otro'] as GenderKey[]).map((gKey) => {
                const item = GENDER_DATA[gKey];
                const isSelected = profile.gender === gKey;
                return (
                  <button
                    key={gKey}
                    type="button"
                    onClick={() => handleSelectGender(gKey)}
                    className={`group relative flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? isDark
                          ? 'border-[#635bff] bg-[#635bff]/20 shadow-[0_8px_16px_-4px_rgba(99,91,255,0.35)]'
                          : 'border-[#493ee5] bg-[#e2dfff]/40 shadow-[0_8px_16px_-4px_rgba(99,91,255,0.25),inset_2px_2px_4px_rgba(255,255,255,0.95)]'
                        : isDark
                        ? 'border-transparent bg-[#12161f] hover:bg-slate-800/70'
                        : 'border-transparent bg-[#f0f4f8] shadow-[0_4px_10px_rgba(15,23,42,0.04),inset_1px_1px_3px_rgba(255,255,255,0.9)] hover:bg-[#eaeef2]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className="font-display text-[13px] leading-tight font-bold">
                      {item.label}
                    </span>
                    <span
                      className={`font-display text-[10px] font-semibold mt-0.5 ${
                        isSelected
                          ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-[#464555]/70'
                      }`}
                    >
                      {isSelected ? 'Activo' : 'Elegir'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón Siguiente */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              type="submit"
              className="w-full h-15 py-4 px-8 rounded-full font-display text-[14px] font-bold tracking-wide text-white bg-[#635bff] shadow-[0_16px_32px_-6px_rgba(99,91,255,0.45),inset_2px_3px_5px_rgba(255,255,255,0.7),inset_-2px_-3px_5px_rgba(15,0,105,0.35)] active:translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <span>Siguiente</span>
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          </div>
        </form>
      )}

      {/* PASO 2: Moneda, Ingresos Mensuales y Cuestionario de Metas */}
      {step === 2 && (
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Input Card: Moneda e Ingresos Estimados */}
          <div className={`rounded-3xl p-6 flex flex-col gap-3 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <label
                className="font-display text-[12px] font-bold flex items-center gap-1.5"
                htmlFor="monthly-income"
              >
                <span className="w-6 h-6 rounded-lg bg-[#62fae3] text-[#00201c] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[15px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    payments
                  </span>
                </span>
                Ingresos Mensuales Estimados
              </label>

              {/* Selector de Moneda Principal */}
              <select
                aria-label="Seleccionar moneda"
                value={profile.currency || 'USD'}
                onChange={(e) =>
                  onUpdateProfile({ currency: e.target.value as CurrencyCode })
                }
                className={`font-display text-[11px] font-extrabold px-2.5 py-1 rounded-xl focus:outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#12161f] text-[#62fae3] border border-white/10'
                    : 'bg-[#f0f4f8] text-[#006b5f] shadow-2xs'
                }`}
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Píldoras rápidas de monedas principales */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                const active = (profile.currency || 'USD') === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onUpdateProfile({ currency: code })}
                    className={`px-2.5 py-1 rounded-xl font-display text-[10px] font-bold transition-all shrink-0 active:scale-95 ${
                      active
                        ? 'bg-[#635bff] text-white shadow-xs'
                        : isDark
                        ? 'bg-[#12161f] text-slate-400 hover:text-white'
                        : 'bg-[#f0f4f8] text-[#464555] hover:text-[#171c1f]'
                    }`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] font-bold select-none ${
                  isDark ? 'text-slate-400' : 'text-[#464555]'
                }`}
              >
                {activeCurrency.symbol}
              </span>
              <input
                id="monthly-income"
                type="text"
                inputMode="decimal"
                value={formattedIncomeDisplay}
                onChange={(e) => {
                  const canonical = parseTypedCurrencyInput(e.target.value, activeCurrency.code);
                  setIncomeRaw(canonical);
                  const val = parseFloat(canonical);
                  onUpdateProfile({
                    monthlyIncome: !isNaN(val) && val >= 0 ? val : 0,
                  });
                }}
                placeholder="0"
                className={`w-full h-13 py-3 pl-10 pr-4 rounded-2xl font-display text-[16px] font-semibold tabular-nums focus:outline-none transition-all duration-200 ${inputWell}`}
              />
            </div>

            <div className="flex items-center gap-1.5 px-1">
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isDark ? 'text-slate-400' : 'text-[#777587]'
                }`}
              >
                info
              </span>
              <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                Usado para calcular tu presupuesto mensual y capacidad de ahorro en{' '}
                {activeCurrency.name}.
              </p>
            </div>
          </div>

          {/* Objectives Section (5 Clay Cards) */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="font-display text-[14px] font-bold">
                ¿Para qué usarás FlickWallet?
              </span>
              <span
                className={`font-display text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-[#e4e9ed] text-[#464555]'
                }`}
              >
                Selecciona tus metas
              </span>
            </div>

            {ONBOARDING_GOALS.map((goal) => {
              const checked = selectedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={`group relative flex items-center justify-between p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    checked
                      ? isDark
                        ? 'bg-[#635bff]/20 border border-[#635bff]/40 shadow-[0_10px_22px_-4px_rgba(99,91,255,0.28)]'
                        : 'bg-[#e2dfff]/40 shadow-[0_10px_22px_-4px_rgba(99,91,255,0.22),inset_3px_3px_5px_rgba(255,255,255,0.95)]'
                      : isDark
                      ? 'bg-[#1b202c] shadow-[0_8px_18px_-4px_rgba(0,0,0,0.35)]'
                      : 'bg-[#ffffff] shadow-[0_8px_18px_-4px_rgba(15,23,42,0.06),inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(15,23,42,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-lg ${goal.badgeBg} ${goal.shadow}`}
                    >
                      {goal.emoji}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display text-[16px] font-semibold truncate">
                        {goal.title}
                      </span>
                      <span
                        className={`text-[12px] truncate ${
                          isDark ? 'text-slate-400' : 'text-[#464555]'
                        }`}
                      >
                        {goal.subtitle}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all ${
                      checked
                        ? 'bg-[#493ee5] shadow-[0_4px_8px_rgba(99,91,255,0.35),inset_1px_1px_2px_rgba(255,255,255,0.6)]'
                        : isDark
                        ? 'bg-[#12161f]'
                        : 'bg-[#eaeef2] shadow-[inset_1px_1px_2px_rgba(15,23,42,0.15)]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-white text-[15px] font-bold transition-opacity ${
                        checked ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      check
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              type="submit"
              className={`w-full h-15 py-4 px-8 rounded-full font-display text-[14px] font-bold tracking-wide text-white flex items-center justify-center gap-2 transition-all duration-150 ${
                submitting ? 'scale-95' : ''
              } ${
                submitted
                  ? 'bg-[#006b5f] shadow-[0_14px_28px_-6px_rgba(0,107,95,0.45)]'
                  : 'bg-[#635bff] shadow-[0_16px_32px_-6px_rgba(99,91,255,0.45),inset_2px_3px_5px_rgba(255,255,255,0.7),inset_-2px_-3px_5px_rgba(15,0,105,0.35)] active:translate-y-0.5'
              }`}
            >
              {submitted ? (
                <>
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span>¡Todo Listo! Entrando...</span>
                </>
              ) : (
                <>
                  <span>Comenzar mi experiencia</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className={`font-display text-[12px] font-bold py-1.5 px-4 rounded-full transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-[#464555] hover:text-[#171c1f]'
              }`}
            >
              ← Volver al paso anterior
            </button>

            <div className="flex items-center justify-center gap-1.5 text-center px-2 mt-1">
              <span
                className="material-symbols-outlined text-[#006b5f] dark:text-[#62fae3] text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock
              </span>
              <span
                className={`text-[12px] font-medium ${
                  isDark ? 'text-slate-400' : 'text-[#464555]'
                }`}
              >
                Tus datos quedan guardados de forma privada únicamente en este dispositivo.
              </span>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};
