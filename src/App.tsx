import React, { useEffect, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { UserClayAvatar, WalletClayLogo } from './components/ClayAvatar';
import { DashboardView } from './components/DashboardView';
import { OnboardingView } from './components/OnboardingView';
import { QuickAddView } from './components/QuickAddView';
import { VaultSettingsView } from './components/VaultSettingsView';
import { DEFAULT_USER_PROFILE, GENDER_DATA } from './constants/walletData';
import { ActiveTab, Movement, UserProfile } from './types/wallet';

const STORAGE_KEYS = {
  PROFILE: 'flickwallet_user_profile_v3',
  MOVEMENTS: 'flickwallet_movements_v3',
  HIDE_BALANCE: 'flickwallet_hide_balance_v3',
  DARK_MODE: 'flickwallet_dark_mode_v3',
  ONBOARDED: 'flickwallet_onboarding_completed_v3',
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        const gKey = parsed.gender in GENDER_DATA ? parsed.gender : 'hombre';
        return {
          ...DEFAULT_USER_PROFILE,
          ...parsed,
          gender: gKey,
          monthlyIncome:
            typeof parsed.monthlyIncome === 'number'
              ? parsed.monthlyIncome
              : parseFloat(String(parsed.monthlyIncome || '0').replace(/,/g, '')) || 0,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER_PROFILE;
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

  // Only show the initial registration if not already completed in localStorage
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleAddMovement = (newMov: Omit<Movement, 'id' | 'date'>) => {
    const entry: Movement = {
      ...newMov,
      id: `mov-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setMovements((prev) => [entry, ...prev]);
  };

  const handleDeleteMovement = (id: string) => {
    setMovements((prev) => prev.filter((m) => m.id !== id));
  };

  const handleImportBackup = (data: { profile?: UserProfile; movements?: Movement[] }) => {
    if (data.profile) {
      setProfile((prev) => ({ ...prev, ...data.profile }));
    }
    if (Array.isArray(data.movements)) {
      setMovements(data.movements);
    }
  };

  // STEP 1: Initial Registration & Questionnaire (only shown before completing onboarding)
  if (!onboardingCompleted) {
    return (
      <main
        className={`flex flex-col relative w-full min-h-screen transition-colors duration-200 ${
          isDark ? 'dark bg-[#12161f] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
        }`}
      >
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

  // STEP 2: Main FlickWallet Application
  return (
    <div
      className={`min-h-screen w-full flex flex-col transition-colors duration-200 ${
        isDark ? 'dark bg-[#12161f] text-slate-100' : 'bg-[#f6fafe] text-[#171c1f]'
      }`}
    >
      {/* Top Sticky App Bar */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#12161f]/90 border-b border-white/5'
            : 'bg-[#f6fafe]/90 border-b border-slate-200/60'
        }`}
      >
        <div className="max-w-md mx-auto w-full px-4 h-15 flex items-center justify-between gap-2">
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

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setIsDark((d) => !d)}
              title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isDark
                  ? 'bg-[#1b202c] text-amber-300 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1)]'
                  : 'bg-white text-[#464555] shadow-[0_4px_10px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.9)]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
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

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3 pb-24">
        {activeTab === 'dashboard' && (
          <DashboardView
            profile={profile}
            movements={movements}
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
            onAddMovement={handleAddMovement}
            onSuccessNavigate={() => setActiveTab('dashboard')}
            isDark={isDark}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView profile={profile} movements={movements} isDark={isDark} />
        )}

        {activeTab === 'vault' && (
          <VaultSettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            isDark={isDark}
            onToggleDark={() => setIsDark((d) => !d)}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar (Without Registro tab) */}
      <nav
        aria-label="Navegación principal"
        className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg transition-colors ${
          isDark
            ? 'bg-[#1b202c]/95 border-t border-white/10 shadow-[0_-10px_28px_rgba(0,0,0,0.5)]'
            : 'bg-white/95 border-t border-slate-200/70 shadow-[0_-10px_30px_rgba(99,91,255,0.1)]'
        }`}
      >
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
          {/* 1. Dashboard Principal */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-all active:scale-90 ${
              activeTab === 'dashboard'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: activeTab === 'dashboard' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              space_dashboard
            </span>
            <span className="font-display text-[10px] font-bold mt-0.5">Inicio</span>
          </button>

          {/* 2. Central Floating Quick Action "+" Button (Registro Rápido) */}
          <div className="flex items-center justify-center -mt-6">
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              aria-label="Registro Rápido"
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-150 active:translate-y-0.5 active:scale-95 ${
                activeTab === 'add'
                  ? 'bg-[#006b5f] shadow-[0_12px_24px_rgba(0,107,95,0.45),inset_2px_3px_5px_rgba(255,255,255,0.65)]'
                  : 'bg-[#635bff] shadow-[0_14px_28px_-4px_rgba(99,91,255,0.55),inset_2px_3px_5px_rgba(255,255,255,0.75),inset_-2px_-3px_5px_rgba(15,0,105,0.4)]'
              }`}
            >
              <span className="material-symbols-outlined text-[28px] font-bold">add</span>
            </button>
          </div>

          {/* 3. Estadísticas / Analíticas */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-all active:scale-90 ${
              activeTab === 'analytics'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: activeTab === 'analytics' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              donut_large
            </span>
            <span className="font-display text-[10px] font-bold mt-0.5">Analíticas</span>
          </button>

          {/* 4. Ajustes / Bóveda Local */}
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`flex flex-col items-center justify-center py-1 px-3 transition-all active:scale-90 ${
              activeTab === 'vault'
                ? 'text-[#493ee5] dark:text-[#c3c0ff]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#777587] hover:text-[#171c1f]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: activeTab === 'vault' ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              settings
            </span>
            <span className="font-display text-[10px] font-bold mt-0.5">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
