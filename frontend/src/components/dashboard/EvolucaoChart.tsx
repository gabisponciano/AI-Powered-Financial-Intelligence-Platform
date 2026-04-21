'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { fetchEvolucao, EvolucaoItem } from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function ChartSkeleton() {
  return <div className="h-48 rounded-xl shimmer-bg" />
}

export function EvolucaoChart({ uploadId }: { uploadId: number }) {
  const [data, setData] = useState<EvolucaoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchEvolucao(uploadId)
      .then(setData)
      .finally(() => setLoading(false))
  }, [uploadId])

  if (loading) return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <div className="h-4 w-32 rounded shimmer-bg mb-4" />
      <ChartSkeleton />
    </div>
  )

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-500 text-text-secondary uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
          Evolução Mensal
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-green inline-block" />Pago</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-amber inline-block" />Pendente</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-red inline-block" />Atrasado</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gPago" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#00e5a0" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gPendente" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gAtrasado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4d6d" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#ff4d6d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#222228" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="mes" tick={{ fill: '#44445a', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#44445a', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: '#18181d', border: '1px solid #222228', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-body)' }}
            labelStyle={{ color: '#8888a0' }}
            formatter={(v: number) => [fmt(v), '']}
          />
          <Area type="monotone" dataKey="pago" stroke="#00e5a0" strokeWidth={2} fill="url(#gPago)" dot={false} />
          <Area type="monotone" dataKey="pendente" stroke="#f59e0b" strokeWidth={2} fill="url(#gPendente)" dot={false} />
          <Area type="monotone" dataKey="atrasado" stroke="#ff4d6d" strokeWidth={2} fill="url(#gAtrasado)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
