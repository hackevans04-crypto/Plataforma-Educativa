import type { Metadata } from 'next'
import { Bebas_Neue, Barlow } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import ThemeGuard from '@/components/theme-guard'
import { TYPOGRAPHY_GOOGLE_FONTS_HREF } from '@/lib/typography-fonts'
import './globals.css'

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-bebas'
});

const barlow = Barlow({ 
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-barlow'
});

export const metadata: Metadata = {
  title: 'Hack Evans | Consultoría Educativa - Plataforma #1 para Docentes Ecuatorianos',
  description: 'Simuladores actualizados QSM 2026, bancos de preguntas y capacitación continua para docentes. Prepárate para tu evaluación docente con la plataforma líder en Ecuador.',
  keywords: 'QSM, Quiero Ser Maestro, INEVAL, docentes Ecuador, simuladores, evaluación docente',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

const themeScript = `
(() => {
  try {
    const path = window.location.pathname || '';
    const scope = path.startsWith('/admin') ? 'admin' : path.startsWith('/dashboard') ? 'dashboard' : null;
    if (!scope) {
      document.documentElement.classList.add('dark');
      return;
    }
    const key = scope === 'admin' ? 'he-theme-admin' : 'he-theme-dashboard';
    const stored = localStorage.getItem(key);
    const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={TYPOGRAPHY_GOOGLE_FONTS_HREF} />
      </head>
      <body className={`${bebasNeue.variable} ${barlow.variable} font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>
          <ThemeGuard />
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
