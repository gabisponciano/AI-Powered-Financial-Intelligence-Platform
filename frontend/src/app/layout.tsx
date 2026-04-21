import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Finflow — Inteligência Financeira',
  description: 'Análise inteligente de transações financeiras',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="noise">{children}</body>
    </html>
  )
}
