import React, { useState } from 'react';
import {
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import { SavingsGoal, UserProfile } from '../types/wallet';

interface AlcanciaViewProps {
  profile: UserProfile;
  savingsGoals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => SavingsGoal;
  onDepositToGoal: (goalId: string, amount: number) => void;
  onWithdrawFromGoal: (goalId: string, amount: number) => void;
  onDeleteGoal: (goalId: string) => void;
  hideBalance: boolean;
  isDark: boolean;
}

const GOAL_ICONS: { id: string; label: string }[] = [
  { id: 'savings', label: 'Alcancía' },
  { id: 'flight_takeoff', label: 'Viaje' },
  { id: 'two_wheeler', label: 'Moto' },
  { id: 'home', label: 'Hogar' },
  { id: 'laptop_mac', label: 'Tecnología' },
  { id: 'directions_car', label: 'Vehículo' },
  { id: 'school', label: 'Estudio' },
  { id: 'diamond', label: 'Inversión' },
  { id: 'smartphone', label: 'Equipo' },
  { id: 'beach_access', label: 'Descanso' },
];

const resolveGoalIcon = (val?: string) =>
  val && /^[a-z0-9_]+$/.test(val) ? val : 'savings';

export const AlcanciaView: React.FC<AlcanciaViewProps> = ({
  profile,
  savingsGoals,
  onAddGoal,
  onDepositToGoal,
  onWithdrawFromGoal,
  onDeleteGoal,
  hideBalance,
  isDark,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(savingsGoals.length === 0);
  const [goalName, setGoalName] = useState('');
  const [goalTargetRaw, setGoalTargetRaw] = useState('');
  const [goalIcon, setGoalIcon] = useState('savings');

  const [depositingGoalId, setDepositingGoalId] = useState<string | null>(null);
  const [depositAmountRaw, setDepositAmountRaw] = useState('');

  const [withdrawingGoalId, setWithdrawingGoalId] = useState<string | null>(null);
  const [withdrawAmountRaw, setWithdrawAmountRaw] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const fmt = (val: number) => formatCurrencyAmount(val, curr.code);

  const totalSavedAll = savingsGoals.reduce((acc, g) => acc + g.savedAmount, 0);
  const totalTargetAll = savingsGoals.reduce((acc, g) => acc + g.targetAmount, 0);
  const globalProgress =
    totalTargetAll > 0 ? Math.min(100, Math.round((totalSavedAll / totalTargetAll) * 100)) : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTargetRaw) || 0;
    if (!goalName.trim() || target <= 0) return;

    onAddGoal({
      name: goalName.trim(),
      targetAmount: target,
      savedAmount: 0,
      emoji: goalIcon,
    });
    setGoalName('');
    setGoalTargetRaw('');
    setGoalIcon('savings');
    setShowCreateForm(false);
  };

  const handleDepositSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const amt = parseFloat(depositAmountRaw) || 0;
    if (amt <= 0) return;
    onDepositToGoal(goalId, amt);
    setDepositAmountRaw('');
    setDepositingGoalId(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent, goal: SavingsGoal) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmountRaw) || 0;
    if (amt <= 0) return;
    if (amt > goal.savedAmount) {
      setWithdrawError(
        `Solo tienes ${curr.symbol}${fmt(goal.savedAmount)} ${curr.code} disponibles en esta alcancía.`
      );
      return;
    }
    setWithdrawError(null);
    onWithdrawFromGoal(goal.id, amt);
    setWithdrawAmountRaw('');
    setWithdrawingGoalId(null);
  };

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  const inputWell = isDark
    ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.55)]'
    : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]';

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Encabezado de Alcancías y Metas */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#006b5f] via-[#0d9488] to-[#115e59] text-white shadow-[0_20px_36px_-8px_rgba(13,148,136,0.42),inset_3px_4px_7px_rgba(255,255,255,0.35),inset_-4px_-4px_8px_rgba(0,40,35,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6)] shrink-0">
            <span
              className="material-symbols-outlined text-[26px] text-[#62fae3]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              savings
            </span>
          </div>
          <div className="min-w-0">
            <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#62fae3] block">
              Alcancías · Metas de Ahorro
            </span>
            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold leading-tight break-words">
              {hideBalance ? `${curr.symbol} •••••••` : `${curr.symbol}${fmt(totalSavedAll)}`}{' '}
              <span className="text-[12px] font-bold text-[#62fae3] block sm:inline">
                {curr.code} ahorrados
              </span>
            </h2>
            <p className="text-[11.5px] text-white/85 mt-1">
              {savingsGoals.length === 0
                ? 'Crea tu primera meta definiendo el nombre y el monto objetivo'
                : `${savingsGoals.length} ${
                    savingsGoals.length === 1 ? 'alcancía activa' : 'alcancías activas'
                  } · ${globalProgress}% de tu meta global`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#62fae3] text-[#00201c] font-display text-[13px] font-extrabold flex items-center justify-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)] active:scale-95 transition-transform shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showCreateForm ? 'close' : 'add'}
          </span>
          <span>{showCreateForm ? 'Cerrar formulario' : 'Nueva Meta de Ahorro'}</span>
        </button>
      </div>

      {/* Formulario Paso Previo: Preguntar Nombre y Meta antes de crear la Alcancía */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateGoal}
          className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 border-2 ${
            isDark ? 'border-[#62fae3]/40' : 'border-[#006b5f]/30'
          } ${cardCls}`}
        >
          <div>
            <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#006b5f] dark:text-[#62fae3]">
              Configura tu Alcancía desde cero
            </span>
            <h3 className="font-display text-[17px] font-extrabold">
              Define el nombre y el monto objetivo de tu meta
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[12px] font-bold" htmlFor="alcancia-goal-name">
                1. Nombre de tu meta de ahorro
              </label>
              <input
                id="alcancia-goal-name"
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Escribe el nombre de tu meta"
                className={`w-full h-12 px-4 rounded-2xl font-display text-[14px] font-bold focus:outline-none ${inputWell}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-display text-[12px] font-bold" htmlFor="alcancia-goal-target">
                2. Meta total a alcanzar ({curr.code})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[15px] font-bold text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="alcancia-goal-target"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formatLiveNumberString(goalTargetRaw, curr.code)}
                  onChange={(e) =>
                    setGoalTargetRaw(parseTypedCurrencyInput(e.target.value, curr.code))
                  }
                  placeholder="0"
                  className={`w-full h-12 pl-10 pr-4 rounded-2xl font-display text-[16px] font-extrabold tabular-nums focus:outline-none ${inputWell}`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-display text-[12px] font-bold">
              3. Icono identificador
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {GOAL_ICONS.map((ic) => {
                const selected = goalIcon === ic.id;
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setGoalIcon(ic.id)}
                    title={ic.label}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                      selected
                        ? 'bg-[#635bff] text-white shadow-[0_6px_14px_rgba(99,91,255,0.4)] scale-105'
                        : isDark
                        ? 'bg-[#12161f] text-slate-300'
                        : 'bg-[#f0f4f8] text-[#464555]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {ic.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#635bff] text-white font-display text-[14px] font-extrabold shadow-[0_12px_24px_-4px_rgba(99,91,255,0.45),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:scale-98 transition-all"
          >
            Crear Alcancía
          </button>
        </form>
      )}

      {/* Listado de Alcancías Activas */}
      {savingsGoals.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center flex flex-col items-center gap-3 ${cardCls}`}>
          <div className="w-15 h-15 rounded-3xl bg-[#62fae3]/30 text-[#006b5f] dark:text-[#62fae3] flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">savings</span>
          </div>
          <h3 className="font-display text-[17px] font-extrabold">
            Aún no tienes alcancías creadas
          </h3>
          <p className={`text-[12.5px] max-w-md ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
            Escribe arriba el <strong>nombre de tu meta</strong> y el <strong>monto objetivo</strong>{' '}
            para empezar a ahorrar desde cero.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {savingsGoals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const isCompleted = pct >= 100;
            const isDepositing = depositingGoalId === goal.id;
            const isWithdrawing = withdrawingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className={`rounded-3xl p-5 flex flex-col justify-between gap-4 border transition-all ${
                  isCompleted
                    ? 'border-[#10b981]/50'
                    : isDark
                    ? 'border-white/5'
                    : 'border-slate-200/60'
                } ${cardCls}`}
              >
                {/* Fila 1: Icono + Nombre completo + Monto + Eliminar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-[#62fae3]/30 text-[#006b5f] dark:text-[#62fae3] flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8)]">
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {resolveGoalIcon(goal.emoji)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-[16px] font-extrabold leading-snug break-words">
                          {goal.name}
                        </h4>
                        {isCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#62fae3] text-[#00201c] font-display text-[10px] font-extrabold shrink-0">
                            Meta Lograda
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[12.5px] block font-display font-bold tabular-nums mt-0.5 ${
                          isDark ? 'text-slate-300' : 'text-[#464555]'
                        }`}
                      >
                        {hideBalance
                          ? `${curr.symbol} •••• de ${curr.symbol} ••••`
                          : `${curr.symbol}${fmt(goal.savedAmount)} de ${curr.symbol}${fmt(
                              goal.targetAmount
                            )} ${curr.code}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal.id)}
                    title="Eliminar alcancía"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {/* Fila 2: Barra de progreso */}
                <div className="flex flex-col gap-1.5">
                  <div className="w-full h-3.5 rounded-full bg-black/10 dark:bg-black/40 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#635bff] via-[#2dd4bf] to-[#62fae3] transition-all duration-300"
                      style={{ width: `${goal.savedAmount > 0 ? Math.max(5, pct) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11.5px] font-display font-bold flex-wrap gap-2">
                    <span className="text-[#006b5f] dark:text-[#62fae3] tabular-nums">
                      {pct}% completado
                    </span>
                    <span className={isDark ? 'text-slate-400' : 'text-[#464555]'}>
                      {remaining === 0
                        ? 'Meta superada'
                        : `Faltan ${
                            hideBalance ? `${curr.symbol} •••` : `${curr.symbol}${fmt(remaining)}`
                          }`}
                    </span>
                  </div>
                </div>

                {/* Fila 3: Botones para Meter o Retirar dinero */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWithdrawingGoalId(null);
                      setWithdrawError(null);
                      setDepositingGoalId(isDepositing ? null : goal.id);
                      setDepositAmountRaw('');
                    }}
                    className="w-full py-2.5 px-3.5 rounded-2xl bg-[#635bff] text-white font-display text-[12px] font-extrabold flex items-center justify-center gap-1.5 shadow-[0_6px_14px_rgba(99,91,255,0.3),inset_1px_1px_2px_rgba(255,255,255,0.6)] active:scale-98 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[17px]">savings</span>
                    <span>{isDepositing ? 'Cancelar abono' : '+ Meter dinero'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={goal.savedAmount <= 0}
                    onClick={() => {
                      setDepositingGoalId(null);
                      setWithdrawError(null);
                      setWithdrawingGoalId(isWithdrawing ? null : goal.id);
                      setWithdrawAmountRaw('');
                    }}
                    className={`w-full py-2.5 px-3.5 rounded-2xl font-display text-[12px] font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      goal.savedAmount <= 0
                        ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                        : isDark
                        ? 'bg-[#12161f] text-[#62fae3] border border-[#62fae3]/35 active:scale-98'
                        : 'bg-[#e2f8f5] text-[#004d44] border border-[#006b5f]/25 active:scale-98'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px]">payments</span>
                    <span>{isWithdrawing ? 'Cancelar retiro' : 'Retirar dinero'}</span>
                  </button>
                </div>

                {/* Panel desplegable para añadir dinero */}
                {isDepositing && (
                  <form
                    onSubmit={(e) => handleDepositSubmit(e, goal.id)}
                    className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border ${
                      isDark
                        ? 'bg-[#12161f] border-[#635bff]/40'
                        : 'bg-[#f0f4f8] border-[#635bff]/30'
                    }`}
                  >
                    <label className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#635bff] dark:text-[#c3c0ff]">
                      ¿Cuánto quieres abonar hoy?
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-[14px] font-bold text-slate-400">
                          {curr.symbol}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoFocus
                          value={formatLiveNumberString(depositAmountRaw, curr.code)}
                          onChange={(e) =>
                            setDepositAmountRaw(parseTypedCurrencyInput(e.target.value, curr.code))
                          }
                          placeholder="0"
                          className={`w-full h-11 pl-9 pr-3 rounded-xl font-display text-[15px] font-extrabold tabular-nums focus:outline-none ${
                            isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-11 px-4 rounded-xl bg-[#006b5f] text-white font-display text-[12px] font-extrabold shadow-sm active:scale-95 transition-transform shrink-0"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                {/* Panel desplegable para retirar dinero de la alcancía */}
                {isWithdrawing && (
                  <form
                    onSubmit={(e) => handleWithdrawSubmit(e, goal)}
                    className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border ${
                      isDark
                        ? 'bg-[#12161f] border-[#62fae3]/40'
                        : 'bg-[#f0f4f8] border-[#006b5f]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#006b5f] dark:text-[#62fae3]">
                        ¿Cuánto deseas retirar al saldo disponible?
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setWithdrawAmountRaw(String(goal.savedAmount));
                          setWithdrawError(null);
                        }}
                        className="font-display text-[10.5px] font-extrabold text-[#635bff] dark:text-[#c3c0ff] hover:underline shrink-0"
                      >
                        Retirar todo
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-[14px] font-bold text-slate-400">
                          {curr.symbol}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoFocus
                          value={formatLiveNumberString(withdrawAmountRaw, curr.code)}
                          onChange={(e) => {
                            setWithdrawAmountRaw(
                              parseTypedCurrencyInput(e.target.value, curr.code)
                            );
                            setWithdrawError(null);
                          }}
                          placeholder="0"
                          className={`w-full h-11 pl-9 pr-3 rounded-xl font-display text-[15px] font-extrabold tabular-nums focus:outline-none ${
                            isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-11 px-4 rounded-xl bg-[#635bff] text-white font-display text-[12px] font-extrabold shadow-sm active:scale-95 transition-transform shrink-0"
                      >
                        Retirar
                      </button>
                    </div>

                    {withdrawError && (
                      <p className="font-display text-[11px] font-bold text-rose-500">
                        {withdrawError}
                      </p>
                    )}
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
