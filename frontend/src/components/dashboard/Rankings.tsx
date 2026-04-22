'use client'
import { useEffect, useState } from 'react'
import { fetchPorCliente, ClienteItem, fetchPiorCliente, PiorClienteItem } from '@/lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function fmtAtraso(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n)
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 w-full rounded-full bg-bg-border overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function TopClientes({ uploadId }: { uploadId: number }) {
  const [data, setData] = useState<ClienteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPorCliente(uploadId)
      .then((d) => {
        const top = [...d].sort((a, b) => b.receita - a.receita).slice(0, 6)
        setData(top)
      })
      .finally(() => setLoading(false))
  }, [uploadId])

  const max = Math.max(1, ...data.map((c) => c.receita))

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-5" style={{ fontFamily: 'var(--font-mono)' }}>
        Top Clientes
      </h3>
      {loading ? (
        <div className="space-y-4">{Array(5).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 rounded shimmer-bg" style={{ width: `${60 + i * 8}%` }} />
            <div className="h-1.5 rounded shimmer-bg" />
          </div>
        ))}</div>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-muted">Sem dados para exibir.</p>
      ) : (
        <div className="space-y-4">
          {data.map((c, i) => (
            <div key={c.cliente} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-text-primary truncate max-w-[60%]">{c.cliente}</span>
                <span className="text-xs text-text-secondary font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{fmt(c.receita)}</span>
              </div>
              <Bar value={c.receita} max={max} color="#00e5a0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PiorClientes({ uploadId }: { uploadId: number }) {
  const [data, setData] = useState<PiorClienteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPiorCliente(uploadId)
      .then((d) => {
        const worst = [...d].sort((a, b) => b.valor_atrasado - a.valor_atrasado).slice(0, 6)
        setData(worst)
      })
      .finally(() => setLoading(false))
  }, [uploadId])

  const max = Math.max(1, ...data.map((c) => c.valor_atrasado))

  return (
    <div className="bg-bg-surface border border-bg-border rounded-xl p-5">
      <h3 className="text-sm uppercase tracking-widest text-text-secondary mb-5" style={{ fontFamily: 'var(--font-mono)' }}>
        Piores Clientes (Atraso)
      </h3>
      {loading ? (
        <div className="space-y-4">{Array(5).fill(0).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 rounded shimmer-bg" style={{ width: `${60 + i * 8}%` }} />
            <div className="h-1.5 rounded shimmer-bg" />
          </div>
        ))}</div>
      ) : data.length === 0 ? (
        <p className="text-sm text-text-muted">Sem dados para exibir.</p>
      ) : (
        <div className="space-y-4">
          {data.map((c, i) => (
            <div key={c.cliente} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-text-primary truncate max-w-[60%]">{c.cliente}</span>
                <span className="text-xs text-[#ff4d6d] font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                  {fmtAtraso(c.valor_atrasado)}
                </span>
              </div>
              <Bar value={c.valor_atrasado} max={max} color="#ff4d6d" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
