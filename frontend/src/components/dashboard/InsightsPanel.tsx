'use client'
import { useCallback, useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { fetchInsights, Insight } from '@/lib/api'
import clsx from 'clsx'

const TYPE_CONFIG = {
  positivo: { icon: TrendingUp, color: 'text-accent-green', bg: 'bg-accent-green-dim border-accent-green/20', dot: 'bg-accent-green' },
  negativo: { icon: TrendingDown, color: 'text-accent-red', bg: 'bg-accent-red-dim border-accent-red/20', dot: 'bg-accent-red' },
  neutro: { icon: Minus, color: 'text-accent-blue', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-accent-blue' },
  alerta: { icon: AlertTriangle, color: 'text-accent-amber', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-accent-amber' },
}

export function InsightsPanel({ uploadId }: { uploadId: number }) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetchInsights(uploadId)
      setInsights(res.insights)
    } catch {
      setError('Erro ao gerar insights. O modelo pode estar ocupado.')
    } finally {
      setLoading(false)
    }
  }, [uploadId])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm uppercase tracking-widest text-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
          Insights
        </h3>
        <button
          onClick={load}
          disabled={loading}
          className="w-7 h-7 rounded-lg border border-bg-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 gap-3 text-text-muted">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Gerando análise com IA...</span>
        </div>
      )}

      {error && !loading && (
        <div className="py-8 text-center">
          <p className="text-sm text-accent-red">{error}</p>
          <button onClick={load} className="text-xs text-text-muted mt-2 hover:text-text-primary transition-colors">
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const cfg = TYPE_CONFIG[insight.tipo] ?? TYPE_CONFIG.neutro
            const Icon = cfg.icon
            return (
              <div
                key={i}
                className={clsx('flex gap-3 p-4 rounded-xl border animate-slide-up', cfg.bg)}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
              >
                <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-black/20', cfg.color)}>
                  <Icon size={13} />
                </div>
                <div>
                  <p className={clsx('text-sm font-500 mb-1', cfg.color)} style={{ fontWeight: 500 }}>
                    {insight.titulo}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">{insight.descricao}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
