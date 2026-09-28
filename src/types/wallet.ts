export type GenderKey = 'hombre' | 'mujer' | 'otro';

export type CurrencyCode = 'USD' | 'COP' | 'MXN' | 'EUR' | 'ARS' | 'PEN' | 'CLP' | 'GBP';

export type MovementType = 'hormiga' | 'fijo' | 'ingreso' | 'alcancia' | 'retiro_alcancia';

export type CategoryId =
  | 'cafe'
  | 'streaming'
  | 'delivery'
  | 'ocio'
  | 'vivienda'
  | 'supermercado'
  | 'transporte'
  | 'servicios'
  | 'salud'
  | 'sueldo'
  | 'freelance'
  | 'alcancia'
  | 'otros';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  icon: string;
  emoji: string;
  defaultType: MovementType;
  bgLight: string;
  textLight: string;
  bgDark: string;
  textDark: string;
  colorHex: string;
}

export interface Movement {
  id: string;
  title: string;
  amount: number;
  type: MovementType;
  category: CategoryId;
  date: string;
  goalId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  emoji: string;
  createdAt: string;
}

export type ReminderKind = 'arriendo' | 'gym' | 'suscripcion' | 'deuda' | 'pago_mes';

export interface PaymentReminder {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number;
  kind: ReminderKind;
  emoji?: string;
  paidMonths: string[];
  totalInstallments?: number;
  paidInstallmentsOffset?: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  emoji: string;
  accent: 'indigo' | 'mint' | 'rose' | 'amber';
  createdAt: string;
  read: boolean;
  actionTab?: ActiveTab;
  actionLabel?: string;
}

export interface UserProfile {
  name: string;
  gender: GenderKey;
  currency: CurrencyCode;
  avatarImg: string;
  customAvatarImg?: string;
  useCustomAvatar?: boolean;
  monthlyIncome: number;
  hormigaLimit?: number;
  pinCode?: string;
  notificationsEnabled?: boolean;
  notificationSound?: boolean;
  dailyReminder9pm?: boolean;
  goals: string[];
  configuredAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'add'
  | 'alcancia'
  | 'pagos'
  | 'analytics'
  | 'vault'
  | 'onboarding';
