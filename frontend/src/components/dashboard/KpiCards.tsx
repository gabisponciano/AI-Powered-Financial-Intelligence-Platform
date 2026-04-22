'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, CreditCard, AlertCircle, Clock, Users, BarChart2 } from 'lucide-react'
import { fetchKpis, KPIs } from '@/lib/api'
import clsx from 'clsx'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function Skeleton() {
  return <div className="h-8 w-28 rounded shimmer-bg" />
}

interface KpiCardProps {
  label: string
  value: string
  icon: React.ReactNode
  accent?: 'green' | 'red' | 'amber' | 'blue'
  loading: boolean
  delay?: number
}

function KpiCard({ label, value, icon, accent = 'green', loading, delay = 0 }: KpiCardProps) {
  const accentClass = {
    green: 'text-accent-green bg-accent-green-dim border-accent-green/20',
    red: 'text-accent-red bg-accent-red-dim border-accent-red/20',
    amber: 'text-accent-amber bg-amber-500/10 border-amber-500/20',
    blue: 'text-accent-blue bg-blue-500/10 border-blue-500/20',
  }[accent]

  return (
    <div
      className="bg-bg-surface border border-bg-border rounded-xl p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs text-text-muted uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border', accentClass)}>
          {icon}
        </div>
      </div>
      {loading ? <Skeleton /> : (
        <p className="text-2xl font-display font-700 text-text-primary" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {value}
        </p>
      )}
    </div>
  )
}

export function KpiCards({ uploadId }: { uploadId: number }) {
  const [data, setData] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchKpis(uploadId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [uploadId])

  const cards = data ? [
    { label: 'Receita Total', value: fmt(data.receita_total), icon: <TrendingUp size={14} />, accent: 'green' as const },
    { label: 'Ticket Médio', value: fmt(data.ticket_medio), icon: <BarChart2 size={14} />, accent: 'blue' as const },
    { label: 'Transações', value: data.total_transacoes.toLocaleString('pt-BR'), icon: <CreditCard size={14} />, accent: 'green' as const },
    { label: 'Taxa de Inadimplência', value: `${data.taxa_inadimplencia.toFixed(1)}%`, icon: <AlertCircle size={14} />, accent: 'red' as const },
    { label: 'Valor Pendente', value: fmt(data.valor_pendente), icon: <Clock size={14} />, accent: 'amber' as const },
    { label: 'Inadimplentes', value: data.inadimplentes_count.toLocaleString('pt-BR'), icon: <Users size={14} />, accent: 'red' as const },
  ] : Array(6).fill(null)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <KpiCard
          key={i}
          label={card?.label ?? ''}
          value={card?.value ?? ''}
          icon={card?.icon ?? <div />}
          accent={card?.accent}
          loading={loading}
          delay={i * 60}
        />
      ))}
    </div>
  )
}
