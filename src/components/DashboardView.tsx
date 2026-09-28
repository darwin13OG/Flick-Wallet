import React, { useMemo, useState } from 'react';
import {
  CATEGORIES,
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import {
  ActiveTab,
  Movement,
  MovementType,
  PaymentReminder,
  SavingsGoal,
  UserProfile,
} from '../types/wallet';

interface DashboardViewProps {
  profile: UserProfile;
  movements: Movement[];
  savingsGoals: SavingsGoal[];
  reminders: PaymentReminder[];
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onDeleteMovement: (id: string) => void;
  onNavigate: (tab: ActiveTab) => void;
  isDark: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  movements,
  savingsGoals,
  reminders,
  hideBalance,
  onToggleHideBalance,
  onUpdateProfile,
  onDeleteMovement,
  onNavigate,
  isDark,
}) => {
  const [filterType, setFilterType] = useState<'all' | MovementType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(25);
  const [editingHormigaLimit, setEditingHormigaLimit] = useState(false);
  const [hormigaLimitInput, setHormigaLimitInput] = useState('');

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const fmt = (val: number) => formatCurrencyAmount(val, curr.code);

  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalFixed = 0;
    let totalHormiga = 0;
    let totalAlcancia = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (let i = 0; i < movements.length; i++) {
      const m = movements[i];
      if (m.type === 'ingreso') {
        totalIncome += m.amount;
        incomeCount++;
      } else if (m.type === 'fijo') {
        totalFixed += m.amount;
        expenseCount++;
      } else if (m.type === 'alcancia') {
        totalAlcancia += m.amount;
      } else {
        totalHormiga += m.amount;
        expenseCount++;
      }
    }

    const baseMonthly = profile.monthlyIncome || 0;
    const effectiveIncome = baseMonthly + totalIncome;
    const totalExpenses = totalFixed + totalHormiga;
    const netBalance = Math.max(0, effectiveIncome - totalExpenses - totalAlcancia);

    const customLimit =
      profile.hormigaLimit && profile.hormigaLimit > 0 ? profile.hormigaLimit : 0;
    const hormigaLimit =
      customLimit > 0
        ? customLimit
        : effectiveIncome > 0
        ? Math.round(effectiveIncome * 0.1)
        : 0;

    const hormigaPercent =
      hormigaLimit > 0 ? Math.min(Math.round((totalHormiga / hormigaLimit) * 100), 100) : 0;

    const totalSavedInGoals = savingsGoals.reduce((acc, g) => acc + g.savedAmount, 0);
    const pendingRemindersCount = reminders.filter(
      (r) => !r.paidMonths.includes(currentMonthKey)
    ).length;
    const pendingRemindersAmount = reminders
      .filter((r) => !r.paidMonths.includes(currentMonthKey))
      .reduce((acc, r) => acc + r.amount, 0);

    return {
      totalIncome,
      totalFixed,
      totalHormiga,
      totalAlcancia,
      totalExpenses,
      netBalance,
      incomeCount,
      expenseCount,
      effectiveIncome,
      hormigaLimit,
      hasCustomLimit: customLimit > 0,
      hormigaPercent,
      hormigaAnnual: totalHormiga * 12,
      totalSavedInGoals,
      pendingRemindersCount,
      pendingRemindersAmount,
    };
  }, [movements, profile.monthlyIncome, profile.hormigaLimit, savingsGoals, reminders, currentMonthKey]);

  const hormigaByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < movements.length; i++) {
      const m = movements[i];
      if (m.type === 'hormiga') {
        map[m.category] = (map[m.category] || 0) + m.amount;
      }
    }
    return Object.entries(map)
      .map(([catId, amount]) => ({
        cat: CATEGORIES[catId as keyof typeof CATEGORIES] || CATEGORIES.otros,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movements.filter((m) => {
      const matchesType = filterType === 'all' || m.type === filterType;
      if (!matchesType) return false;
      if (!q) return true;
      const cat = CATEGORIES[m.category] || CATEGORIES.otros;
      return m.title.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
    });
  }, [movements, filterType, searchQuery]);

  // Windowed slice so DOM stays fast even with 1,000+ movements
  const displayedMovements = useMemo(
    () => filteredMovements.slice(0, visibleLimit),
    [filteredMovements, visibleLimit]
  );

  const formatRelativeDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const diffHours = Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60));
      if (diffHours < 1) return 'Hace unos min';
      if (diffHours < 24) return `Hace ${diffHours}h`;
      if (diffHours < 48) return 'Ayer';
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  const handleOpenHormigaEditor = () => {
    setHormigaLimitInput(stats.hormigaLimit > 0 ? String(stats.hormigaLimit) : '');
    setEditingHormigaLimit(true);
  };

  const handleSaveHormigaLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(hormigaLimitInput) || 0;
    onUpdateProfile({ hormigaLimit: parsed });
    setEditingHormigaLimit(false);
  };

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Bienvenido */}
      <div className="px-1 pt-1">
        <h2 className="font-display text-[22px] lg:text-[26px] font-extrabold tracking-tight leading-tight">
          {profile.name ? `Bienvenido, ${profile.name}` : 'Bienvenido'}
        </h2>
      </div>

      {/* Contenedor Principal Responsivo: 1 columna en móvil, 12 columnas bien distribuidas en PC */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start gap-5">
        {/* Columna Izquierda en PC (7 cols): Saldo Total + Resumen + Accesos Rápidos + Radar Hormiga */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Tarjeta de Saldo Total */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#635bff] via-[#564cf2] to-[#3f34d9] text-white shadow-[0_20px_36px_-8px_rgba(99,91,255,0.45),inset_3px_4px_7px_rgba(255,255,255,0.45),inset_-4px_-4px_8px_rgba(15,0,105,0.4)] overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[16px] text-[#62fae3]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </span>
                </span>
                <span className="font-display text-[12px] font-bold uppercase tracking-wider text-white/90">
                  Saldo Total Disponible
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleHideBalance}
                className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center gap-1.5 font-display text-[11px] font-bold"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {hideBalance ? 'visibility' : 'visibility_off'}
                </span>
                <span>{hideBalance ? 'Mostrar' : 'Ocultar'}</span>
              </button>
            </div>

            <div className="my-3 flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-[34px] leading-[40px] font-extrabold tracking-tight tabular-nums">
                {hideBalance ? `${curr.symbol} ••••••••` : `${curr.symbol}${fmt(stats.netBalance)}`}
              </span>
              <span className="font-display text-[11px] font-bold bg-[#62fae3] text-[#00201c] px-2.5 py-0.5 rounded-full">
                {curr.code}
              </span>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/80">
                  Ingreso mensual: {curr.symbol}
                  {fmt(profile.monthlyIncome || 0)} {curr.code}
                </span>
                <span className="font-display font-bold text-[#62fae3] tabular-nums">
                  {hideBalance
                    ? '••% libre'
                    : `${
                        stats.effectiveIncome > 0
                          ? Math.max(
                              0,
                              Math.round(
                                ((stats.effectiveIncome -
                                  stats.totalExpenses -
                                  stats.totalAlcancia) /
                                  stats.effectiveIncome) *
                                  100
                              )
                            )
                          : 0
                      }% disponible`}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-black/25 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#62fae3] to-[#3cddc7] transition-all duration-300"
                  style={{
                    width: `${
                      stats.effectiveIncome > 0
                        ? Math.max(
                            0,
                            Math.min(
                              100,
                              Math.round(
                                ((stats.effectiveIncome -
                                  stats.totalExpenses -
                                  stats.totalAlcancia) /
                                  stats.effectiveIncome) *
                                  100
                              )
                            )
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen Rápido (Ingresos vs Gastos) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className={`rounded-3xl p-4 flex flex-col justify-between gap-2 ${cardCls}`}>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-[#62fae3] text-[#00201c] flex items-center justify-center shadow-[0_4px_10px_rgba(0,107,95,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                  <span className="material-symbols-outlined text-[20px] font-bold">
                    south_west
                  </span>
                </div>
                <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#006b5f] dark:text-[#62fae3]">
                  {stats.incomeCount} mov.
                </span>
              </div>
              <div>
                <span
                  className={`text-[12px] block ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}
                >
                  Ingresos Registrados
                </span>
                <span className="font-display text-[20px] font-extrabold text-[#006b5f] dark:text-[#62fae3] tabular-nums">
                  {hideBalance
                    ? `${curr.symbol} •••••`
                    : `${curr.symbol}${fmt(stats.totalIncome)}`}
                </span>
              </div>
            </div>

            <div className={`rounded-3xl p-4 flex flex-col justify-between gap-2 ${cardCls}`}>
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-2xl bg-[#ffdadc] text-[#400010] flex items-center justify-center shadow-[0_4px_10px_rgba(164,47,70,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                  <span className="material-symbols-outlined text-[20px] font-bold">
                    north_east
                  </span>
                </div>
                <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#a42f46] dark:text-[#ffb2b9]">
                  {stats.expenseCount} mov.
                </span>
              </div>
              <div>
                <span
                  className={`text-[12px] block ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}
                >
                  Gastos Registrados
                </span>
                <span className="font-display text-[20px] font-extrabold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                  {hideBalance
                    ? `${curr.symbol} •••••`
                    : `${curr.symbol}${fmt(stats.totalExpenses)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Botones 3D de Acceso Directo a Alcancía y Suscripciones/Deudas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => onNavigate('alcancia')}
              className={`rounded-3xl p-4.5 text-left flex items-center justify-between gap-3 transition-all active:scale-98 group border ${
                isDark ? 'border-emerald-500/25' : 'border-emerald-500/20'
              } ${cardCls}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#62fae3]/40 text-[#006b5f] dark:text-[#62fae3] flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8)]">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    savings
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#006b5f] dark:text-[#62fae3] block">
                    Metas de Ahorro
                  </span>
                  <h4 className="font-display text-[15px] font-extrabold truncate">
                    Mis Alcancías ({savingsGoals.length})
                  </h4>
                  <span className="font-display text-[12px] font-bold text-[#006b5f] dark:text-[#62fae3] tabular-nums">
                    {hideBalance
                      ? `${curr.symbol} ••••`
                      : `${curr.symbol}${fmt(stats.totalSavedInGoals)} ahorrados`}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-[#006b5f] dark:text-[#62fae3] group-hover:translate-x-0.5 transition-transform">
                chevron_right
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('pagos')}
              className={`rounded-3xl p-4.5 text-left flex items-center justify-between gap-3 transition-all active:scale-98 group border ${
                isDark ? 'border-[#635bff]/30' : 'border-[#635bff]/20'
              } ${cardCls}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#e2dfff] text-[#321ed2] flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8)]">
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    event_repeat
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#493ee5] dark:text-[#c3c0ff] block">
                    Arriendo · Gym · Deudas
                  </span>
                  <h4 className="font-display text-[15px] font-extrabold truncate">
                    Suscripciones ({stats.pendingRemindersCount} pend.)
                  </h4>
                  <span className="font-display text-[12px] font-bold text-[#493ee5] dark:text-[#c3c0ff] tabular-nums">
                    {hideBalance
                      ? `${curr.symbol} ••••`
                      : `${curr.symbol}${fmt(stats.pendingRemindersAmount)} por pagar`}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-[#493ee5] dark:text-[#c3c0ff] group-hover:translate-x-0.5 transition-transform">
                chevron_right
              </span>
            </button>
          </div>

          {/* Radar de Fugas / Gastos Hormiga (Con espaciado amplio y tope editable) */}
          <div className={`rounded-3xl p-6 flex flex-col gap-4 ${cardCls}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-13 h-13 shrink-0 rounded-2xl bg-[#ffdadc] text-[#400010] flex items-center justify-center shadow-[0_6px_14px_rgba(164,47,70,0.2),inset_2px_2px_4px_rgba(255,255,255,0.85)]">
                  <span
                    className="material-symbols-outlined text-[25px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    bug_report
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h3 className="font-display text-[16px] font-extrabold leading-snug">
                    Radar de Fugas · Gastos Hormiga
                  </h3>
                  <p
                    className={`text-[12px] leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-[#464555]'
                    }`}
                  >
                    Micro-gastos, cafés, snacks y antojos diarios
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 font-display text-[11px] font-extrabold px-3 py-1.5 rounded-full ${
                  stats.hormigaPercent >= 75
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : stats.hormigaPercent >= 40
                    ? 'bg-[#fef08a] text-[#854d0e]'
                    : 'bg-[#62fae3] text-[#00201c]'
                }`}
              >
                {stats.hormigaPercent >= 75
                  ? '¡Fuga Alta!'
                  : stats.hormigaPercent >= 40
                  ? 'Alerta Moderada'
                  : 'Controlado'}
              </span>
            </div>

            {/* Editor de Tope de Gastos Hormiga */}
            {editingHormigaLimit && (
              <form
                onSubmit={handleSaveHormigaLimit}
                className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border ${
                  isDark
                    ? 'bg-[#12161f] border-[#635bff]/40'
                    : 'bg-[#f0f4f8] border-[#635bff]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="hormiga-limit-input"
                    className="font-display text-[12px] font-bold text-[#493ee5] dark:text-[#c3c0ff]"
                  >
                    Definir tope mensual de gastos hormiga ({curr.code})
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingHormigaLimit(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 font-bold"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-[14px] font-bold text-slate-400">
                      {curr.symbol}
                    </span>
                    <input
                      id="hormiga-limit-input"
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={formatLiveNumberString(hormigaLimitInput, curr.code)}
                      onChange={(e) =>
                        setHormigaLimitInput(parseTypedCurrencyInput(e.target.value, curr.code))
                      }
                      placeholder="Ej. 150.000"
                      className={`w-full h-10 pl-8 pr-3 rounded-xl font-display text-[14px] font-bold tabular-nums focus:outline-none ${
                        isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-[#635bff] text-white font-display text-[12px] font-bold active:scale-95 transition-transform"
                  >
                    Guardar tope
                  </button>
                </div>
              </form>
            )}

            <div
              className={`p-4 rounded-2xl flex flex-col gap-3 ${
                isDark
                  ? 'bg-[#12161f]'
                  : 'bg-[#f0f4f8] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.07),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-baseline flex-wrap gap-2">
                  <span className="font-display text-[22px] font-extrabold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                    {hideBalance
                      ? `${curr.symbol} ••••`
                      : `${curr.symbol}${fmt(stats.totalHormiga)}`}
                  </span>
                  <span className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                    de {curr.symbol}
                    {fmt(stats.hormigaLimit)}{' '}
                    {stats.hasCustomLimit ? 'tope mensual' : 'tope sugerido'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenHormigaEditor}
                    className={`px-2.5 py-1 rounded-xl font-display text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      isDark
                        ? 'bg-slate-800 text-[#c3c0ff] hover:bg-slate-700'
                        : 'bg-white text-[#493ee5] shadow-2xs hover:bg-[#e2dfff]/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    <span>{stats.hormigaLimit > 0 ? 'Cambiar tope' : 'Poner tope'}</span>
                  </button>
                  <span className="font-display text-[13px] font-extrabold tabular-nums">
                    {stats.hormigaPercent}%
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-black/40 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    stats.hormigaPercent >= 75
                      ? 'bg-gradient-to-r from-[#fb7185] to-[#e11d48]'
                      : stats.hormigaPercent >= 40
                      ? 'bg-gradient-to-r from-[#f59e0b] to-[#ea580c]'
                      : 'bg-gradient-to-r from-[#2dd4bf] to-[#006b5f]'
                  }`}
                  style={{
                    width: `${stats.totalHormiga === 0 ? 0 : Math.max(6, stats.hormigaPercent)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-[#464555]'}>
                  Proyección de fuga anual a este ritmo:
                </span>
                <span className="font-display font-bold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                  {hideBalance
                    ? `${curr.symbol} ••••/año`
                    : `${curr.symbol}${fmt(stats.hormigaAnnual)}/año`}
                </span>
              </div>
            </div>

            {hormigaByCategory.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {hormigaByCategory.slice(0, 3).map(({ cat, amount }) => (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-2xl flex flex-col gap-1 ${
                      isDark ? 'bg-slate-800/60' : 'bg-[#f6fafe]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#a42f46] dark:text-[#ffb2b9]">
                        {cat.icon}
                      </span>
                      <span className="font-display text-[11px] font-bold truncate">
                        {cat.name.split(' ')[0]}
                      </span>
                    </div>
                    <span className="font-display text-[13px] font-extrabold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                      {hideBalance ? `${curr.symbol}•••` : `${curr.symbol}${fmt(amount)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha en PC (5 cols): Listado de Movimientos Recientes */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-display text-[16px] font-bold">Movimientos Recientes</h3>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                {filteredMovements.length} registros
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('add')}
              className="font-display text-[12px] font-bold text-[#493ee5] dark:text-[#c3c0ff] hover:underline"
            >
              + Nuevo
            </button>
          </div>

          <div
            className={`grid grid-cols-5 gap-1 p-1.5 rounded-2xl ${
              isDark ? 'bg-[#12161f]' : 'bg-[#eaeef2]'
            }`}
          >
            {[
              { id: 'all', label: 'Todos' },
              { id: 'hormiga', label: 'Hormiga' },
              { id: 'fijo', label: 'Fijos' },
              { id: 'ingreso', label: 'Ingresos' },
              { id: 'alcancia', label: 'Alcancía' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterType(tab.id as 'all' | MovementType);
                  setVisibleLimit(25);
                }}
                className={`py-2 px-1.5 rounded-xl font-display text-[10px] font-bold transition-all whitespace-nowrap text-center ${
                  filterType === tab.id
                    ? isDark
                      ? 'bg-[#635bff] text-white'
                      : 'bg-white text-[#171c1f] shadow-sm'
                    : isDark
                    ? 'text-slate-400'
                    : 'text-[#464555]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <span
              className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] ${
                isDark ? 'text-slate-500' : 'text-[#777587]'
              }`}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleLimit(25);
              }}
              placeholder="Buscar café, suscripción, sueldo, alcancía..."
              className={`w-full h-11 pl-10 pr-4 rounded-2xl text-[13px] focus:outline-none ${
                isDark
                  ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500'
                  : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_4px_rgba(15,23,42,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
              }`}
            />
          </div>

          {displayedMovements.length === 0 ? (
            <div
              className={`rounded-3xl p-8 text-center flex flex-col items-center gap-2 ${cardCls}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#e2dfff]/60 text-[#493ee5] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <p className="font-display text-[15px] font-bold">Sin movimientos registrados</p>
              <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                Pulsa el botón &ldquo;+&rdquo; para registrar un gasto, ingreso o ahorro en
                alcancía.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {displayedMovements.map((mov) => {
                const cat = CATEGORIES[mov.category] || CATEGORIES.otros;
                const isIncome = mov.type === 'ingreso';
                const isHormiga = mov.type === 'hormiga';
                const isAlcancia = mov.type === 'alcancia';

                return (
                  <div
                    key={mov.id}
                    className={`rounded-2xl p-4 flex flex-col gap-2.5 ${cardCls}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.8)] ${
                            isDark
                              ? `${cat.bgDark} ${cat.textDark}`
                              : `${cat.bgLight} ${cat.textLight}`
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {cat.icon}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-display text-[14.5px] font-bold leading-snug break-words">
                            {mov.title}
                          </span>
                          <div
                            className={`flex items-center gap-1.5 flex-wrap text-[11px] mt-0.5 ${
                              isDark ? 'text-slate-400' : 'text-[#464555]'
                            }`}
                          >
                            <span>{cat.name}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {isIncome
                                ? 'Ingreso'
                                : isAlcancia
                                ? 'Alcancía'
                                : isHormiga
                                ? 'Hormiga'
                                : 'Gasto Fijo'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatRelativeDate(mov.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`font-display text-[15px] font-extrabold tabular-nums ${
                            isIncome
                              ? 'text-[#006b5f] dark:text-[#62fae3]'
                              : isAlcancia
                              ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                              : isHormiga
                              ? 'text-[#a42f46] dark:text-[#ffb2b9]'
                              : ''
                          }`}
                        >
                          {hideBalance ? `${curr.symbol} •••` : `${curr.symbol}${fmt(mov.amount)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMovement(mov.id)}
                          title="Eliminar movimiento"
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredMovements.length > visibleLimit && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((v) => v + 25)}
                  className={`w-full py-2.5 rounded-2xl font-display text-[12px] font-bold transition-all ${
                    isDark
                      ? 'bg-[#1b202c] text-[#c3c0ff] hover:bg-slate-800'
                      : 'bg-white text-[#493ee5] shadow-xs hover:bg-[#f0f4f8]'
                  }`}
                >
                  Mostrar más ({filteredMovements.length - visibleLimit} restantes)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
