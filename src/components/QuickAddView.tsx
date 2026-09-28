import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CATEGORIES,
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import {
  CategoryId,
  Movement,
  MovementType,
  SavingsGoal,
  UserProfile,
} from '../types/wallet';
import { AppIcon } from './AntIcon';

interface QuickAddViewProps {
  profile: UserProfile;
  savingsGoals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => SavingsGoal;
  onAddMovement: (mov: Omit<Movement, 'id' | 'date'>) => void;
  onSuccessNavigate: () => void;
  isDark: boolean;
}

const resolveGoalIcon = (val?: string) =>
  val && /^[a-z0-9_]+$/.test(val) ? val : 'savings';

export const QuickAddView: React.FC<QuickAddViewProps> = ({
  profile,
  savingsGoals,
  onAddGoal,
  onAddMovement,
  onSuccessNavigate,
  isDark,
}) => {
  const [movType, setMovType] = useState<MovementType>('hormiga');
  const [amountRaw, setAmountRaw] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('cafe');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(savingsGoals[0]?.id || '');

  const [creatingGoal, setCreatingGoal] = useState<boolean>(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTargetRaw, setNewGoalTargetRaw] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

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
    else if (t === 'ingreso') setCategory('sueldo');
    else {
      setCategory('alcancia');
      if (savingsGoals.length > 0 && !selectedGoalId) {
        setSelectedGoalId(savingsGoals[0].id);
      }
    }
  };

  const handleKeyPress = useCallback((key: string) => {
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
  }, []);

  // Permite escribir con el teclado físico de la PC en cualquier momento sin tener que hacer clic primero en el campo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const activeEl = document.activeElement as HTMLElement | null;
      const tag = activeEl?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('BACK');
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault();
        handleKeyPress('C');
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleKeyPress('DEC');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const handleCreateGoalInline = () => {
    const target = parseFloat(newGoalTargetRaw) || 0;
    if (!newGoalName.trim() || target <= 0) return;
    const created = onAddGoal({
      name: newGoalName.trim(),
      targetAmount: target,
      savedAmount: 0,
      emoji: 'savings',
    });
    setSelectedGoalId(created.id);
    setNewGoalName('');
    setNewGoalTargetRaw('');
    setCreatingGoal(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    let targetGoalId = selectedGoalId || savingsGoals[0]?.id;

    if (movType === 'alcancia' && !targetGoalId) {
      const target = parseFloat(newGoalTargetRaw) || 0;
      if (!newGoalName.trim() || target <= 0) {
        return;
      }
      const created = onAddGoal({
        name: newGoalName.trim(),
        targetAmount: target,
        savedAmount: 0,
        emoji: 'savings',
      });
      targetGoalId = created.id;
    }

    const catMeta = CATEGORIES[category] || CATEGORIES.otros;
    const goalObj = savingsGoals.find((g) => g.id === targetGoalId);
    const finalTitle =
      title.trim() ||
      (movType === 'alcancia' && goalObj
        ? `Abono a ${goalObj.name}`
        : movType === 'alcancia' && newGoalName.trim()
        ? `Abono a ${newGoalName.trim()}`
        : catMeta.name);

    onAddMovement({
      title: finalTitle,
      amount: numericAmount,
      type: movType,
      category: movType === 'alcancia' ? 'alcancia' : category,
      goalId: movType === 'alcancia' ? targetGoalId : undefined,
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

  const needsGoalSetup = movType === 'alcancia' && (savingsGoals.length === 0 || creatingGoal);

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start gap-3.5 pb-8"
    >
      {/* Columna Izquierda en PC: Tipo + Visor de Monto + Teclado */}
      <div className={`lg:col-span-6 rounded-3xl p-4 lg:p-6 flex flex-col gap-3.5 ${cardCls}`}>
        {/* 1. Selector de Tipo de Movimiento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              id: 'hormiga' as MovementType,
              label: 'Hormiga',
              icon: 'ant',
              activeCls: isDark
                ? 'border-[#fb7185] bg-rose-500/25 text-white'
                : 'border-[#a42f46] bg-[#ffdadc] text-[#400010]',
            },
            {
              id: 'fijo' as MovementType,
              label: 'Gasto Fijo',
              icon: 'home',
              activeCls: isDark
                ? 'border-[#818cf8] bg-[#635bff]/35 text-white'
                : 'border-[#493ee5] bg-[#e2dfff] text-[#1e1b4b]',
            },
            {
              id: 'ingreso' as MovementType,
              label: 'Ingreso',
              icon: 'payments',
              activeCls: isDark
                ? 'border-[#34d399] bg-emerald-500/25 text-white'
                : 'border-[#006b5f] bg-[#62fae3] text-[#00201c]',
            },
            {
              id: 'alcancia' as MovementType,
              label: 'En Alcancía',
              icon: 'savings',
              activeCls: isDark
                ? 'border-[#a5b4fc] bg-[#635bff]/40 text-white'
                : 'border-[#493ee5] bg-[#d8d4ff] text-[#1e1b4b]',
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
                    ? 'border-transparent bg-[#12161f] text-slate-300'
                    : 'border-transparent bg-[#f0f4f8] text-[#171c1f]'
                }`}
              >
                <AppIcon name={item.icon} className="text-[18px]" filled={active} />
                <span className="font-display text-[11.5px] font-extrabold leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selector o Creación de Meta antes de meter dinero en Alcancía */}
        {movType === 'alcancia' && (
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border ${
              isDark
                ? 'bg-[#12161f] border-[#635bff]/40'
                : 'bg-[#f0f4f8] border-[#635bff]/30'
            }`}
          >
            {!needsGoalSetup ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[11px] font-extrabold text-[#493ee5] dark:text-[#c3c0ff]">
                    Selecciona a qué Alcancía abonar:
                  </span>
                  <button
                    type="button"
                    onClick={() => setCreatingGoal(true)}
                    className="font-display text-[11px] font-bold text-[#006b5f] dark:text-[#62fae3] hover:underline"
                  >
                    + Crear otra meta
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savingsGoals.map((g) => {
                    const active = (selectedGoalId || savingsGoals[0]?.id) === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGoalId(g.id)}
                        className={`px-3 py-1.5 rounded-xl font-display text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          active
                            ? 'bg-[#635bff] text-white shadow-xs'
                            : isDark
                            ? 'bg-[#1b202c] text-slate-300'
                            : 'bg-white text-[#171c1f]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {resolveGoalIcon(g.emoji)}
                        </span>
                        <span>{g.name}</span>
                        <span className="opacity-75">
                          ({curr.symbol}
                          {formatCurrencyAmount(g.savedAmount, curr.code)} / {curr.symbol}
                          {formatCurrencyAmount(g.targetAmount, curr.code)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[12px] font-extrabold text-[#493ee5] dark:text-[#c3c0ff]">
                    Primero define el Nombre y la Meta de tu Alcancía:
                  </span>
                  {savingsGoals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreatingGoal(false)}
                      className="text-[11px] font-bold text-slate-400"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newGoalName}
                    onChange={(e) => setNewGoalName(e.target.value)}
                    placeholder="1. Nombre de la meta"
                    className={`h-10 px-3 rounded-xl text-[12px] font-medium focus:outline-none ${
                      isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                    }`}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-display text-[12px] font-bold text-slate-400">
                      {curr.symbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatLiveNumberString(newGoalTargetRaw, curr.code)}
                      onChange={(e) =>
                        setNewGoalTargetRaw(parseTypedCurrencyInput(e.target.value, curr.code))
                      }
                      placeholder="2. Meta total"
                      className={`w-full h-10 pl-7 pr-3 rounded-xl font-display text-[12px] font-bold tabular-nums focus:outline-none ${
                        isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                      }`}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateGoalInline}
                  className="py-2 rounded-xl bg-[#635bff] text-white font-display text-[11px] font-bold"
                >
                  Confirmar Meta de Ahorro
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Visor de Monto en Vivo (Clic o teclado directo en PC y táctil en móvil) */}
        <div
          onClick={() => amountInputRef.current?.focus()}
          className={`w-full py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 relative cursor-text ${
            isDark
              ? 'bg-[#12161f] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)]'
              : 'bg-[#f0f4f8] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
          }`}
        >
          <div className="w-full flex items-center justify-between text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
            <span>
              {movType === 'alcancia'
                ? `Monto a guardar en Alcancía (${curr.code})`
                : `Monto en ${curr.code}`}
            </span>
            {amountRaw && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAmountRaw('');
                }}
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
              ref={amountInputRef}
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

          <div className="text-[11px] text-center text-slate-400">
            {movType === 'hormiga'
              ? `5 veces/semana = ${curr.symbol}${formatCurrencyAmount(numericAmount * 5 * 52, curr.code)} ${curr.code}/año`
              : movType === 'alcancia'
              ? 'Este dinero se sumará directamente a tu meta de ahorro'
              : monthlyIncome > 0
              ? `Representa el ${impactPercent}% de tu ingreso mensual`
              : `Moneda activa: ${curr.name}`}
          </div>
        </div>

        {/* 3. Teclado Numérico Táctil */}
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
            {savedFeedback ? 'check_circle' : movType === 'alcancia' ? 'savings' : 'add_task'}
          </span>
          <span>
            {savedFeedback
              ? 'Guardado en tu Billetera'
              : movType === 'alcancia'
              ? 'Añadir Dinero en Alcancía'
              : 'Guardar Movimiento'}
          </span>
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
            placeholder={
              movType === 'alcancia'
                ? 'Escribe el concepto de tu ahorro...'
                : 'Escribe el nombre o concepto del movimiento...'
            }
            className={`w-full h-11 px-4 rounded-2xl text-[14px] focus:outline-none ${
              isDark
                ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]'
                : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_4px_rgba(15,23,42,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
            }`}
          />
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
                  className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 border-2 transition-all active:scale-95 ${
                    selected
                      ? 'border-[#635bff] bg-[#e2dfff]/50 dark:bg-[#635bff]/25'
                      : isDark
                      ? 'border-transparent bg-[#12161f]'
                      : 'border-transparent bg-[#f0f4f8]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      selected
                        ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                        : isDark
                        ? 'text-slate-300'
                        : 'text-[#464555]'
                    }`}
                    style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {cat.icon}
                  </span>
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
