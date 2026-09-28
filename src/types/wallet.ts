export type GenderKey = 'hombre' | 'mujer' | 'otro';

export type CurrencyCode = 'USD' | 'COP' | 'MXN' | 'EUR' | 'ARS' | 'PEN' | 'CLP' | 'GBP';

export type MovementType = 'hormiga' | 'fijo' | 'ingreso';

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
  goals: string[];
  configuredAt: string;
}

export type ActiveTab = 'dashboard' | 'analytics' | 'add' | 'onboarding' | 'vault';
