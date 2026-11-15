import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { site } from '@/lib/site'
import './globals.css'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--fonte-serif',
  display: 'swap',
})
const sans = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--fonte-sans', display: 'swap' })

export const metadata: Metadata = {
  // Endereço público (a Vercel informa sozinha); usado na prévia ao compartilhar o link.
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000',
  ),
  title: `${site.nome} · ${site.profissao} | ${site.crp}`,
  description:
    'Psicóloga em Brasília: acolhimento na gestação, no puerpério, na parentalidade e no cuidado com a saúde mental. Atendimento presencial, online ou em domicílio.',
  openGraph: {
    title: `${site.nome} · ${site.profissao}`,
    description: 'Cuidar da sua saúde mental também é parte da jornada da maternidade.',
    images: ['/img/logo.png'],
    locale: 'pt_BR',
    type: 'website',
  },
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#fbf3ee',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
