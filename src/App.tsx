import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlcanciaView } from './components/AlcanciaView';
import { AnalyticsView } from './components/AnalyticsView';
import { AppIcon } from './components/AntIcon';
import { UserClayAvatar, WalletClayLogo } from './components/ClayAvatar';
import { DashboardView } from './components/DashboardView';
import {
  FloatingNotificationToasts,
  NotificationCenterDrawer,
  playNotificationChime,
  triggerNativeDeviceNotification,
} from './components/NotificationCenter';
import { OnboardingView } from './components/OnboardingView';
import { PinLockScreen } from './components/PinLockScreen';
import { PWAEntryPrompt, PWAInstallHeaderButton } from './components/PWAInstallPrompt';
import { QuickAddView } from './components/QuickAddView';
import { SubscriptionsDebtsView } from './components/SubscriptionsDebtsView';
import { VaultSettingsView } from './components/VaultSettingsView';
import {
  CURRENCIES,
  DEFAULT_USER_PROFILE,
  formatCurrencyAmount,
  GENDER_DATA,
} from './constants/walletData';
import {
  ActiveTab,
  AppNotification,
  GenderKey,
  Movement,
  PaymentReminder,
  SavingsGoal,
  UserProfile,
} from './types/wallet';

const STORAGE_KEYS = {
  PROFILE: 'flickwallet_user_profile_v4',
  MOVEMENTS: 'flickwallet_movements_v4',
  GOALS: 'flickwallet_savings_goals_v4',
  REMINDERS: 'flickwallet_payment_reminders_v4',
  NOTIFICATIONS: 'flickwallet_notifications_v4',
  HIDE_BALANCE: 'flickwallet_hide_balance_v4',
  DARK_MODE: 'flickwallet_dark_mode_v4',
  ONBOARDED: 'flickwallet_onboarding_completed_v4',
  LAST_9PM_REMINDER: 'flickwallet_last_9pm_reminder_v4',
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        const gKey: GenderKey =
          parsed.gender && parsed.gender in GENDER_DATA
            ? (parsed.gender as GenderKey)
            : 'hombre';
        const rawPin = String(parsed.pinCode || '')
          .replace(/\D/g, '')
          .slice(0, 4);
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          gender: gKey,
          avatarImg: GENDER_DATA[gKey].img,
          pinCode: rawPin.length === 4 ? rawPin : '',
          notificationsEnabled: parsed.notificationsEnabled !== false,
          notificationSound: parsed.notificationSound !== false,
          dailyReminder9pm: parsed.dailyReminder9pm !== false,
          monthlyIncome:
            typeof parsed.monthlyIncome === 'number'
              ? parsed.monthlyIncome
              : parseFloat(String(parsed.monthlyIncome || '0').replace(/,/g, '')) || 0,
        };
      }
    } catch {
      // ignore
    }
    return {
      ...DEFAULT_USER_PROFILE,
      notificationsEnabled: true,
      notificationSound: true,
    };
  });

  const [movements, setMovements] = useState<Movement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [reminders, setReminders] = useState<PaymentReminder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [liveToasts, setLiveToasts] = useState<AppNotification[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HIDE_BALANCE) === 'true';
    } catch {
      return false;
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return saved ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
    } catch {
      return false;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleanPin = String(parsed.pinCode || '')
          .replace(/\D/g, '')
          .slice(0, 4);
        return cleanPin.length === 4;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const checkedDueOnStartupRef = useRef(false);
  const movementsRef = useRef(movements);
  movementsRef.current = movements;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch {
      // ignore
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(savingsGoals));
    } catch {
      // ignore
    }
  }, [savingsGoals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch {
      // ignore
    }
  }, [reminders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 30)));
    } catch {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HIDE_BALANCE, String(hideBalance));
    } catch {
      // ignore
    }
  }, [hideBalance]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  const curr = CURRENCIES[profile.currency || 'USD'] || CURRENCIES.USD;

  // Trigger both 3D Clay Toast + Chime + Native OS Notification
  const handleTriggerNotification = useCallback(
    (opts: {
      title: string;
      body: string;
      emoji: string;
      accent?: 'indigo' | 'mint' | 'rose' | 'amber';
      actionTab?: ActiveTab;
      actionLabel?: string;
    }) => {
      const created: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: opts.title,
        body: opts.body,
        emoji: opts.emoji,
        accent: opts.accent || 'indigo',
        createdAt: new Date().toISOString(),
        read: false,
        actionTab: opts.actionTab,
        actionLabel: opts.actionLabel,
      };

      setNotifications((prev) => [created, ...prev].slice(0, 30));
      setLiveToasts((prev) => [created, ...prev].slice(0, 3));

      if (profile.notificationSound !== false) {
        playNotificationChime(true);
      }

      if (profile.notificationsEnabled !== false) {
        triggerNativeDeviceNotification(opts.title, opts.body);
      }

      setTimeout(() => {
        setLiveToasts((prev) => prev.filter((t) => t.id !== created.id));
      }, 4200);
    },
    [profile.notificationSound, profile.notificationsEnabled]
  );

  // Automatic startup check for due/overdue reminders
  useEffect(() => {
    if (!onboardingCompleted || isLocked || checkedDueOnStartupRef.current) return;
    checkedDueOnStartupRef.current = true;

    if (profile.notificationsEnabled === false) return;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const todayDay = new Date().getDate();
    const dueSoon = reminders.filter(
      (r) => !r.paidMonths.includes(currentMonthKey) && r.dayOfMonth - todayDay <= 3
    );

    if (dueSoon.length > 0) {
      const first = dueSoon[0];
      const diff = first.dayOfMonth - todayDay;
      const timer = setTimeout(() => {
        handleTriggerNotification({
          title:
            diff < 0
              ? `Pago pendiente: ${first.title}`
              : diff === 0
              ? `Hoy vence ${first.title}`
              : `${first.title} vence en ${diff} días`,
          body: `Monto: ${curr.symbol}${formatCurrencyAmount(first.amount, curr.code)} ${
            curr.code
          }. Toca para marcarlo como pagado.`,
          emoji: 'event_repeat',
          accent: diff < 0 ? 'rose' : 'amber',
          actionTab: 'pagos',
          actionLabel: 'Ver Pagos',
        });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    onboardingCompleted,
    isLocked,
    reminders,
    profile.notificationsEnabled,
    curr.symbol,
    curr.code,
    handleTriggerNotification,
  ]);

  // Daily 9:00 PM (21:00) Reminder Notification Scheduler
  useEffect(() => {
    if (!onboardingCompleted) return;

    const enabled =
      profile.notificationsEnabled !== false && profile.dailyReminder9pm !== false;

    const getLocalDateKey = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const build9pmMessage = () => {
      const todayKey = getLocalDateKey(new Date());
      const todayMovementsCount = movementsRef.current.filter(
        (m) => m.date && m.date.slice(0, 10) === todayKey
      ).length;
      return todayMovementsCount === 0
        ? 'Son las 9:00 PM. ¿Tuviste algún gasto hormiga, ingreso o abono hoy? Regístralo en segundos antes de cerrar tu día.'
        : `Son las 9:00 PM. Hoy registraste ${todayMovementsCount} ${
            todayMovementsCount === 1 ? 'movimiento' : 'movimientos'
          }. ¿Quedó algún gasto pendiente por anotar?`;
    };

    // Sync schedule with Service Worker for PWA background support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.active?.postMessage({
            type: 'SCHEDULE_9PM_REMINDER',
            enabled,
            body: build9pmMessage(),
            alreadyNotifiedDate: localStorage.getItem(STORAGE_KEYS.LAST_9PM_REMINDER),
          });
        })
        .catch(() => {});
    }

    if (!enabled) return;

    const checkAndFire9pmReminder = () => {
      const now = new Date();
      // Trigger at or after 21:00 (9:00 PM) local time, once per calendar day
      if (now.getHours() >= 21) {
        const todayKey = getLocalDateKey(now);
        const lastFired = localStorage.getItem(STORAGE_KEYS.LAST_9PM_REMINDER);
        if (lastFired !== todayKey) {
          try {
            localStorage.setItem(STORAGE_KEYS.LAST_9PM_REMINDER, todayKey);
          } catch {
            // ignore
          }
          handleTriggerNotification({
            title: 'Recordatorio de las 9:00 PM',
            body: build9pmMessage(),
            emoji: 'schedule',
            accent: 'indigo',
            actionTab: 'add',
            actionLabel: 'Registrar ahora',
          });
        }
      }
    };

    // Calculate exact milliseconds until 21:00:00 today
    const now = new Date();
    const target9pm = new Date(now);
    target9pm.setHours(21, 0, 0, 0);
    let exactTimeout: ReturnType<typeof setTimeout> | null = null;

    if (now.getTime() < target9pm.getTime()) {
      exactTimeout = setTimeout(
        checkAndFire9pmReminder,
        target9pm.getTime() - now.getTime() + 250
      );
    } else {
      checkAndFire9pmReminder();
    }

    const interval = setInterval(checkAndFire9pmReminder, 45000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndFire9pmReminder();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (exactTimeout) clearTimeout(exactTimeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    onboardingCompleted,
    profile.notificationsEnabled,
    profile.dailyReminder9pm,
    handleTriggerNotification,
  ]);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleAddGoal = (newGoal: Omit<SavingsGoal, 'id' | 'createdAt'>): SavingsGoal => {
    const created: SavingsGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSavingsGoals((prev) => [...prev, created]);
    handleTriggerNotification({
      title: `Alcancía "${created.name}" creada`,
      body: `Tu nueva meta es ahorrar ${curr.symbol}${formatCurrencyAmount(
        created.targetAmount,
        curr.code
      )} ${curr.code}.`,
      emoji: 'savings',
      accent: 'mint',
      actionTab: 'alcancia',
      actionLabel: 'Ver Alcancía',
    });
    return created;
  };

  const handleDepositToGoal = (goalId: string, amount: number) => {
    const targetGoal = savingsGoals.find((g) => g.id === goalId);
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, savedAmount: g.savedAmount + amount } : g))
    );
    const entry: Movement = {
      id: `mov-${Date.now()}`,
      title: targetGoal ? `Abono a ${targetGoal.name}` : 'Abono a Alcancía',
      amount,
      type: 'alcancia',
      category: 'alcancia',
      goalId,
      date: new Date().toISOString(),
    };
    setMovements((prev) => [entry, ...prev]);

    if (targetGoal) {
      const nextSaved = targetGoal.savedAmount + amount;
      const reached = nextSaved >= targetGoal.targetAmount;
      handleTriggerNotification({
        title: reached
          ? `Meta lograda en "${targetGoal.name}"`
          : `Abono guardado en "${targetGoal.name}"`,
        body: reached
          ? `Completaste tu meta de ${curr.symbol}${formatCurrencyAmount(
              targetGoal.targetAmount,
              curr.code
            )} ${curr.code}.`
          : `Sumaste ${curr.symbol}${formatCurrencyAmount(amount, curr.code)} a tu alcancía.`,
        emoji: reached ? 'emoji_events' : 'savings',
        accent: 'mint',
      });
    }
  };

  const handleWithdrawFromGoal = (goalId: string, amount: number) => {
    const targetGoal = savingsGoals.find((g) => g.id === goalId);
    if (!targetGoal || amount <= 0) return;
    const actualWithdraw = Math.min(targetGoal.savedAmount, amount);
    if (actualWithdraw <= 0) return;

    setSavingsGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, savedAmount: Math.max(0, g.savedAmount - actualWithdraw) }
          : g
      )
    );

    const entry: Movement = {
      id: `mov-${Date.now()}`,
      title: `Retiro de ${targetGoal.name}`,
      amount: actualWithdraw,
      type: 'retiro_alcancia',
      category: 'alcancia',
      goalId,
      date: new Date().toISOString(),
    };
    setMovements((prev) => [entry, ...prev]);

    handleTriggerNotification({
      title: `Retiro de "${targetGoal.name}"`,
      body: `Devolviste ${curr.symbol}${formatCurrencyAmount(
        actualWithdraw,
        curr.code
      )} ${curr.code} a tu saldo disponible.`,
      emoji: 'payments',
      accent: 'indigo',
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleAddReminder = (rem: Omit<PaymentReminder, 'id' | 'paidMonths' | 'createdAt'>) => {
    const created: PaymentReminder = {
      ...rem,
      id: `rem-${Date.now()}`,
      paidMonths: [],
      createdAt: new Date().toISOString(),
    };
    setReminders((prev) => [...prev, created]);
  };

  const handleTogglePaidReminder = (remId: string, monthKey: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id !== remId) return r;
        const alreadyPaid = r.paidMonths.includes(monthKey);
        return {
          ...r,
          paidMonths: alreadyPaid
            ? r.paidMonths.filter((m) => m !== monthKey)
            : [...r.paidMonths, monthKey],
        };
      })
    );
  };

  const handleDeleteReminder = (remId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== remId));
  };

  const handleAddMovement = (newMov: Omit<Movement, 'id' | 'date'>) => {
    const entry: Movement = {
      ...newMov,
      id: `mov-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setMovements((prev) => [entry, ...prev]);

    if (newMov.type === 'alcancia' && newMov.goalId) {
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === newMov.goalId ? { ...g, savedAmount: g.savedAmount + newMov.amount } : g
        )
      );
    }
  };

  const handleDeleteMovement = (id: string) => {
    const target = movements.find((m) => m.id === id);
    if (target && target.type === 'alcancia' && target.goalId) {
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === target.goalId
            ? { ...g, savedAmount: Math.max(0, g.savedAmount - target.amount) }
            : g
        )
      );
    } else if (target && target.type === 'retiro_alcancia' && target.goalId) {
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === target.goalId
            ? { ...g, savedAmount: g.savedAmount + target.amount }
            : g
        )
      );
    }
    setMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const handleExportBackup = () => {
    try {
      const payload = {
        app: 'FlickWallet',
        version: 4,
        exportedAt: new Date().toISOString(),
        profile,
        movements,
        savingsGoals,
        reminders,
        isDark,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `flickwallet-respaldo-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      handleTriggerNotification({
        title: 'Copia de seguridad descargada',
        body: 'Tu archivo JSON se guardó en tu dispositivo correctamente.',
        emoji: 'download_done',
        accent: 'mint',
      });
    } catch {
      handleTriggerNotification({
        title: 'Error al exportar',
        body: 'No se pudo generar el archivo de respaldo.',
        emoji: 'error',
        accent: 'rose',
      });
    }
  };

  const handleImportBackup = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : '';
          const parsed = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
            handleTriggerNotification({
              title: 'Archivo no válido',
              body: 'Selecciona un archivo .json exportado desde FlickWallet.',
              emoji: 'error',
              accent: 'rose',
            });
            resolve(false);
            return;
          }

          const rawPin = String(parsed.profile.pinCode || '')
            .replace(/\D/g, '')
            .slice(0, 4);
          const restoredProfile: UserProfile = {
            ...DEFAULT_USER_PROFILE,
            ...parsed.profile,
            pinCode: rawPin.length === 4 ? rawPin : '',
            monthlyIncome:
              typeof parsed.profile.monthlyIncome === 'number' &&
              parsed.profile.monthlyIncome > 0
                ? parsed.profile.monthlyIncome
                : profile.monthlyIncome || 1,
          };

          setProfile(restoredProfile);
          if (Array.isArray(parsed.movements)) setMovements(parsed.movements);
          if (Array.isArray(parsed.savingsGoals)) setSavingsGoals(parsed.savingsGoals);
          if (Array.isArray(parsed.reminders)) setReminders(parsed.reminders);
          if (typeof parsed.isDark === 'boolean') setIsDark(parsed.isDark);

          localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
          setOnboardingCompleted(true);

          handleTriggerNotification({
            title: 'Copia de seguridad restaurada',
            body: 'Tus movimientos, alcancías, deudas y perfil fueron recuperados.',
            emoji: 'cloud_done',
            accent: 'mint',
          });
          resolve(true);
        } catch {
          handleTriggerNotification({
            title: 'Error al restaurar copia',
            body: 'El archivo seleccionado está dañado o no tiene formato válido.',
            emoji: 'error',
            accent: 'rose',
          });
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  };

  const handleResetAllApp = () => {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setProfile(DEFAULT_USER_PROFILE);
    setMovements([]);
    setSavingsGoals([]);
    setReminders([]);
    setNotifications([]);
    setIsLocked(false);
    setOnboardingCompleted(false);
    setActiveTab('dashboard');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // STEP 0: PIN Lock Screen if PIN is active
  if (onboardingCompleted && isLocked && profile.pinCode) {
    return (
      <PinLockScreen
        profile={profile}
        isDark={isDark}
        onUnlock={() => setIsLocked(false)}
        onResetApp={handleResetAllApp}
      />
    );
  }

  // STEP 1: Initial Registration & Questionnaire (shown until name and monthlyIncome > 0 are completed)
  if (!onboardingCompleted || !profile.monthlyIncome || profile.monthlyIncome <= 0) {
    return (
      <main
        className={`flex flex-col justify-center relative w-full min-h-screen transition-colors duration-200 ${
          isDark ? 'dark bg-[#12161f] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
        }`}
      >
        <PWAEntryPrompt isDark={isDark} />
        <OnboardingView
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onComplete={() => {
            try {
              localStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
            } catch {
              // ignore
            }
            setOnboardingCompleted(true);
            setActiveTab('dashboard');
          }}
          isDark={isDark}
        />
      </main>
    );
  }

  const desktopNavItems: { id: ActiveTab; label: string; icon: string; badge?: number }[] = [
    { id: 'dashboard', label: 'Inicio', icon: 'space_dashboard' },
    { id: 'add', label: 'Registrar Movimiento', icon: 'add_circle' },
    { id: 'alcancia', label: 'Alcancía y Metas', icon: 'savings', badge: savingsGoals.length },
    {
      id: 'pagos',
      label: 'Suscripciones y Deudas',
      icon: 'event_repeat',
      badge: reminders.filter(
        (r) => !r.paidMonths.includes(new Date().toISOString().slice(0, 7))
      ).length,
    },
    { id: 'analytics', label: 'Analíticas por Mes', icon: 'donut_large' },
    { id: 'vault', label: 'Ajustes y Notificaciones', icon: 'settings' },
  ];

  // STEP 2: Main FlickWallet Application (Mobile + PC Responsive Layout)
  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row transition-colors duration-200 ${
        isDark ? 'dark bg-[#12161f] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
      }`}
    >
      {/* Native App Install Entry Prompt */}
      <PWAEntryPrompt isDark={isDark} />

      {/* Beautiful 3D Clay Floating Notification Toasts */}
      <FloatingNotificationToasts
        toasts={liveToasts}
        isDark={isDark}
        onDismiss={(id) => setLiveToasts((prev) => prev.filter((t) => t.id !== id))}
        onAction={(id, tab) => {
          setLiveToasts((prev) => prev.filter((t) => t.id !== id));
          if (tab) setActiveTab(tab);
        }}
      />

      {/* Notification Center History Drawer */}
      <NotificationCenterDrawer
        open={drawerOpen}
        notifications={notifications}
        isDark={isDark}
        onClose={() => setDrawerOpen(false)}
        onClearAll={() => setNotifications([])}
        onSelectNotification={(n) => {
          setNotifications((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
          );
          setDrawerOpen(false);
          if (n.actionTab) setActiveTab(n.actionTab);
        }}
        onOpenSettings={() => setActiveTab('vault')}
      />

      {/* PC / Desktop Left Clay Sidebar Navigation */}
      <aside
        aria-label="Navegación de escritorio"
        className={`hidden lg:flex lg:w-72 xl:w-80 lg:flex-col lg:shrink-0 lg:sticky lg:top-0 lg:h-screen p-6 justify-between border-r transition-colors ${
          isDark
            ? 'bg-[#171c28]/90 border-white/5'
            : 'bg-white/80 border-slate-200/70 shadow-[8px_0_30px_rgba(99,91,255,0.05)]'
        }`}
      >
        <div className="flex flex-col gap-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left group active:scale-95 transition-transform"
            >
              <WalletClayLogo size="sm" />
              <div>
                <span className="font-display text-[20px] font-extrabold tracking-tight block leading-none">
                  FlickWallet
                </span>
                <span
                  className={`font-display text-[11px] font-semibold ${
                    isDark ? 'text-slate-400' : 'text-[#464555]'
                  }`}
                >
                  Billetera Personal Viva
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1.5">
              {/* Notification Bell Button */}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(true);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                title="Centro de notificaciones"
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isDark ? 'bg-[#1b202c] text-[#62fae3]' : 'bg-[#f0f4f8] text-[#493ee5]'
                }`}
              >
                <AppIcon name="notifications" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e11d48] text-white font-display text-[9px] font-extrabold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* User Profile Card on Desktop Sidebar */}
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`p-3.5 rounded-3xl flex items-center gap-3.5 text-left transition-all active:scale-98 ${
              isDark
                ? 'bg-[#1b202c] hover:bg-[#232938] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.45),inset_1px_1px_3px_rgba(255,255,255,0.06)]'
                : 'bg-[#f0f4f8] hover:bg-[#eaeef2] shadow-[inset_2px_2px_4px_rgba(15,23,42,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
            }`}
          >
            <UserClayAvatar profile={profile} sizeClass="w-12 h-12" showBadge={false} />
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className={`text-[11px] font-display font-bold ${
                  isDark ? 'text-slate-400' : 'text-[#464555]'
                }`}
              >
                Bienvenido
              </span>
              <span className="font-display text-[15px] font-extrabold truncate">
                {profile.name || 'Usuario'}
              </span>
            </div>
            <span className="font-display text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#62fae3] text-[#00201c]">
              {curr.code}
            </span>
          </button>

          {/* Quick CTA Button on Desktop */}
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`w-full py-3.5 px-4 rounded-2xl font-display text-[14px] font-bold text-white flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
              activeTab === 'add'
                ? 'bg-[#006b5f] shadow-[0_12px_24px_rgba(0,107,95,0.4)]'
                : 'bg-[#635bff] shadow-[0_14px_28px_-4px_rgba(99,91,255,0.5),inset_2px_3px_5px_rgba(255,255,255,0.6),inset_-2px_-3px_5px_rgba(15,0,105,0.35)] hover:brightness-105'
            }`}
          >
            <AppIcon name="add" size={20} />
            <span>Nuevo Movimiento</span>
          </button>

          {/* Desktop Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            {desktopNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-4 py-2.5 rounded-2xl font-display text-[13px] font-bold flex items-center justify-between gap-2 transition-all active:scale-98 ${
                    active
                      ? isDark
                        ? 'bg-[#635bff]/25 text-[#c3c0ff] border border-[#635bff]/40 shadow-sm'
                        : 'bg-[#e2dfff]/70 text-[#321ed2] shadow-[0_6px_14px_-4px_rgba(99,91,255,0.2),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
                      : isDark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                      : 'text-[#464555] hover:bg-[#f0f4f8] hover:text-[#171c1f]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AppIcon name={item.icon} size={20} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#62fae3] text-[#00201c]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Install Button on Desktop Sidebar */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-col gap-2.5">
          <PWAInstallHeaderButton isDark={isDark} />
        </div>
      </aside>

      {/* Main Column Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky App Bar (Mobile & Tablet) */}
        <header
          className={`lg:hidden sticky top-0 z-30 backdrop-blur-md transition-colors ${
            isDark
              ? 'bg-[#12161f]/90 border-b border-white/5'
              : 'bg-[#f6fafe]/90 border-b border-slate-200/60'
          }`}
        >
          <div className="max-w-2xl mx-auto w-full px-4 h-15 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left active:scale-95 transition-transform"
            >
              <WalletClayLogo size="sm" />
              <span className="font-display text-[17px] font-extrabold tracking-tight block leading-none">
                FlickWallet
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <PWAInstallHeaderButton isDark={isDark} />

              {/* Notification Bell */}
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(true);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                title="Notificaciones"
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                  isDark
                    ? 'bg-[#1b202c] text-[#62fae3]'
                    : 'bg-white text-[#493ee5] shadow-[0_4px_10px_rgba(15,23,42,0.06)]'
                }`}
              >
                <AppIcon name="notifications" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e11d48] text-white font-display text-[9px] font-extrabold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Profile Photo Only */}
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                title="Ajustes y foto de perfil"
                className="rounded-full transition-transform active:scale-95"
              >
                <UserClayAvatar profile={profile} sizeClass="w-10 h-10" showBadge={false} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Container (Responsive Mobile + Tablet + PC) */}
        <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-3 lg:pt-8 pb-24 lg:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              movements={movements}
              savingsGoals={savingsGoals}
              reminders={reminders}
              hideBalance={hideBalance}
              onToggleHideBalance={() => setHideBalance((h) => !h)}
              onUpdateProfile={handleUpdateProfile}
              onDeleteMovement={handleDeleteMovement}
              onNavigate={setActiveTab}
              isDark={isDark}
            />
          )}

          {activeTab === 'add' && (
            <QuickAddView
              profile={profile}
              savingsGoals={savingsGoals}
              onAddGoal={handleAddGoal}
              onAddMovement={handleAddMovement}
              onSuccessNavigate={() => setActiveTab('dashboard')}
              isDark={isDark}
            />
          )}

          {activeTab === 'alcancia' && (
            <AlcanciaView
              profile={profile}
              savingsGoals={savingsGoals}
              onAddGoal={handleAddGoal}
              onDepositToGoal={handleDepositToGoal}
              onWithdrawFromGoal={handleWithdrawFromGoal}
              onDeleteGoal={handleDeleteGoal}
              hideBalance={hideBalance}
              isDark={isDark}
            />
          )}

          {activeTab === 'pagos' && (
            <SubscriptionsDebtsView
              profile={profile}
              reminders={reminders}
              onAddReminder={handleAddReminder}
              onTogglePaidReminder={handleTogglePaidReminder}
              onDeleteReminder={handleDeleteReminder}
              onAddMovement={handleAddMovement}
              onTriggerNotification={handleTriggerNotification}
              hideBalance={hideBalance}
              isDark={isDark}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView profile={profile} movements={movements} isDark={isDark} />
          )}

          {activeTab === 'vault' && (
            <VaultSettingsView
              profile={profile}
              reminders={reminders}
              onUpdateProfile={handleUpdateProfile}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetAllApp={handleResetAllApp}
              onTriggerNotification={handleTriggerNotification}
              isDark={isDark}
              onToggleDark={() => setIsDark((d) => !d)}
            />
          )}
        </main>
      </div>

      {/* Fixed Bottom Navigation Bar (Mobile & Tablet only) */}
      <nav
        aria-label="Navegación principal móvil"
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg transition-colors ${
          isDark
            ? 'bg-[#1b202c]/95 border-t border-white/10 shadow-[0_-10px_28px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-t border-slate-200/70 shadow-[0_-10px_30px_rgba(99,91,255,0.1)]'
        }`}
      >
        <div className="max-w-md mx-auto px-2 h-16 grid grid-cols-6 items-center">
          {/* 1. Inicio */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              activeTab === 'dashboard'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <AppIcon name="space_dashboard" size={21} />
            <span className="font-display text-[9px] font-bold mt-0.5">Inicio</span>
          </button>

          {/* 2. Botón de Alcancía */}
          <button
            type="button"
            onClick={() => setActiveTab('alcancia')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              activeTab === 'alcancia'
                ? 'text-[#006b5f] dark:text-[#62fae3]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <AppIcon name="savings" size={21} />
            <span className="font-display text-[9px] font-bold mt-0.5">Alcancía</span>
          </button>

          {/* 3. Botón Central "+" (Registro Rápido) */}
          <div className="flex items-center justify-center -mt-6">
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              aria-label="Registro Rápido"
              className={`w-13 h-13 rounded-full flex items-center justify-center text-white transition-all duration-150 active:translate-y-0.5 active:scale-95 ${
                activeTab === 'add'
                  ? 'bg-[#006b5f] shadow-[0_12px_24px_rgba(0,107,95,0.45),inset_2px_3px_5px_rgba(255,255,255,0.65)]'
                  : 'bg-[#635bff] shadow-[0_14px_28px_-4px_rgba(99,91,255,0.55),inset_2px_3px_5px_rgba(255,255,255,0.75),inset_-2px_-3px_5px_rgba(15,0,105,0.4)]'
              }`}
            >
              <AppIcon name="add" size={26} />
            </button>
          </div>

          {/* 4. Botón de Suscripciones, Arriendo, Gym y Deudas */}
          <button
            type="button"
            onClick={() => setActiveTab('pagos')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              activeTab === 'pagos'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <AppIcon name="event_repeat" size={21} />
            <span className="font-display text-[9px] font-bold mt-0.5">Pagos</span>
          </button>

          {/* 5. Analíticas (Con filtro de meses) */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              activeTab === 'analytics'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <AppIcon name="donut_large" size={21} />
            <span className="font-display text-[9px] font-bold mt-0.5">Analíticas</span>
          </button>

          {/* 6. Ajustes (Con notificaciones y PIN) */}
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
              activeTab === 'vault'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <AppIcon name="settings" size={21} />
            <span className="font-display text-[9px] font-bold mt-0.5">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
