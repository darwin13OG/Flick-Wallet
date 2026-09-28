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

const PRESET_TEMPLATES: {
  title: string;
  kind: ReminderKind;
  emoji: string;
  day: string;
}[] = [
  { title: 'Arriendo / Vivienda', kind: 'arriendo', emoji: '🏠', day: '5' },
  { title: 'Mensualidad Gym', kind: 'gym', emoji: '🏋️', day: '10' },
  { title: 'Netflix / Spotify', kind: 'suscripcion', emoji: '🎬', day: '15' },
  { title: 'Cuota Tarjeta / Deuda', kind: 'deuda', emoji: '💳', day: '20' },
  { title: 'Internet y Celular', kind: 'pago_mes', emoji: '🌐', day: '25' },
  { title: 'Luz y Agua', kind: 'pago_mes', emoji: '💡', day: '28' },
];

const KIND_META: Record<
  ReminderKind,
  { label: string; emoji: string; badgeCls: string; category: CategoryId }
> = {
  arriendo: {
    label: 'Arriendo / Hogar',
    emoji: '🏠',
    badgeCls: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300',
    category: 'vivienda',
  },
  gym: {
    label: 'Gym y Salud',
    emoji: '🏋️',
    badgeCls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    category: 'salud',
  },
  suscripcion: {
    label: 'Suscripción',
    emoji: '🎬',
    badgeCls: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
    category: 'streaming',
  },
  deuda: {
    label: 'Deuda / Cuota',
    emoji: '💳',
    badgeCls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    category: 'otros',
  },
  pago_mes: {
    label: 'Servicios del Mes',
    emoji: '📅',
    badgeCls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
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
  onNavigate,
  hideBalance,
  isDark,
}) => {
  const [showAddForm, setShowAddForm] = useState(reminders.length === 0);
  const [title, setTitle] = useState('');
  const [amountRaw, setAmountRaw] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('15');
  const [kind, setKind] = useState<ReminderKind>('suscripcion');
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

  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[number]) => {
    setTitle(preset.title);
    setKind(preset.kind);
    setDayOfMonth(preset.day);
    setShowAddForm(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountRaw) || 0;
    const day = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
    if (!title.trim() || amt <= 0) return;

    const meta = KIND_META[kind];
    onAddReminder({
      title: title.trim(),
      amount: amt,
      dayOfMonth: day,
      kind,
      emoji: meta.emoji,
    });

    onTriggerNotification({
      title: `${meta.emoji} Compromiso agendado: ${title.trim()}`,
      body: `Te avisaremos cada día ${day} del mes por ${curr.symbol}${fmt(amt)} ${curr.code}.`,
      emoji: meta.emoji,
      accent: 'indigo',
    });

    setTitle('');
    setAmountRaw('');
    setDayOfMonth('15');
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
        title: `✅ ¡${rem.title} pagado al día!`,
        body: recordInWalletOnPay
          ? `Se marcó como pagado este mes y se descontó ${curr.symbol}${fmt(rem.amount)} de tu saldo.`
          : `Se marcó como pagado en tu calendario de este mes.`,
        emoji: '✅',
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
      <div className="rounded-3xl p-6 bg-gradient-to-br from-[#493ee5] via-[#635bff] to-[#312e81] text-white shadow-[0_20px_36px_-8px_rgba(99,91,255,0.45),inset_3px_4px_7px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(15,0,105,0.4)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-15 h-15 rounded-3xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6)] shrink-0">
            📅
          </div>
          <div>
            <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#62fae3]">
              Arriendo · Gym · Suscripciones · Deudas
            </span>
            <h2 className="font-display text-[24px] font-extrabold leading-tight">
              {hideBalance
                ? `${curr.symbol} •••••••`
                : `${curr.symbol}${fmt(totalPendingThisMonth)}`}{' '}
              <span className="text-[13px] font-bold text-[#62fae3]">pendientes este mes</span>
            </h2>
            <p className="text-[12px] text-white/85 mt-0.5">
              Compromiso mensual total:{' '}
              <strong>
                {hideBalance
                  ? `${curr.symbol} ••••`
                  : `${curr.symbol}${fmt(totalMonthlyCommitment)} ${curr.code}`}
              </strong>{' '}
              ({pendingCount} por pagar)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="px-4 py-3 rounded-2xl bg-[#62fae3] text-[#00201c] font-display text-[13px] font-extrabold flex items-center justify-center gap-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_1px_1px_2px_rgba(255,255,255,0.8)] active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showAddForm ? 'close' : 'add'}
            </span>
            <span>{showAddForm ? 'Cerrar' : 'Añadir Compromiso'}</span>
          </button>
        </div>
      </div>

      {/* Plantillas Rápidas de 1 Toque (Arriendo, Gym, Netflix, Deuda, Internet) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span
          className={`font-display text-[11px] font-extrabold uppercase tracking-wider shrink-0 ${
            isDark ? 'text-slate-400' : 'text-[#464555]'
          }`}
        >
          Plantillas rápidas:
        </span>
        {PRESET_TEMPLATES.map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => handleApplyPreset(preset)}
            className={`px-3 py-1.5 rounded-2xl font-display text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 ${
              isDark
                ? 'bg-[#1b202c] text-slate-200 hover:bg-[#242a38]'
                : 'bg-white text-[#171c1f] shadow-xs hover:bg-[#e2dfff]/40'
            }`}
          >
            <span>{preset.emoji}</span>
            <span>+ {preset.title}</span>
          </button>
        ))}
      </div>

      {/* Formulario para agregar Suscripción, Arriendo, Gym o Deuda */}
      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className={`rounded-3xl p-5 lg:p-6 flex flex-col gap-4 border-2 ${
            isDark ? 'border-[#635bff]/50' : 'border-[#635bff]/30'
          } ${cardCls}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#635bff] dark:text-[#c3c0ff]">
                Nuevo Compromiso Mensual
              </span>
              <h3 className="font-display text-[18px] font-extrabold">
                Agendar Arriendo, Gym, Suscripción o Deuda
              </h3>
            </div>
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
                  className={`py-2.5 px-2.5 rounded-2xl font-display text-[11px] font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all active:scale-95 ${
                    active
                      ? 'border-[#635bff] bg-[#e2dfff]/50 text-[#0f0069] dark:bg-[#635bff]/30 dark:text-white'
                      : isDark
                      ? 'border-transparent bg-[#12161f] text-slate-400'
                      : 'border-transparent bg-[#f0f4f8] text-[#464555]'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <span className="truncate max-w-full">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-5 flex flex-col gap-1">
              <label className="font-display text-[12px] font-bold" htmlFor="rem-title">
                Concepto (Ej. Arriendo, SmartFit, Netflix, Tarjeta)
              </label>
              <input
                id="rem-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Mensualidad Gym"
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
                className={`w-full h-12 px-3 rounded-2xl font-display text-[15px] font-extrabold text-center tabular-nums focus:outline-none ${inputWell}`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#635bff] text-white font-display text-[14px] font-extrabold shadow-[0_12px_24px_-4px_rgba(99,91,255,0.45),inset_2px_2px_4px_rgba(255,255,255,0.6)] active:scale-98 transition-all"
          >
            Guardar Recordatorio Mensual
          </button>
        </form>
      )}

      {/* Barra de Filtros + Opción de descontar automáticamente al pagar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'arriendo', label: '🏠 Arriendo' },
            { id: 'gym', label: '🏋️ Gym' },
            { id: 'suscripcion', label: '🎬 Suscripciones' },
            { id: 'deuda', label: '💳 Deudas' },
            { id: 'pago_mes', label: '💡 Servicios' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id as 'all' | ReminderKind)}
              className={`px-3 py-1.5 rounded-xl font-display text-[11px] font-bold whitespace-nowrap transition-all ${
                filterKind === tab.id
                  ? 'bg-[#635bff] text-white shadow-xs'
                  : isDark
                  ? 'bg-[#1b202c] text-slate-300'
                  : 'bg-white text-[#464555]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[11px] font-display font-bold cursor-pointer">
          <input
            type="checkbox"
            checked={recordInWalletOnPay}
            onChange={(e) => setRecordInWalletOnPay(e.target.checked)}
            className="rounded accent-[#635bff]"
          />
          <span className={isDark ? 'text-slate-300' : 'text-[#464555]'}>
            Registrar en mis gastos al marcar &ldquo;Pagado&rdquo;
          </span>
        </label>
      </div>

      {/* Lista de Pagos, Suscripciones, Arriendo, Gym y Deudas */}
      {filteredReminders.length === 0 ? (
        <div className={`rounded-3xl p-10 text-center flex flex-col items-center gap-3 ${cardCls}`}>
          <div className="w-16 h-16 rounded-3xl bg-[#e2dfff] text-[#321ed2] flex items-center justify-center text-4xl">
            📅
          </div>
          <h3 className="font-display text-[18px] font-extrabold">
            Sin pagos o suscripciones en esta categoría
          </h3>
          <p className={`text-[13px] max-w-md ${isDark ? 'text-slate-400' : 'text-[#464555]'}`}>
            Agrega tu <strong>Arriendo, Gym, Netflix, Internet o Deudas</strong> para llevar el
            control mensual y recibir alertas antes de la fecha de corte.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('vault')}
            className="mt-1 px-4 py-2 rounded-xl bg-[#e2dfff] text-[#321ed2] font-display text-[12px] font-bold"
          >
            Configurar alertas en Ajustes →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredReminders.map((rem) => {
            const isPaid = rem.paidMonths.includes(currentMonthKey);
            const daysDiff = rem.dayOfMonth - todayDay;
            const isOverdue = !isPaid && daysDiff < 0;
            const isDueSoon = !isPaid && daysDiff >= 0 && daysDiff <= 3;
            const meta = KIND_META[rem.kind] || KIND_META.pago_mes;

            return (
              <div
                key={rem.id}
                className={`rounded-3xl p-4.5 flex items-center justify-between gap-3 border transition-all ${
                  isOverdue
                    ? 'border-rose-500/50'
                    : isDueSoon
                    ? 'border-amber-500/50'
                    : isPaid
                    ? 'border-emerald-500/35 opacity-85'
                    : isDark
                    ? 'border-white/5'
                    : 'border-slate-200/60'
                } ${cardCls}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
                      isPaid
                        ? 'bg-[#62fae3]/35'
                        : isOverdue
                        ? 'bg-[#ffdad6]'
                        : 'bg-[#e2dfff]/70 dark:bg-[#635bff]/20'
                    }`}
                  >
                    {isPaid ? '✅' : rem.emoji || meta.emoji}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-display text-[15px] font-extrabold truncate ${
                          isPaid ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {rem.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full font-display text-[10px] font-bold ${meta.badgeCls}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-[#464555]'}>
                        Día {rem.dayOfMonth} de cada mes
                      </span>
                      <span>·</span>
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
                          ? `Venció hace ${Math.abs(daysDiff)}d`
                          : daysDiff === 0
                          ? '¡Vence HOY!'
                          : `En ${daysDiff} días`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <span className="font-display text-[16px] font-extrabold tabular-nums block">
                      {hideBalance ? `${curr.symbol} •••` : `${curr.symbol}${fmt(rem.amount)}`}
                    </span>
                    <span className="text-[10px] font-bold opacity-60">{curr.code}/mes</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleMarkPaid(rem)}
                    className={`px-3 py-2 rounded-2xl font-display text-[11px] font-extrabold transition-all active:scale-95 ${
                      isPaid
                        ? isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-[#f0f4f8] text-[#464555]'
                        : 'bg-[#62fae3] text-[#00201c] shadow-[0_6px_14px_rgba(0,107,95,0.25)]'
                    }`}
                  >
                    {isPaid ? 'Deshacer' : 'Pagar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteReminder(rem.id)}
                    title="Eliminar recordatorio"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
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
