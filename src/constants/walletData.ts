import { CategoryMeta, CurrencyCode, GenderKey, Movement, UserProfile } from '../types/wallet';

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

  // Remove thousand separators first
  const withoutThousands =
    curr.thousandSep === '.' ? rawInput.replace(/\./g, '') : rawInput.replace(/,/g, '');

  // Convert currency decimal separator to canonical '.'
  const normalized =
    curr.decimalSep === ',' ? withoutThousands.replace(/,/g, '.') : withoutThousands;

  // Keep only digits and at most one decimal point
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/^0+(?=\d)/, '');
  if (parts.length > 1) {
    return `${intPart || '0'}.${parts[1].slice(0, 2)}`;
  }
  return intPart;
}

const MALE_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f5efe8"/>
  <path d="M42 200 C42 152 68 140 100 140 C132 140 158 152 158 200 Z" fill="#8ea8e6"/>
  <rect x="84" y="118" width="32" height="30" rx="14" fill="#f5c2a3"/>
  <ellipse cx="56" cy="98" rx="12" ry="14" fill="#f5c2a3"/>
  <ellipse cx="144" cy="98" rx="12" ry="14" fill="#f5c2a3"/>
  <circle cx="55" cy="106" r="3.5" fill="#d4af37"/>
  <circle cx="145" cy="106" r="3.5" fill="#d4af37"/>
  <ellipse cx="100" cy="94" rx="44" ry="46" fill="#f7c8ab"/>
  <path d="M54 88 C50 54 74 34 106 36 C134 36 154 52 146 88 C142 68 124 58 100 58 C76 58 60 68 54 88 Z" fill="#75513b"/>
  <ellipse cx="83" cy="88" rx="4.5" ry="5.5" fill="#573927"/>
  <ellipse cx="117" cy="88" rx="4.5" ry="5.5" fill="#573927"/>
  <ellipse cx="100" cy="95" rx="5.5" ry="7" fill="#ebad8c"/>
  <path d="M86 110 Q100 119 114 110" stroke="#c98263" stroke-width="3.5" stroke-linecap="round" fill="none"/>
</svg>
`)}`;

const FEMALE_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f5efe8"/>
  <circle cx="100" cy="86" r="56" fill="#734f38"/>
  <circle cx="56" cy="105" r="22" fill="#734f38"/>
  <circle cx="144" cy="105" r="22" fill="#734f38"/>
  <path d="M44 200 C44 152 68 140 100 140 C132 140 156 152 156 200 Z" fill="#8ea8e6"/>
  <rect x="85" y="118" width="30" height="30" rx="14" fill="#f6c4a6"/>
  <ellipse cx="58" cy="98" rx="10" ry="12" fill="#f6c4a6"/>
  <ellipse cx="142" cy="98" rx="10" ry="12" fill="#f6c4a6"/>
  <circle cx="58" cy="106" r="3.8" fill="#e5c158"/>
  <circle cx="142" cy="106" r="3.8" fill="#e5c158"/>
  <ellipse cx="100" cy="94" rx="42" ry="44" fill="#f7c8ab"/>
  <path d="M54 84 C56 46 82 34 104 36 C132 38 148 54 146 84 C134 64 114 54 94 56 C74 58 62 70 54 84 Z" fill="#734f38"/>
  <ellipse cx="83" cy="88" rx="4.5" ry="5.5" fill="#523523"/>
  <ellipse cx="117" cy="88" rx="4.5" ry="5.5" fill="#523523"/>
  <ellipse cx="100" cy="95" rx="5" ry="6.5" fill="#ebad8c"/>
  <path d="M85 108 Q100 120 115 108 Z" fill="#ffffff" stroke="#d98b6c" stroke-width="2"/>
</svg>
`)}`;

// Exact 3D Clay Lavender Bust matching screen.png (smooth matte 3D sphere head + connected neck + rounded bust floating above warm studio background)
const STANDARD_3D_CLAY_BUST = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="studioBg" cx="35%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#fbf7f4"/>
      <stop offset="60%" stop-color="#f5eee9"/>
      <stop offset="100%" stop-color="#ece2dc"/>
    </radialGradient>
    <radialGradient id="headSphere" cx="34%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#dcd5f8"/>
      <stop offset="35%" stop-color="#b5abec"/>
      <stop offset="75%" stop-color="#8f84d9"/>
      <stop offset="100%" stop-color="#6c60bd"/>
    </radialGradient>
    <radialGradient id="bodyClay" cx="32%" cy="25%" r="72%">
      <stop offset="0%" stop-color="#dad2f7"/>
      <stop offset="40%" stop-color="#b1a7ea"/>
      <stop offset="80%" stop-color="#8c81d6"/>
      <stop offset="100%" stop-color="#6b5fbc"/>
    </radialGradient>
    <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(75, 58, 115, 0.22)"/>
      <stop offset="55%" stop-color="rgba(75, 58, 115, 0.08)"/>
      <stop offset="100%" stop-color="rgba(75, 58, 115, 0)"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#studioBg)"/>
  <ellipse cx="200" cy="336" rx="95" ry="12" fill="url(#floorShadow)"/>
  <path d="M98 282 C98 228 134 205 182 202 C186 201 188 194 186 188 L214 188 C212 194 214 201 218 202 C266 205 302 228 302 282 C302 296 292 302 200 302 C108 302 98 296 98 282 Z" fill="url(#bodyClay)"/>
  <ellipse cx="200" cy="197" rx="22" ry="7" fill="rgba(68, 56, 130, 0.38)"/>
  <circle cx="200" cy="138" r="58" fill="url(#headSphere)"/>
</svg>
`)}`;

export const GENDER_DATA: Record<
  GenderKey,
  {
    key: GenderKey;
    label: string;
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
    emoji: '👨',
    img: 'https://lh3.googleusercontent.com/aida/AEtjO1VPx4TjSBBgflaQ30TlXymkMANEGdaYEEEJqw5DJ37negCCUfEGnHW-8mqCo7y4E_1zxAwt-_ieXFvDRCGafXTBOJIXFTRSQPXcR4pqQQ7ZyetPay8_aeCHM-QH-Sh2-auK4I1qY0vNSQ_ZVIAo9UhUb-VTBwfx_NLO6dr7RVnzjVD53lr_6nEx91KB031S2KQbrDFtbEF_IuKLkxPkJkcMvaVGmO5APnLhgqdsFKGb5WUv3V19kaPwsbtZ',
    fallbackSvg: MALE_SVG_FALLBACK,
    title: 'Hombre',
    desc: 'Avatar predeterminado activo',
  },
  mujer: {
    key: 'mujer',
    label: 'Mujer',
    emoji: '👩',
    img: 'https://lh3.googleusercontent.com/aida/AEtjO1X2gqYPpOEr_HHg8A6byZ9jGibhLVT394V_5dqrnr0TWMlZx2LGlUHo-7SsNd02IYzws-92tsLZWD1aOhzdbUDr6LxkLHZDKa0L5zZiZTPlCNdJvSvqhZ33Pfmt0pSJBk9cT4m9NGSGNjhVe7sm_aDdTb5xpHACzUFE0WXrYMoWeL5FNAJhui_2JlQlZUl4RQ-CSAdJFEzbpMojw9a1Q1VZOdmwcynzeTLykedTSj4Cx6ysHnDvhPs0uU-_',
    fallbackSvg: FEMALE_SVG_FALLBACK,
    title: 'Mujer',
    desc: 'Avatar predeterminado activo',
  },
  otro: {
    key: 'otro',
    label: 'Otro',
    emoji: '✨',
    img: STANDARD_3D_CLAY_BUST,
    fallbackSvg: STANDARD_3D_CLAY_BUST,
    title: 'Estándar',
    desc: 'Avatar estándar 3D activo',
  },
};

export const ONBOARDING_GOALS = [
  {
    id: 'hormiga',
    emoji: '🔍',
    title: 'Frenar Gastos Hormiga',
    subtitle: 'Cafés, suscripciones que olvidaste y antojos',
    badgeBg: 'bg-[#ffdadc] text-[#400010]',
    shadow: 'shadow-[0_4px_8px_rgba(164,47,70,0.15),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'metas',
    emoji: '🎯',
    title: 'Metas y Presupuesto',
    subtitle: 'Fondos de emergencia, viajes y techos de gasto',
    badgeBg: 'bg-[#62fae3] text-[#00201c]',
    shadow: 'shadow-[0_4px_8px_rgba(0,107,95,0.15),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'flujo',
    emoji: '📊',
    title: 'Flujo de Caja Diario',
    subtitle: 'Monitorear ingresos variables y balance neto',
    badgeBg: 'bg-[#eaeef2] text-[#171c1f]',
    shadow: 'shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'privacidad',
    emoji: '🛡️',
    title: 'Finanzas 100% Privadas',
    subtitle: 'Tus datos se guardan solo en tu teléfono, sin cuentas ni servidores',
    badgeBg: 'bg-[#e2dfff] text-[#493ee5]',
    shadow: 'shadow-[0_4px_8px_rgba(99,91,255,0.18),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
  {
    id: 'simulacion',
    emoji: '⚡',
    title: 'Registro Rápido y Simulación',
    subtitle: 'Calcula el impacto antes de pasar tu tarjeta',
    badgeBg: 'bg-[#eaeef2] text-[#171c1f]',
    shadow: 'shadow-[0_4px_8px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.8)]',
    defaultChecked: false,
  },
];

export const CATEGORIES: Record<CategoryMeta['id'], CategoryMeta> = {
  cafe: {
    id: 'cafe',
    name: 'Café & Antojos',
    icon: 'local_cafe',
    emoji: '☕',
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
    emoji: '🎬',
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
    emoji: '🛵',
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
    emoji: '🎮',
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
    emoji: '🏠',
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
    emoji: '🛒',
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
    emoji: '💡',
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
    emoji: '🚗',
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
    icon: 'favorite',
    emoji: '💊',
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
    emoji: '💼',
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
    icon: 'Rocket_Launch',
    emoji: '⚡',
    defaultType: 'ingreso',
    bgLight: 'bg-[#ccfbf1]',
    textLight: 'text-[#115e59]',
    bgDark: 'bg-teal-500/20',
    textDark: 'text-teal-300',
    colorHex: '#14b8a6',
  },
  otros: {
    id: 'otros',
    name: 'Otros',
    icon: 'category',
    emoji: '📦',
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
  goals: [],
  configuredAt: new Date().toISOString(),
};

export const DEMO_MOVEMENTS: Movement[] = [
  {
    id: 'mov-1',
    title: 'Sueldo Mensual',
    amount: 3850.0,
    type: 'ingreso',
    category: 'sueldo',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 'mov-2',
    title: 'Caramel Macchiato & Croissant',
    amount: 9.8,
    type: 'hormiga',
    category: 'cafe',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mov-3',
    title: 'Netflix Ultra HD + Spotify Duo',
    amount: 28.99,
    type: 'hormiga',
    category: 'streaming',
    date: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: 'mov-4',
    title: 'Renta Apartamento & Admin',
    amount: 980.0,
    type: 'fijo',
    category: 'vivienda',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'mov-5',
    title: 'Burger Nocturna Delivery',
    amount: 24.5,
    type: 'hormiga',
    category: 'delivery',
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'mov-6',
    title: 'Compra Quincenal Supermercado',
    amount: 265.4,
    type: 'fijo',
    category: 'supermercado',
    date: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
];
