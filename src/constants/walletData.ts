import { CategoryMeta, CurrencyCode, GenderKey, UserProfile } from '../types/wallet';
import avatarHombreClay from '../assets/images/hombre_clay_2_1790890852497.jpg';
import avatarMujerClay from '../assets/images/mujer_clay_screen_1790890875227.jpg';
import avatarEstandarClay from '../assets/images/estandar_clay_3_1790890866343.jpg';

export const WALLET_ICON_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WYalp3sa-7HsKGvD7T0bnBKBcIdJJD-Dy0YdtZf2HKS5yBwxML94FUoFh28UJEkjIEuPP1xSyjH5_6OWT2Pb3CfinQ2LHkM7gRGuD0rJpZzRSPgS19yOVnsqc5GFc5cKNVgsgDBWp327ciKEH2pVjrNC2tfnJsrKHMFskM2y90yXJAh_Pf6s-5f6wUOxZoGTBVRZfqtl8lA0loaKH6IkP8JGqTDCypE8DM8LAzJD3Gj0rpgeiEWGmAtjgV';

export const CURRENCIES: Record<
  CurrencyCode,
  {
    code: CurrencyCode;
    symbol: string;
    name: string;
    thousandSep: '.' | ',';
    decimalSep: ',' | '.';
  }
> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar (USD)', thousandSep: '.', decimalSep: ',' },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)', thousandSep: '.', decimalSep: ',' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)', thousandSep: ',', decimalSep: '.' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', thousandSep: '.', decimalSep: ',' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', thousandSep: '.', decimalSep: ',' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)', thousandSep: ',', decimalSep: '.' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)', thousandSep: '.', decimalSep: ',' },
  GBP: { code: 'GBP', symbol: '£', name: 'Libra Esterlina (GBP)', thousandSep: ',', decimalSep: '.' },
};

/**
 * Formats a numeric value with automatic thousands separators according to the selected currency.
 */
export function formatCurrencyAmount(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const hasDecimals = Math.round(safeAmount * 100) % 100 !== 0;

  const fixed = hasDecimals ? safeAmount.toFixed(2) : Math.round(safeAmount).toString();
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, curr.thousandSep);

  return decPart ? `${formattedInt}${curr.decimalSep}${decPart}` : formattedInt;
}

/**
 * Formats a canonical numeric string (e.g. "1250000" or "1250.5") for live display while typing.
 */
export function formatLiveNumberString(
  canonicalStr: string,
  currencyCode: CurrencyCode = 'USD'
): string {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  if (!canonicalStr) return '';

  const clean = canonicalStr.replace(/[^0-9.]/g, '');
  if (!clean) return '';

  const parts = clean.split('.');
  const intDigits = parts[0].replace(/^0+(?=\d)/, '') || (parts.length > 1 ? '0' : '');
  const formattedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, curr.thousandSep);

  if (parts.length > 1) {
    const decDigits = parts[1].slice(0, 2);
    return `${formattedInt || '0'}${curr.decimalSep}${decDigits}`;
  }

  return formattedInt;
}

/**
 * Parses a user-typed input string (which may contain thousand separators) into a canonical numeric string.
 */
export function parseTypedCurrencyInput(
  rawInput: string,
  currencyCode: CurrencyCode = 'USD'
): string {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  if (!rawInput) return '';

  const withoutThousands =
    curr.thousandSep === '.' ? rawInput.replace(/\./g, '') : rawInput.replace(/,/g, '');

  const normalized =
    curr.decimalSep === ',' ? withoutThousands.replace(/,/g, '.') : withoutThousands;

  const cleaned = normalized.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  if (parts.length > 1) {
    return `${intPart || '0'}.${parts[1].slice(0, 2)}`;
  }
  return intPart;
}

export const GENDER_DATA: Record<
  GenderKey,
  {
    key: GenderKey;
    label: string;
    icon: string;
    emoji: string;
    img: string;
    fallbackSvg: string;
    title: string;
    desc: string;
  }
> = {
  hombre: {
    key: 'hombre',
    label: 'Hombre',
    icon: 'man',
    emoji: 'man',
    img: avatarHombreClay,
    fallbackSvg: avatarHombreClay,
    title: 'Hombre',
    desc: 'Avatar predeterminado activo',
  },
  mujer: {
    key: 'mujer',
    label: 'Mujer',
    icon: 'woman',
    emoji: 'woman',
    img: avatarMujerClay,
    fallbackSvg: avatarMujerClay,
    title: 'Mujer',
    desc: 'Avatar predeterminado activo',
  },
  otro: {
    key: 'otro',
    label: 'Otro',
    icon: 'person',
    emoji: 'person',
    img: avatarEstandarClay,
    fallbackSvg: avatarEstandarClay,
    title: 'Estándar',
    desc: 'Avatar estándar 3D activo',
  },
};

export const ONBOARDING_GOALS = [
  {
    id: 'hormiga',
    icon: 'ant',
    emoji: 'ant',
    title: 'Frenar Gastos Hormiga',
    subtitle: 'Cafés, suscripciones que olvidaste y antojos',
    badgeBg: 'bg-[#ffdadc] text-[#7a1228]',
    shadow: 'shadow-[0_4px_8px_rgba(164,47,70,0.15),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'metas',
    icon: 'flag',
    emoji: 'flag',
    title: 'Metas y Presupuesto',
    subtitle: 'Fondos de emergencia, viajes y techos de gasto',
    badgeBg: 'bg-[#62fae3] text-[#003b34]',
    shadow: 'shadow-[0_4px_8px_rgba(0,107,95,0.15),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'flujo',
    icon: 'trending_up',
    emoji: 'trending_up',
    title: 'Flujo de Caja Diario',
    subtitle: 'Monitorear ingresos variables y balance neto',
    badgeBg: 'bg-[#e2e8f0] text-[#171c1f]',
    shadow: 'shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'privacidad',
    icon: 'lock',
    emoji: 'lock',
    title: 'Finanzas 100% Privadas',
    subtitle: 'Tus datos se guardan solo en tu teléfono, sin cuentas ni servidores',
    badgeBg: 'bg-[#e2dfff] text-[#321ed2]',
    shadow: 'shadow-[0_4px_8px_rgba(99,91,255,0.18),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'simulacion',
    icon: 'bolt',
    emoji: 'bolt',
    title: 'Registro Rápido y Simulación',
    subtitle: 'Calcula el impacto antes de pasar tu tarjeta',
    badgeBg: 'bg-[#fef08a] text-[#713f12]',
    shadow: 'shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
];

export const CATEGORIES: Record<CategoryMeta['id'], CategoryMeta> = {
  cafe: {
    id: 'cafe',
    name: 'Café & Antojos',
    icon: 'local_cafe',
    defaultType: 'hormiga',
    bgLight: 'bg-[#ffe4e6]',
    textLight: 'text-[#9f1239]',
    bgDark: 'bg-rose-500/20',
    textDark: 'text-rose-300',
    colorHex: '#fb7185',
  },
  streaming: {
    id: 'streaming',
    name: 'Streaming & Apps',
    icon: 'smart_display',
    defaultType: 'hormiga',
    bgLight: 'bg-[#f3e8ff]',
    textLight: 'text-[#6b21a8]',
    bgDark: 'bg-purple-500/20',
    textDark: 'text-purple-300',
    colorHex: '#a855f7',
  },
  delivery: {
    id: 'delivery',
    name: 'Delivery & Snacks',
    icon: 'delivery_dining',
    defaultType: 'hormiga',
    bgLight: 'bg-[#ffedd5]',
    textLight: 'text-[#9a3412]',
    bgDark: 'bg-orange-500/20',
    textDark: 'text-orange-300',
    colorHex: '#f97316',
  },
  ocio: {
    id: 'ocio',
    name: 'Ocio & Juegos',
    icon: 'sports_esports',
    defaultType: 'hormiga',
    bgLight: 'bg-[#fef9c3]',
    textLight: 'text-[#854d0e]',
    bgDark: 'bg-amber-500/20',
    textDark: 'text-amber-300',
    colorHex: '#eab308',
  },
  vivienda: {
    id: 'vivienda',
    name: 'Vivienda & Renta',
    icon: 'home',
    defaultType: 'fijo',
    bgLight: 'bg-[#e2dfff]',
    textLight: 'text-[#321ed2]',
    bgDark: 'bg-indigo-500/20',
    textDark: 'text-indigo-300',
    colorHex: '#635bff',
  },
  supermercado: {
    id: 'supermercado',
    name: 'Supermercado',
    icon: 'shopping_cart',
    defaultType: 'fijo',
    bgLight: 'bg-[#dbeafe]',
    textLight: 'text-[#1e40af]',
    bgDark: 'bg-blue-500/20',
    textDark: 'text-blue-300',
    colorHex: '#3b82f6',
  },
  servicios: {
    id: 'servicios',
    name: 'Luz, Agua & Fibra',
    icon: 'bolt',
    defaultType: 'fijo',
    bgLight: 'bg-[#e0f2fe]',
    textLight: 'text-[#0369a1]',
    bgDark: 'bg-sky-500/20',
    textDark: 'text-sky-300',
    colorHex: '#0ea5e9',
  },
  transporte: {
    id: 'transporte',
    name: 'Transporte & Auto',
    icon: 'directions_car',
    defaultType: 'fijo',
    bgLight: 'bg-[#f1f5f9]',
    textLight: 'text-[#334155]',
    bgDark: 'bg-slate-500/20',
    textDark: 'text-slate-300',
    colorHex: '#64748b',
  },
  salud: {
    id: 'salud',
    name: 'Salud & Gym',
    icon: 'fitness_center',
    defaultType: 'fijo',
    bgLight: 'bg-[#fce7f3]',
    textLight: 'text-[#9d174d]',
    bgDark: 'bg-pink-500/20',
    textDark: 'text-pink-300',
    colorHex: '#ec4899',
  },
  sueldo: {
    id: 'sueldo',
    name: 'Sueldo & Nómina',
    icon: 'payments',
    defaultType: 'ingreso',
    bgLight: 'bg-[#62fae3]',
    textLight: 'text-[#005047]',
    bgDark: 'bg-emerald-500/20',
    textDark: 'text-emerald-300',
    colorHex: '#10b981',
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance & Extra',
    icon: 'rocket_launch',
    defaultType: 'ingreso',
    bgLight: 'bg-[#ccfbf1]',
    textLight: 'text-[#115e59]',
    bgDark: 'bg-teal-500/20',
    textDark: 'text-teal-300',
    colorHex: '#14b8a6',
  },
  alcancia: {
    id: 'alcancia',
    name: 'Alcancía de Ahorro',
    icon: 'savings',
    defaultType: 'alcancia',
    bgLight: 'bg-[#e2dfff]',
    textLight: 'text-[#321ed2]',
    bgDark: 'bg-indigo-500/25',
    textDark: 'text-indigo-200',
    colorHex: '#635bff',
  },
  otros: {
    id: 'otros',
    name: 'Otros',
    icon: 'category',
    defaultType: 'fijo',
    bgLight: 'bg-[#eaeef2]',
    textLight: 'text-[#464555]',
    bgDark: 'bg-zinc-500/20',
    textDark: 'text-zinc-300',
    colorHex: '#8b5cf6',
  },
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: '',
  gender: 'hombre',
  currency: 'USD',
  avatarImg: GENDER_DATA.hombre.img,
  customAvatarImg: '',
  useCustomAvatar: false,
  monthlyIncome: 0,
  notificationsEnabled: true,
  notificationSound: true,
  dailyReminder9pm: true,
  goals: [],
  configuredAt: new Date().toISOString(),
};
