import React, { useState } from 'react';
import {
  CATEGORIES,
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import { CategoryId, Movement, MovementType, UserProfile } from '../types/wallet';

interface QuickAddViewProps {
  profile: UserProfile;
  onAddMovement: (mov: Omit<Movement, 'id' | 'date'>) => void;
  onSuccessNavigate: () => void;
  isDark: boolean;
}

const QUICK_SUGGESTIONS: Record<
  MovementType,
  { title: string; amount: string; cat: CategoryId }[]
> = {
  hormiga: [
    { title: 'Café & Snack', amount: '12', cat: 'cafe' },
    { title: 'Streaming', amount: '15', cat: 'streaming' },
    { title: 'Antojo Delivery', amount: '25', cat: 'delivery' },
  ],
  fijo: [
    { title: 'Vivienda / Renta', amount: '950', cat: 'vivienda' },
    { title: 'Supermercado', amount: '180', cat: 'supermercado' },
    { title: 'Servicios & Internet', amount: '85', cat: 'servicios' },
  ],
  ingreso: [
    { title: 'Sueldo / Quincena', amount: '2000', cat: 'sueldo' },
    { title: 'Ingreso Extra', amount: '350', cat: 'freelance' },
  ],
};

export const QuickAddView: React.FC<QuickAddViewProps> = ({
  profile,
  onAddMovement,
  onSuccessNavigate,
  isDark,
}) => {
  const [movType, setMovType] = useState<MovementType>('hormiga');
  const [amountRaw, setAmountRaw] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('cafe');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const numericAmount = parseFloat(amountRaw) || 0;
  const monthlyIncome = profile.monthlyIncome || 0;
  const impactPercent =
    monthlyIncome > 0 ? ((numericAmount / monthlyIncome) * 100).toFixed(1) : '0.0';

  const formattedDisplay = amountRaw ? formatLiveNumberString(amountRaw, curr.code) : '0';

  const handleTypeSelect = (t: MovementType) => {
    setMovType(t);
    if (t === 'hormiga') setCategory('cafe');
    else if (t === 'fijo') setCategory('vivienda');
    else setCategory('sueldo');
  };

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setAmountRaw('');
      return;
    }
    if (key === 'BACK') {
      setAmountRaw((prev) => (prev.length <= 1 ? '' : prev.slice(0, -1)));
      return;
    }
    if (key === 'DEC') {
      setAmountRaw((prev) => {
        if (!prev) return '0.';
        if (prev.includes('.')) return prev;
        return `${prev}.`;
      });
      return;
    }
    setAmountRaw((prev) => {
      if (prev === '0') return key;
      const parts = prev.split('.');
      if (parts[1] !== undefined && parts[1].length >= 2) return prev;
      if (parts[0].length >= 11 && parts.length === 1) return prev;
      return prev + key;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    const catMeta = CATEGORIES[category] || CATEGORIES.otros;
    const finalTitle = title.trim() || catMeta.name;

    onAddMovement({
      title: finalTitle,
      amount: numericAmount,
      type: movType,
      category,
    });

    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onSuccessNavigate();
    }, 400);
  };

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  const keyBtnCls = isDark
    ? 'bg-[#242b3a] text-white shadow-[0_5px_10px_rgba(0,0,0,0.35),inset_1px_2px_3px_rgba(255,255,255,0.08)] active:translate-y-0.5 active:scale-95'
    : 'bg-[#ffffff] text-[#171c1f] shadow-[0_6px_14px_-4px_rgba(15,23,42,0.08),inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(15,23,42,0.04)] active:translate-y-0.5 active:scale-95';

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start gap-3.5 pb-8"
    >
      {/* BLOQUE SUPERIOR / COLUMNA IZQUIERDA EN PC: Tipo + Visor de Monto + Teclado (Visible sin bajar) */}
      <div className={`lg:col-span-6 rounded-3xl p-4 lg:p-6 flex flex-col gap-3.5 ${cardCls}`}>
        {/* 1. Selector de Tipo de Movimiento */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              id: 'hormiga' as MovementType,
              label: 'Gasto Hormiga',
              emoji: '🐜',
              activeCls:
                'border-[#a42f46] bg-[#ffdadc]/60 text-[#400010] dark:bg-rose-500/25 dark:text-rose-200',
            },
            {
              id: 'fijo' as MovementType,
              label: 'Gasto Fijo',
              emoji: '🏠',
              activeCls:
                'border-[#493ee5] bg-[#e2dfff]/60 text-[#0f0069] dark:bg-indigo-500/25 dark:text-indigo-200',
            },
            {
              id: 'ingreso' as MovementType,
              label: 'Ingreso',
              emoji: '💰',
              activeCls:
                'border-[#006b5f] bg-[#62fae3]/60 text-[#00201c] dark:bg-emerald-500/25 dark:text-emerald-200',
            },
          ].map((item) => {
            const active = movType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTypeSelect(item.id)}
                className={`py-2.5 px-2 rounded-2xl border-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                  active
                    ? `${item.activeCls} shadow-xs`
                    : isDark
                    ? 'border-transparent bg-[#12161f] text-slate-400'
                    : 'border-transparent bg-[#f0f4f8] text-[#464555]'
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span className="font-display text-[11px] font-bold leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Visor de Monto en Vivo (También permite escribir directamente y ver los números) */}
        <div
          className={`w-full py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative ${
            isDark
              ? 'bg-[#12161f] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)]'
              : 'bg-[#f0f4f8] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
          }`}
        >
          <div className="w-full flex items-center justify-between text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
            <span>Monto en {curr.code}</span>
            {amountRaw && (
              <button
                type="button"
                onClick={() => setAmountRaw('')}
                className="text-[#a42f46] dark:text-[#ffb2b9] hover:underline font-extrabold"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="w-full flex items-center justify-center gap-1.5">
            <span
              className={`font-display text-[26px] font-extrabold select-none ${
                movType === 'ingreso'
                  ? 'text-[#006b5f] dark:text-[#62fae3]'
                  : movType === 'hormiga'
                  ? 'text-[#a42f46] dark:text-[#ffb2b9]'
                  : 'text-[#493ee5] dark:text-[#c3c0ff]'
              }`}
            >
              {curr.symbol}
            </span>
            <input
              type="text"
              inputMode="decimal"
              aria-label="Monto del movimiento"
              value={amountRaw ? formattedDisplay : ''}
              onChange={(e) => {
                const canonical = parseTypedCurrencyInput(e.target.value, curr.code);
                setAmountRaw(canonical);
              }}
              placeholder="0"
              className="w-full max-w-[240px] text-center bg-transparent font-display text-[32px] leading-tight font-extrabold tracking-tight tabular-nums focus:outline-none placeholder:text-slate-400/60"
            />
          </div>

          {/* Simulador de impacto compacto */}
          <div className="text-[11px] text-center text-slate-400">
            {movType === 'hormiga'
              ? `5 veces/semana = ${curr.symbol}${formatCurrencyAmount(numericAmount * 5 * 52, curr.code)} ${curr.code}/año`
              : monthlyIncome > 0
              ? `Representa el ${impactPercent}% de tu ingreso mensual`
              : `Moneda activa: ${curr.name}`}
          </div>
        </div>

        {/* 3. Teclado Numérico Táctil justo debajo del visor para ver los números al escribirlos */}
        <div
          className={`rounded-2xl p-2.5 grid grid-cols-3 gap-2 ${
            isDark ? 'bg-[#12161f]' : 'bg-[#eaeef2]'
          }`}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'DEC', '0', 'BACK'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={`h-11 rounded-xl font-display text-[19px] font-extrabold flex items-center justify-center transition-all ${keyBtnCls}`}
            >
              {key === 'BACK' ? (
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              ) : key === 'DEC' ? (
                curr.decimalSep
              ) : (
                key
              )}
            </button>
          ))}
        </div>

        {/* Botón Guardar Rápido */}
        <button
          type="submit"
          className={`w-full h-13 rounded-full font-display text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
            savedFeedback
              ? 'bg-[#006b5f] shadow-[0_12px_24px_rgba(0,107,95,0.4)]'
              : 'bg-[#635bff] shadow-[0_14px_28px_-6px_rgba(99,91,255,0.45),inset_2px_3px_5px_rgba(255,255,255,0.6),inset_-2px_-3px_5px_rgba(15,0,105,0.35)]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {savedFeedback ? 'check_circle' : 'add_task'}
          </span>
          <span>{savedFeedback ? '¡Guardado en tu Billetera!' : 'Guardar Movimiento'}</span>
        </button>
      </div>

      {/* Descripción y Categoría (Columna Derecha en PC) */}
      <div className={`lg:col-span-6 rounded-3xl p-4 lg:p-6 flex flex-col gap-4 ${cardCls}`}>
        <div>
          <label className="font-display text-[12px] font-bold block mb-1.5" htmlFor="mov-desc">
            Descripción (opcional)
          </label>
          <input
            id="mov-desc"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Café frío, Netflix, Sueldo..."
            className={`w-full h-11 px-4 rounded-2xl text-[14px] focus:outline-none ${
              isDark
                ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]'
                : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_4px_rgba(15,23,42,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
            }`}
          />
        </div>

        {/* Sugerencias rápidas */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_SUGGESTIONS[movType].map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTitle(sug.title);
                setAmountRaw(sug.amount);
                setCategory(sug.cat);
              }}
              className={`px-2.5 py-1 rounded-full font-display text-[10px] font-bold transition-all active:scale-95 ${
                isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-[#eaeef2] text-[#464555] hover:bg-[#e2dfff]'
              }`}
            >
              + {sug.title}
            </button>
          ))}
        </div>

        <div>
          <span className="font-display text-[12px] font-bold block mb-2">Categoría</span>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(CATEGORIES).map((cat) => {
              const selected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all active:scale-95 ${
                    selected
                      ? 'border-[#635bff] bg-[#e2dfff]/50 dark:bg-[#635bff]/25'
                      : isDark
                      ? 'border-transparent bg-[#12161f]'
                      : 'border-transparent bg-[#f0f4f8]'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-display text-[10px] font-bold truncate w-full text-center">
                    {cat.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
};
