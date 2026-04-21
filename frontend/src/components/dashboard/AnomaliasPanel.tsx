'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchAnoaliasIA, AnomaliaEnrichedItem } from '@/lib/api'
import clsx from 'clsx'

const SEV = {
  alta: { label: 'Alta', color: 'text-accent-red bg-accent-red-dim border-accent-red/30' },
  media: { label: 'Média', color: 'text-accent-amber bg-amber-500/10 border-amber-500/30' },
  baixa: { label: 'Baixa', color: 'text-accent-blue bg-blue-500/10 border-blue-500/30' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function AnomaliaCard({ a, index }: { a: AnomaliaEnrichedItem; index: number }) {
  const [open, setOpen] = useState(false)
  const sev = SEV[a.severidade] ?? SEV.media

  return (
    <div
      className="bg-bg-elevated border border-bg-border rounded-xl overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg-border/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-accent-red-dim border border-accent-red/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={14} className="text-accent-red" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-500 text-text-primary" style={{ fontWeight: 500 }}>
              {fmt(a.amount)}
            </span>
            <span className={clsx('text-xs px-1.5 py-0.5 rounded border', sev.color)}>
              {sev.label}
            </span>
          </div>
          <p className="text-xs text-text-muted truncate">{a.customer} · {a.description}</p>
        </div>
        <div className="text-text-muted flex-shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-bg-border">
          <div className="flex items-start gap-2 mt-3">
            <Zap size={12} className="text-accent-green flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">{a.explicacao_ia}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-text-muted font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
            <span>Data: {a.date ? new Date(a.date).toLocaleDateString('pt-BR') : '—'}</span>
            <span>Status: {a.status}</span>
            <span>Cat: {a.category ?? '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function AnomaliasPanel({ uploadId }: { uploadId: number }) {
  const [data, setData] = useState<{ total: number; limiar: number; anomalias: AnomaliaEnrichedItem[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAnoaliasIA(uploadId)
      .then((res) => setData({ total: res.total_anomalias, limiar: res.limiar, anomalias: res.anomalias }))
      .finally(() => setLoading(false))
  }, [uploadId])

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-widest text-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
          Anomalias Detectadas
        </h3>
        {data && (
          <span className="text-xs text-text-muted font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
            limiar: {fmt(data.limiar)}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-text-muted">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Detectando anomalias...</span>
        </div>
      )}

      {!loading && data && data.anomalias.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-sm text-accent-green">✓ Nenhuma anomalia detectada</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-2">
          {data.anomalias.map((a, i) => <AnomaliaCard key={a.id} a={a} index={i} />)}
        </div>
      )}
    </div>
  )
}
