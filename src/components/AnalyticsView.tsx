import React, { useMemo, useState } from 'react';
import { CATEGORIES, CURRENCIES, formatCurrencyAmount } from '../constants/walletData';
import { Movement, UserProfile } from '../types/wallet';

interface AnalyticsViewProps {
  profile: UserProfile;
  movements: Movement[];
  isDark: boolean;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  profile,
  movements,
  isDark,
}) => {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [visibleHistoryLimit, setVisibleHistoryLimit] = useState(25);

  // O(1) Pre-indexed Month Map so filtering by month is instantaneous even with thousands of movements
  const { availableMonths, monthIndexedMovements } = useMemo(() => {
    const map: Record<string, Movement[]> = {};
    const set = new Set<string>([currentMonthStr]);

    for (let i = 0; i < movements.length; i++) {
      const m = movements[i];
      const ym = m.date && m.date.length >= 7 ? m.date.slice(0, 7) : currentMonthStr;
      set.add(ym);
      if (!map[ym]) map[ym] = [];
      map[ym].push(m);
    }

    return {
      availableMonths: Array.from(set).sort((a, b) => b.localeCompare(a)),
      monthIndexedMovements: map,
    };
  }, [movements, currentMonthStr]);

  const formatMonthLabel = (ym: string) => {
    if (ym === 'ALL') return 'Todo el historial';
    const [year, month] = ym.split('-');
    const idx = (parseInt(month, 10) || 1) - 1;
    return `${MONTH_NAMES[idx] || month} ${year}`;
  };

  const activeMovements = useMemo(() => {
    if (selectedMonth === 'ALL') return movements;
    return monthIndexedMovements[selectedMonth] || [];
  }, [selectedMonth, movements, monthIndexedMovements]);

  const analytics = useMemo(() => {
    let income = 0;
    let fixed = 0;
    let hormiga = 0;
    let alcanciaSaved = 0;
    const catTotals: Record<string, number> = {};

    for (let i = 0; i < activeMovements.length; i++) {
      const m = activeMovements[i];
      if (m.type === 'ingreso') {
        income += m.amount;
      } else if (m.type === 'alcancia') {
        alcanciaSaved += m.amount;
      } else if (m.type === 'retiro_alcancia') {
        alcanciaSaved = Math.max(0, alcanciaSaved - m.amount);
      } else {
        if (m.type === 'fijo') fixed += m.amount;
        if (m.type === 'hormiga') hormiga += m.amount;
        catTotals[m.category] = (catTotals[m.category] || 0) + m.amount;
      }
    }

    const baseIncome = (profile.monthlyIncome || 0) + income;
    const totalExpenses = fixed + hormiga;
    const savings = Math.max(0, baseIncome - totalExpenses);
    const savingsRate = baseIncome > 0 ? Math.round((savings / baseIncome) * 100) : 0;
    const hormigaRatio = baseIncome > 0 ? (hormiga / baseIncome) * 100 : 0;

    // Score Financiero
    const rawScore =
      baseIncome === 0 && totalExpenses === 0
        ? 0
        : Math.round(
            550 + Math.min(savingsRate * 5.5, 350) - Math.min(hormigaRatio * 14, 250)
          );
    const financialScore = rawScore === 0 ? 0 : Math.max(320, Math.min(980, rawScore));

    const categoryBreakdown = Object.entries(catTotals)
      .map(([id, amt]) => {
        const meta = CATEGORIES[id as keyof typeof CATEGORIES] || CATEGORIES.otros;
        const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
        return {
          id,
          meta,
          amount: amt,
          percent: pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      baseIncome,
      totalExpenses,
      fixed,
      hormiga,
      alcanciaSaved,
      savings,
      savingsRate,
      financialScore,
      categoryBreakdown,
    };
  }, [activeMovements, profile.monthlyIncome]);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const fmt = (val: number) => formatCurrencyAmount(val, curr.code);

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  // Build SVG Donut Segments
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const donutSegments = analytics.categoryBreakdown.map((item) => {
    const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += item.percent;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeItem =
    analytics.categoryBreakdown.find((c) => c.id === selectedCat) ||
    analytics.categoryBreakdown[0];

  const windowedMonthMovements = useMemo(
    () => activeMovements.slice(0, visibleHistoryLimit),
    [activeMovements, visibleHistoryLimit]
  );

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Cabecera de Filtro por Meses en Analíticas (Indexado O(1) sin lentitud) */}
      <div className={`rounded-3xl p-4 sm:p-5 flex flex-col gap-3 ${cardCls}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e2dfff] text-[#321ed2] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
            <div>
              <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#635bff] dark:text-[#c3c0ff] block">
                Filtro por Meses · Ultra-Rápido
              </span>
              <h2 className="font-display text-[17px] font-extrabold leading-tight">
                Analizando: {formatMonthLabel(selectedMonth)}
              </h2>
            </div>
          </div>

          {/* Selector desplegable + contador */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Seleccionar mes para analíticas"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setVisibleHistoryLimit(25);
              }}
              className={`h-10 px-3.5 rounded-2xl font-display text-[12px] font-extrabold focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-[#12161f] text-slate-100 border border-white/10'
                  : 'bg-[#f0f4f8] text-[#171c1f]'
              }`}
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
              <option value="ALL">Todo el historial ({movements.length})</option>
            </select>
          </div>
        </div>

        {/* Botones rápidos de meses */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {availableMonths.map((ym) => (
            <button
              key={ym}
              type="button"
              onClick={() => {
                setSelectedMonth(ym);
                setVisibleHistoryLimit(25);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-display text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedMonth === ym
                  ? 'bg-[#635bff] text-white shadow-sm'
                  : isDark
                  ? 'bg-[#12161f] text-slate-300'
                  : 'bg-[#f0f4f8] text-[#464555]'
              }`}
            >
              {formatMonthLabel(ym)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedMonth('ALL');
              setVisibleHistoryLimit(25);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-display text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedMonth === 'ALL'
                ? 'bg-[#635bff] text-white shadow-sm'
                : isDark
                ? 'bg-[#12161f] text-slate-300'
                : 'bg-[#f0f4f8] text-[#464555]'
            }`}
          >
            Todo ({movements.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start gap-5">
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* 1. Indicador de Score Financiero y Métricas de Ahorro */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#493ee5] via-[#635bff] to-[#321ed2] text-white shadow-[0_20px_36px_-8px_rgba(99,91,255,0.45),inset_3px_4px_7px_rgba(255,255,255,0.45),inset_-4px_-4px_8px_rgba(15,0,105,0.4)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#62fae3]">
                  Salud Financiera · {formatMonthLabel(selectedMonth)}
                </span>
                <h2 className="font-display text-[22px] font-extrabold leading-tight">
                  Score FlickWallet
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#62fae3] text-[#00201c] font-display text-[11px] font-extrabold shadow-sm">
                {analytics.financialScore >= 780
                  ? 'Nivel Excelente'
                  : analytics.financialScore >= 620
                  ? 'Nivel Estable'
                  : 'En Alerta'}
              </span>
            </div>

            <div className="flex items-center gap-5">
              {/* Circular Score SVG Ring */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#62fae3"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(analytics.financialScore / 1000) * 301.6} 301.6`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-[26px] font-extrabold leading-none tabular-nums">
                    {analytics.financialScore}
                  </span>
                  <span className="font-display text-[10px] font-bold text-white/75">
                    / 1000 pts
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 flex-1">
                <div className="p-3 rounded-2xl bg-white/12 backdrop-blur-xs">
                  <span className="text-[11px] text-white/80 block">Tasa de Ahorro del Mes</span>
                  <span className="font-display text-[20px] font-extrabold text-[#62fae3] tabular-nums">
                    {analytics.savingsRate}% ({`${curr.symbol}${fmt(analytics.savings)}`})
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/12 backdrop-blur-xs">
                  <span className="text-[11px] text-white/80 block">Guardado en Alcancías</span>
                  <span className="font-display text-[17px] font-extrabold text-white tabular-nums">
                    {curr.symbol}
                    {fmt(analytics.alcanciaSaved)} {curr.code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Gráfico Circular (Donut SVG) de Distribución de Gastos */}
          <div className={`rounded-3xl p-5 flex flex-col gap-4 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[16px] font-bold">Distribución Porcentual</h3>
                <p className={`text-[12px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                  Toca una categoría para inspeccionar su peso
                </p>
              </div>
              <span className="font-display text-[13px] font-extrabold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                Total: {curr.symbol}
                {fmt(analytics.totalExpenses)} {curr.code}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              {/* Interactive SVG Donut */}
              <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={isDark ? '#12161f' : '#f0f4f8'}
                    strokeWidth="22"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={seg.meta.colorHex}
                      strokeWidth={selectedCat === seg.id ? '26' : '22'}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => setSelectedCat(seg.id)}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                  {activeItem ? (
                    <>
                      <span
                        className="material-symbols-outlined text-[22px] text-[#493ee5] dark:text-[#c3c0ff]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {activeItem.meta.icon}
                      </span>
                      <span className="font-display text-[20px] font-extrabold tabular-nums">
                        {activeItem.percent}%
                      </span>
                      <span
                        className={`text-[10px] font-display font-bold truncate max-w-[95px] ${
                          isDark ? 'text-slate-400' : 'text-[#464555]'
                        }`}
                      >
                        {activeItem.meta.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs">Sin gastos</span>
                  )}
                </div>
              </div>

              {/* Type Split Summary (Fijos vs Hormiga vs Ahorro) */}
              <div className="flex flex-col gap-2.5 w-full">
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between ${
                    isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#635bff]" />
                    <span className="font-display text-[12px] font-bold">Gastos Fijos</span>
                  </div>
                  <span className="font-display text-[14px] font-extrabold tabular-nums">
                    {curr.symbol}
                    {fmt(analytics.fixed)} (
                    {analytics.totalExpenses > 0
                      ? Math.round((analytics.fixed / analytics.totalExpenses) * 100)
                      : 0}
                    %)
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between ${
                    isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#fb7185]" />
                    <span className="font-display text-[12px] font-bold">Gastos Hormiga</span>
                  </div>
                  <span className="font-display text-[14px] font-extrabold text-[#a42f46] dark:text-[#ffb2b9] tabular-nums">
                    {curr.symbol}
                    {fmt(analytics.hormiga)} (
                    {analytics.totalExpenses > 0
                      ? Math.round((analytics.hormiga / analytics.totalExpenses) * 100)
                      : 0}
                    %)
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between ${
                    isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <span className="font-display text-[12px] font-bold">Ahorro Neto</span>
                  </div>
                  <span className="font-display text-[14px] font-extrabold text-[#006b5f] dark:text-[#62fae3] tabular-nums">
                    {curr.symbol}
                    {fmt(analytics.savings)} ({analytics.savingsRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (6 cols): Desglose por Categoría + Historial Paginado del Mes */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-3.5 ${cardCls}`}>
            <h3 className="font-display text-[16px] font-bold">
              Desglose por Categoría · {formatMonthLabel(selectedMonth)}
            </h3>

            {analytics.categoryBreakdown.length === 0 ? (
              <p className={`text-[12px] py-4 ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                No hay gastos registrados en este mes para mostrar categorías.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {analytics.categoryBreakdown.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCat(item.id)}
                    className={`p-3 rounded-2xl flex flex-col gap-2 text-left transition-all ${
                      selectedCat === item.id
                        ? isDark
                          ? 'bg-slate-800 ring-2 ring-[#635bff]'
                          : 'bg-[#e2dfff]/40 ring-2 ring-[#493ee5]'
                        : isDark
                        ? 'bg-[#12161f]'
                        : 'bg-[#f0f4f8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[19px] text-[#493ee5] dark:text-[#c3c0ff]">
                          {item.meta.icon}
                        </span>
                        <span className="font-display text-[13px] font-bold">{item.meta.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[13px] font-extrabold tabular-nums">
                          {curr.symbol}
                          {fmt(item.amount)}
                        </span>
                        <span className="font-display text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 tabular-nums">
                          {item.percent}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-black/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, item.percent)}%`,
                          backgroundColor: item.meta.colorHex,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Historial Paginado del Mes Seleccionado (optimizado para miles de datos) */}
          <div className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-3.5 ${cardCls}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-[16px] font-bold">
                  Movimientos de {formatMonthLabel(selectedMonth)}
                </h3>
                <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                  {activeMovements.length} registros en este periodo
                </span>
              </div>
            </div>

            {windowedMonthMovements.length === 0 ? (
              <p className={`text-[12px] py-3 ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
                Sin movimientos en este mes.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {windowedMonthMovements.map((mov) => {
                  const cat = CATEGORIES[mov.category] || CATEGORIES.otros;
                  return (
                    <div
                      key={mov.id}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 ${
                        isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="material-symbols-outlined text-[19px] text-[#493ee5] dark:text-[#c3c0ff]">
                          {cat.icon}
                        </span>
                        <div className="min-w-0">
                          <span className="font-display text-[13px] font-bold block truncate">
                            {mov.title}
                          </span>
                          <span
                            className={`text-[10px] ${
                              isDark ? 'text-slate-400' : 'text-[#464555]'
                            }`}
                          >
                            {cat.name} ·{' '}
                            {new Date(mov.date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="font-display text-[13px] font-extrabold tabular-nums shrink-0">
                        {curr.symbol}
                        {fmt(mov.amount)}
                      </span>
                    </div>
                  );
                })}

                {activeMovements.length > visibleHistoryLimit && (
                  <button
                    type="button"
                    onClick={() => setVisibleHistoryLimit((v) => v + 25)}
                    className="w-full py-2.5 rounded-2xl bg-[#635bff]/15 text-[#635bff] dark:text-[#c3c0ff] font-display text-[12px] font-bold"
                  >
                    Ver más movimientos ({activeMovements.length - visibleHistoryLimit} restantes)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
