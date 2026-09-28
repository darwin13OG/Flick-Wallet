# FlickWallet

Aplicación web progresiva (**PWA Offline-First**) de finanzas personales orientada al control de **gastos hormiga**, seguimiento de compromisos mensuales con cuotas, metas de ahorro (**Alcancías**) y cálculo de salud financiera en tiempo real.

Construida con **React 19**, **TypeScript estricto** y **Tailwind CSS v4**, sin dependencias externas de almacenamiento en la nube: toda la información financiera permanece de forma privada en el dispositivo del usuario con soporte de exportación y restauración en formato `.json`.

---

## Características Principales

- **Radar de Gastos Hormiga:** Detección y cálculo del impacto mensual y anualizado de gastos cotidianos pequeños frente al tope configurable del usuario (por defecto 10% del ingreso mensual).
- **Alcancías de Ahorro (Depósitos y Retiros):** Creación de metas con seguimiento porcentual, abonos directos y retiros parciales o totales hacia el saldo disponible.
- **Compromisos, Suscripciones y Deudas por Cuotas:** Calendario de vencimientos mensuales (arriendo, gimnasio, servicios, suscripciones y créditos) con seguimiento automático de cuotas pagadas (`Cuota X de Y`), saldo pendiente de deuda y descuento opcional al marcar como pagado.
- **Score Financiero en Tiempo Real (0 – 980 pts):** Algoritmo transparente basado en tasa de ahorro libre (`hasta +280 pts`), hábito de ahorro en alcancías (`hasta +100 pts`) y penalización proporcional por gastos hormiga (`hasta -280 pts`).
- **Motor Multidivisa en Vivo:** Formateo numérico en tiempo real mientras se escribe (`COP`, `USD`, `MXN`, `EUR`, `ARS`, `PEN`, `CLP`, `GBP`) respetando separadores de miles y decimales propios de cada moneda.
- **PWA Instalable + Notificaciones Nativas:** Service Worker estático con caché offline, recordatorio diario programable a las **9:00 PM**, síntesis de sonido mediante **Web Audio API** (instancia `AudioContext` única reutilizable) e ícono monocromático (`purpose: "monochrome"`) para la barra de estado de Android.
- **Seguridad y Respaldo Local:** Bloqueo por PIN numérico de 4 dígitos al iniciar la aplicación y sistema de **Copia de Seguridad** (exportación e importación de archivos `.json`).

---

## Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **UI & Estado** | React 19 + TypeScript (`strict`) |
| **Estilos** | Tailwind CSS v4 (`@tailwindcss/vite`) + Sistema visual Claymorphism 3D |
| **Iconografía** | Material Symbols Outlined + SVG vectoriales propios |
| **Audio & Alertas** | Web Audio API (`OscillatorNode`) + Web Notifications API / Service Worker |
| **Persistencia** | `localStorage` versionado + Importación/Exportación JSON |
| **Empaquetador** | Vite 6 |

---

## Estructura del Proyecto

```text
├── public/
│   ├── icon.svg                     # Icono vectorial principal
│   ├── manifest.webmanifest         # Manifiesto PWA (any, maskable y monochrome)
│   ├── notification-badge.png       # Silueta monocromática RGBA para notificaciones Android
│   ├── pwa-192x192.png              # Icono PWA 192x192
│   ├── pwa-512x512.png              # Icono PWA 512x512
│   ├── pwa-maskable-512x512.png     # Icono adaptativo Android (Maskable)
│   └── sw.js                        # Service Worker (Caché Offline + Recordatorio 9:00 PM)
├── src/
│   ├── components/
│   │   ├── AlcanciaView.tsx         # Gestión de metas de ahorro, abonos y retiros
│   │   ├── AnalyticsView.tsx        # Score financiero, gráfico Donut SVG e historial indexado O(1)
│   │   ├── AntIcon.tsx              # Iconografía vectorial personalizada
│   │   ├── ClayAvatar.tsx           # Avatar de usuario y logotipo 3D
│   │   ├── DashboardView.tsx        # Panel principal, radar hormiga y listado paginado
│   │   ├── NotificationCenter.tsx   # Centro de notificaciones, Toasts y motor Web Audio API
│   │   ├── OnboardingView.tsx       # Configuración inicial y validación de ingreso mensual
│   │   ├── PinLockScreen.tsx        # Pantalla de desbloqueo por PIN de 4 dígitos
│   │   ├── PWAInstallPrompt.tsx     # Detección e instalación nativa en Android, iOS y PC
│   │   ├── QuickAddView.tsx         # Registro rápido con soporte de teclado físico y táctil
│   │   ├── SubscriptionsDebtsView.tsx # Control de pagos fijos, suscripciones y cuotas de deuda
│   │   └── VaultSettingsView.tsx    # Ajustes de perfil, divisa, PIN, notificaciones y copias JSON
│   ├── constants/
│   │   └── walletData.ts            # Catálogo de divisas, categorías y formateadores numéricos
│   ├── types/
│   │   └── wallet.ts                # Contratos e interfaces TypeScript
│   ├── App.tsx                      # Orquestador de estado, persistencia y recordatorios
│   ├── index.css                    # Configuración de tema y variante explícita de modo oscuro
│   └── main.tsx                     # Punto de entrada y registro del Service Worker
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Instalación y Desarrollo Local

### Requisitos previos
- **Node.js** `>= 18.0.0` (recomendado Node 20 LTS)
- **npm** `>= 9.0.0`

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en http://localhost:3000
npm run dev

# 3. Verificar tipado estricto con TypeScript
npm run lint

# 4. Generar compilación de producción en /dist
npm run build
```

---

## Despliegue en Cloudflare Pages / Vercel / Netlify

El proyecto incluye configuración lista para despliegue estático (`public/_redirects`, `public/_headers`, `.nvmrc` y `.npmrc`):

- **Framework preset:** `React (Vite)`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** `20`
