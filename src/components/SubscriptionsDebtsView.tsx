import React, { useState } from 'react';
import {
  CURRENCIES,
  formatCurrencyAmount,
  formatLiveNumberString,
  parseTypedCurrencyInput,
} from '../constants/walletData';
import {
  ActiveTab,
  CategoryId,
  Movement,
  PaymentReminder,
  ReminderKind,
  UserProfile,
} from '../types/wallet';

interface SubscriptionsDebtsViewProps {
  profile: UserProfile;
  reminders: PaymentReminder[];
  onAddReminder: (rem: Omit<PaymentReminder, 'id' | 'paidMonths' | 'createdAt'>) => void;
  onTogglePaidReminder: (remId: string, monthKey: string) => void;
  onDeleteReminder: (remId: string) => void;
  onAddMovement: (mov: Omit<Movement, 'id' | 'date'>) => void;
  onTriggerNotification: (opts: {
    title: string;
    body: string;
    emoji: string;
    accent?: 'indigo' | 'mint' | 'rose' | 'amber';
    actionTab?: ActiveTab;
    actionLabel?: string;
  }) => void;
  onNavigate: (tab: ActiveTab) => void;
  hideBalance: boolean;
  isDark: boolean;
}

const KIND_META: Record<
  ReminderKind,
  { label: string; icon: string; badgeCls: string; category: CategoryId }
> = {
  arriendo: {
    label: 'Arriendo / Hogar',
    icon: 'home',
    badgeCls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    category: 'vivienda',
  },
  gym: {
    label: 'Gym y Salud',
    icon: 'fitness_center',
    badgeCls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    category: 'salud',
  },
  suscripcion: {
    label: 'Suscripción',
    icon: 'subscriptions',
    badgeCls: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    category: 'streaming',
  },
  deuda: {
    label: 'Deuda / Cuota',
    icon: 'credit_card',
    badgeCls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    category: 'otros',
  },
  pago_mes: {
    label: 'Servicios del Mes',
    icon: 'receipt_long',
    badgeCls: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    category: 'servicios',
  },
};

export const SubscriptionsDebtsView: React.FC<SubscriptionsDebtsViewProps> = ({
  profile,
  reminders,
  onAddReminder,
  onTogglePaidReminder,
  onDeleteReminder,
  onAddMovement,
  onTriggerNotification,
  hideBalance,
  isDark,
}) => {
  const [showAddForm, setShowAddForm] = useState(reminders.length === 0);
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('');
  const [kind, setKind] = useState<ReminderKind>('suscripcion');
  const [totalInstallmentsRaw, setTotalInstallmentsRaw] = useState('');
  const [paidOffsetRaw, setPaidOffsetRaw] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | ReminderKind>('all');
  const [recordInWalletOnPay, setRecordInWalletOnPay] = useState(true);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;
  const fmt = (val: number) => formatCurrencyAmount(val, curr.code);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const todayDay = new Date().getDate();

  const totalMonthlyCommitment = reminders.reduce((acc, r) => acc + r.amount, 0);
  const totalPendingThisMonth = reminders
    .filter((r) => !r.paidMonths.includes(currentMonthKey))
    .reduce((acc, r) => acc + r.amount, 0);
  const pendingCount = reminders.filter((r) => !r.paidMonths.includes(currentMonthKey)).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountRaw) || 0;
    const day = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
    if (!title.trim() || amt <= 0) return;

    const meta = KIND_META[kind];
    const totalInst = parseInt(totalInstallmentsRaw, 10) || 0;
    const paidOff = Math.max(0, parseInt(paidOffsetRaw, 10) || 0);

    onAddReminder({
      title: title.trim(),
      amount: amt,
      dayOfMonth: day,
      kind,
      emoji: meta.icon,
      totalInstallments: totalInst > 0 ? totalInst : undefined,
      paidInstallmentsOffset: totalInst > 0 ? Math.min(totalInst, paidOff) : undefined,
    });

    onTriggerNotification({
      title: `Compromiso agendado: ${title.trim()}`,
      body:
        totalInst > 0
          ? `Día ${day} · ${curr.symbol}${fmt(amt)}/mes (${Math.min(
              totalInst,
              paidOff
            )}/${totalInst} cuotas)`
          : `Día ${day} de cada mes · ${curr.symbol}${fmt(amt)} ${curr.code}`,
      emoji: meta.icon,
      accent: 'indigo',
    });

    setTitle('');
    setAmountRaw('');
    setDayOfMonth('');
    setTotalInstallmentsRaw('');
    setPaidOffsetRaw('');
    setShowAddForm(false);
  };

  const handleMarkPaid = (rem: PaymentReminder) => {
    const isAlreadyPaid = rem.paidMonths.includes(currentMonthKey);
    onTogglePaidReminder(rem.id, currentMonthKey);

    if (!isAlreadyPaid) {
      const meta = KIND_META[rem.kind] || KIND_META.pago_mes;
      if (recordInWalletOnPay) {
        onAddMovement({
          title: `Pago: ${rem.title}`,
          amount: rem.amount,
          type: 'fijo',
          category: meta.category,
        });
      }
      onTriggerNotification({
        title: `${rem.title} pagado al día`,
        body: recordInWalletOnPay
          ? `Pagado este mes · ${curr.symbol}${fmt(rem.amount)} ${curr.code} descontado de tu saldo.`
          : `Marcado como pagado en tu calendario de este mes.`,
        emoji: 'check_circle',
        accent: 'mint',
      });
    }
  };

  const filteredReminders = reminders
    .filter((r) => filterKind === 'all' || r.kind === filterKind)
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  const cardCls = isDark
    ? 'bg-[#1b202c] text-slate-100 shadow-[0_14px_28px_-6px_rgba(0,0,0,0.45),inset_2px_2px_4px_rgba(255,255,255,0.06)]'
    : 'bg-white text-[#171c1f] shadow-[0_12px_26px_-6px_rgba(99,91,255,0.09),0_4px_10px_-2px_rgba(15,23,42,0.04),inset_3px_3px_6px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(15,23,42,0.03)]';

  const inputWell = isDark
    ? 'bg-[#12161f] text-slate-100 placeholder:text-slate-500 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.55)]'
    : 'bg-[#f0f4f8] text-[#171c1f] placeholder:text-[#777587] shadow-[inset_2px_2px_5px_rgba(15,23,42,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.9)]';

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Banner Superior: Resumen de Suscripciones, Arriendo, Gym y Deudas */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#493ee5] via-[#635bff] to-[#312e81] text-white shadow-[0_20px_36px_-8px_rgba(99,91,255,0.45),inset_3px_4px_7px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(15,0,105,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6)] shrink-0">
            <span
              className="material-symbols-outlined text-[26px] text-[#62fae3]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              event_repeat
            </span>
          </div>
          <div className="min-w-0">
            <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#62fae3] block">
              Arriendo · Gym · Suscripciones · Deudas
            </span>
            <h2 className="font-display text-[22px] sm:text-[24px] font-extrabold leading-tight break-words">
              {hideBalance
                ? `${curr.symbol} •••••••`
                : `${curr.symbol}${fmt(totalPendingThisMonth)}`}{' '}
              <span className="text-[12px] font-bold text-[#62fae3] block sm:inline">
                pendientes este mes
              </span>
            </h2>
            <p className="text-[11.5px] text-white/85 mt-1">
              Total mensual:{' '}
              <strong>
                {hideBalance
                  ? `${curr.symbol} ••••`
                  : `${curr.symbol}${fmt(totalMonthlyCommitment)} ${curr.code}`}
              </strong>{' '}
              ({pendingCount} por pagar)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-[#62fae3] text-[#00201c] font-display text-[13px] font-extrabold flex items-center justify-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)] active:scale-95 transition-transform shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            {showAddForm ? 'close' : 'add'}
          </span>
          <span>{showAddForm ? 'Cerrar formulario' : 'Añadir Compromiso'}</span>
        </button>
      </div>

      {/* Formulario para agregar Suscripción, Arriendo, Gym o Deuda */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 border-2 ${
            isDark ? 'border-[#635bff]/50' : 'border-[#635bff]/30'
          } ${cardCls}`}
        >
          <div>
            <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#635bff] dark:text-[#c3c0ff]">
              Nuevo Compromiso Mensual
            </span>
            <h3 className="font-display text-[17px] font-extrabold">
              Agendar Arriendo, Gym, Suscripción o Deuda
            </h3>
          </div>

          {/* Selector de Tipo */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(KIND_META) as ReminderKind[]).map((k) => {
              const m = KIND_META[k];
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`py-2.5 px-3 rounded-2xl font-display text-[11px] font-bold flex items-center sm:flex-col justify-center gap-1.5 border-2 transition-all active:scale-95 ${
                    active
                      ? 'border-[#635bff] bg-[#e2dfff]/50 text-[#0f0069] dark:bg-[#635bff]/30 dark:text-white'
                      : isDark
                      ? 'border-transparent bg-[#12161f] text-slate-400'
                      : 'border-transparent bg-[#f0f4f8] text-[#464555]'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[19px] shrink-0"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {m.icon}
                  </span>
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-5 flex flex-col gap-1">
              <label className="font-display text-[12px] font-bold" htmlFor="rem-title">
                Concepto
              </label>
              <input
                id="rem-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe el nombre del compromiso"
                className={`w-full h-12 px-4 rounded-2xl font-display text-[14px] font-bold focus:outline-none ${inputWell}`}
              />
            </div>

            <div className="sm:col-span-4 flex flex-col gap-1">
              <label className="font-display text-[12px] font-bold" htmlFor="rem-amount">
                Valor mensual ({curr.code})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-[14px] font-bold text-slate-400">
                  {curr.symbol}
                </span>
                <input
                  id="rem-amount"
                  type="text"
                  inputMode="decimal"
                  required
                  value={formatLiveNumberString(amountRaw, curr.code)}
                  onChange={(e) =>
                    setAmountRaw(parseTypedCurrencyInput(e.target.value, curr.code))
                  }
                  placeholder="0"
                  className={`w-full h-12 pl-9 pr-3 rounded-2xl font-display text-[15px] font-extrabold tabular-nums focus:outline-none ${inputWell}`}
                />
              </div>
            </div>

            <div className="sm:col-span-3 flex flex-col gap-1">
              <label className="font-display text-[12px] font-bold" htmlFor="rem-day">
                Día de corte (1-31)
              </label>
              <input
                id="rem-day"
                type="number"
                min={1}
                max={31}
                required
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="1 - 31"
                className={`w-full h-12 px-3 rounded-2xl font-display text-[15px] font-extrabold text-center tabular-nums focus:outline-none ${inputWell}`}
              />
            </div>
          </div>

          {/* Seguimiento de Cuotas (Ej. Deuda a 12 meses) */}
          <div
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border ${
              isDark ? 'bg-[#12161f] border-white/10' : 'bg-[#f0f4f8] border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[11.5px] font-extrabold text-[#493ee5] dark:text-[#c3c0ff]">
                Control por Cuotas (Opcional · Ideal para Deudas o Créditos)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-bold" htmlFor="rem-total-inst">
                  Total de cuotas (deja vacío si es fijo indefinido)
                </label>
                <input
                  id="rem-total-inst"
                  type="number"
                  min={1}
                  max={360}
                  value={totalInstallmentsRaw}
                  onChange={(e) => setTotalInstallmentsRaw(e.target.value)}
                  placeholder="0"
                  className={`w-full h-10 px-3.5 rounded-xl font-display text-[13px] font-bold tabular-nums focus:outline-none ${
                    isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-display text-[11px] font-bold" htmlFor="rem-paid-inst">
                  Cuotas ya pagadas anteriormente
                </label>
                <input
                  id="rem-paid-inst"
                  type="number"
                  min={0}
                  max={360}
                  value={paidOffsetRaw}
                  onChange={(e) => setPaidOffsetRaw(e.target.value)}
                  placeholder="0"
                  className={`w-full h-10 px-3.5 rounded-xl font-display text-[13px] font-bold tabular-nums focus:outline-none ${
                    isDark ? 'bg-[#1b202c] text-white' : 'bg-white text-[#171c1f]'
                  }`}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#635bff] text-white font-display text-[14px] font-extrabold shadow-[0_12px_24px_-4px_rgba(99,91,255,0.45),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:scale-98 transition-all"
          >
            Guardar Compromiso Mensual
          </button>
        </form>
      )}

      {/* Barra de Filtros + Opción de descontar automáticamente al pagar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todos', icon: 'apps' },
            { id: 'arriendo', label: 'Arriendo', icon: 'home' },
            { id: 'gym', label: 'Gym', icon: 'fitness_center' },
            { id: 'suscripcion', label: 'Suscripciones', icon: 'subscriptions' },
            { id: 'deuda', label: 'Deudas', icon: 'credit_card' },
            { id: 'pago_mes', label: 'Servicios', icon: 'receipt_long' },
          ].map((tab) => {
            const active = filterKind === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterKind(tab.id as 'all' | ReminderKind)}
                className={`px-3.5 py-2 rounded-xl font-display text-[11.5px] font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'bg-[#635bff] text-white shadow-xs'
                    : isDark
                    ? 'bg-[#1b202c] text-slate-300'
                    : 'bg-white text-[#464555]'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-[12px] font-display font-bold cursor-pointer px-1">
          <input
            type="checkbox"
            checked={recordInWalletOnPay}
            onChange={(e) => setRecordInWalletOnPay(e.target.checked)}
            className="w-4 h-4 rounded accent-[#635bff]"
          />
          <span className={isDark ? 'text-slate-300' : 'text-[#464555]'}>
            Registrar en mis gastos al marcar &ldquo;Pagado&rdquo;
          </span>
        </label>
      </div>

      {/* Lista de Pagos, Suscripciones, Arriendo, Gym y Deudas */}
      {filteredReminders.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center flex flex-col items-center gap-3 ${cardCls}`}>
          <div className="w-15 h-15 rounded-3xl bg-[#e2dfff] text-[#321ed2] flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">event_repeat</span>
          </div>
          <h3 className="font-display text-[17px] font-extrabold">
            Sin compromisos registrados aquí
          </h3>
          <p className={`text-[12.5px] max-w-md ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
            Agrega tus pagos mensuales desde cero para controlar tus fechas de corte.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReminders.map((rem) => {
            const isPaid = rem.paidMonths.includes(currentMonthKey);
            const daysDiff = rem.dayOfMonth - todayDay;
            const isOverdue = !isPaid && daysDiff < 0;
            const isDueSoon = !isPaid && daysDiff >= 0 && daysDiff <= 3;
            const meta = KIND_META[rem.kind] || KIND_META.pago_mes;

            const hasInstallments = Boolean(rem.totalInstallments && rem.totalInstallments > 0);
            const totalInst = rem.totalInstallments || 0;
            const paidInst = hasInstallments
              ? Math.min(totalInst, (rem.paidInstallmentsOffset || 0) + rem.paidMonths.length)
              : 0;
            const remainingInst = hasInstallments ? Math.max(0, totalInst - paidInst) : 0;
            const instPct =
              hasInstallments && totalInst > 0 ? Math.round((paidInst / totalInst) * 100) : 0;

            return (
              <div
                key={rem.id}
                className={`rounded-3xl p-5 flex flex-col gap-4 border transition-all ${
                  isOverdue
                    ? 'border-rose-500/50'
                    : isDueSoon
                    ? 'border-amber-500/50'
                    : isPaid
                    ? 'border-emerald-500/40'
                    : isDark
                    ? 'border-white/5'
                    : 'border-slate-200/60'
                } ${cardCls}`}
              >
                {/* Fila 1: Icono + Título Completo + Etiqueta + Botón Eliminar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        isPaid
                          ? 'bg-[#62fae3]/35 text-[#006b5f] dark:text-[#62fae3]'
                          : isOverdue
                          ? 'bg-[#ffdad6] text-[#93000a]'
                          : 'bg-[#e2dfff]/70 text-[#321ed2] dark:bg-[#635bff]/20 dark:text-[#c3c0ff]'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[23px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {isPaid ? 'check_circle' : meta.icon}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-display text-[16px] font-extrabold leading-snug break-words ${
                            isPaid ? 'line-through opacity-75' : ''
                          }`}
                        >
                          {rem.title}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-display text-[10px] font-bold shrink-0 ${meta.badgeCls}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[12px]">
                        <span className={isDark ? 'text-slate-400' : 'text-[#464555]'}>
                          Día {rem.dayOfMonth} de cada mes
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-display font-extrabold ${
                            isPaid
                              ? 'text-[#006b5f] dark:text-[#62fae3]'
                              : isOverdue
                              ? 'text-rose-500'
                              : isDueSoon
                              ? 'text-amber-500'
                              : isDark
                              ? 'text-slate-300'
                              : 'text-[#493ee5]'
                          }`}
                        >
                          {isPaid
                            ? 'Pagado este mes'
                            : isOverdue
                            ? `Venció hace ${Math.abs(daysDiff)} días`
                            : daysDiff === 0
                            ? 'Vence hoy'
                            : `Vence en ${daysDiff} días`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteReminder(rem.id)}
                    title="Eliminar compromiso"
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                {/* Barra de progreso de Cuotas (si tiene cuotas configuradas) */}
                {hasInstallments && (
                  <div
                    className={`p-3 rounded-2xl flex flex-col gap-1.5 border ${
                      isDark
                        ? 'bg-[#12161f] border-[#635bff]/30'
                        : 'bg-[#f6fafe] border-[#635bff]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11.5px] font-display font-extrabold flex-wrap gap-1">
                      <span className="text-[#493ee5] dark:text-[#c3c0ff]">
                        Cuota {paidInst} de {totalInst} pagadas ({instPct}%)
                      </span>
                      <span className={isDark ? 'text-slate-300' : 'text-[#464555]'}>
                        {remainingInst === 0
                          ? 'Deuda completada'
                          : `Faltan ${remainingInst} ${
                              remainingInst === 1 ? 'cuota' : 'cuotas'
                            } (${
                              hideBalance
                                ? `${curr.symbol} •••`
                                : `${curr.symbol}${fmt(remainingInst * rem.amount)}`
                            })`}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-black/10 dark:bg-black/40 p-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#635bff] to-[#62fae3] transition-all duration-300"
                        style={{ width: `${paidInst > 0 ? Math.max(6, instPct) : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Fila 2: Recuadro Interior con Monto Mensual Completo + Botón de Acción Amplio */}
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 ${
                    isDark ? 'bg-[#12161f]' : 'bg-[#f0f4f8]'
                  }`}
                >
                  <div>
                    <span
                      className={`text-[10px] font-display font-bold uppercase tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-[#464555]'
                      }`}
                    >
                      Valor Mensual
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-[18px] font-extrabold tabular-nums">
                        {hideBalance ? `${curr.symbol} ••••` : `${curr.symbol}${fmt(rem.amount)}`}
                      </span>
                      <span className="font-display text-[11px] font-bold opacity-65">
                        {curr.code}/mes
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMarkPaid(rem)}
                    className={`px-4 py-2.5 rounded-xl font-display text-[12px] font-extrabold transition-all active:scale-95 shrink-0 ${
                      isPaid
                        ? isDark
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'bg-white text-[#464555] shadow-2xs'
                        : 'bg-[#62fae3] text-[#00201c] shadow-[0_6px_14px_rgba(0,107,95,0.25)]'
                    }`}
                  >
                    {isPaid ? 'Deshacer pago' : 'Marcar Pagado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
