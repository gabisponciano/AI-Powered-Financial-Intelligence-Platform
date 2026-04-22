'use client'
import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react'
import { fetchTransacoes, TransacaoItem, TransacoesResponse } from '@/lib/api'

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function fmtMoney(n: number | null) {
  if (n == null || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR')
}

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? '').toLowerCase()
  const klass =
    s === 'pago'
      ? 'text-accent-green bg-accent-green-dim border-accent-green/20'
      : s === 'atrasado'
        ? 'text-accent-red bg-accent-red-dim border-accent-red/20'
        : s === 'pendente'
          ? 'text-accent-amber bg-amber-500/10 border-amber-500/20'
          : 'text-text-muted bg-bg-elevated border-bg-border'

  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs border', klass)}>
      {status ?? '—'}
    </span>
  )
}

const inputClass =
  'w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/30 focus:border-accent-green/40'

export function TransactionsList({ uploadId }: { uploadId: number }) {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [customer, setCustomer] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState<string>('')
  const [maxAmount, setMaxAmount] = useState<string>('')

  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [limit, setLimit] = useState(25)
  const [offset, setOffset] = useState(0)

  const qDebounced = useDebounced(q, 350)
  const customerDebounced = useDebounced(customer, 350)
  const categoryDebounced = useDebounced(category, 350)

  const [data, setData] = useState<TransacoesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = Math.floor(offset / limit) + 1
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const query = useMemo(
    () => ({
      uploadId,
      status: status || undefined,
      q: qDebounced.trim() || undefined,
      customer: customerDebounced.trim() || undefined,
      category: categoryDebounced.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minAmount: minAmount.trim() === '' ? null : Number(minAmount),
      maxAmount: maxAmount.trim() === '' ? null : Number(maxAmount),
      sortBy,
      sortDir,
      limit,
      offset,
    }),
    [
      uploadId,
      status,
      qDebounced,
      customerDebounced,
      categoryDebounced,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy,
      sortDir,
      limit,
      offset,
    ]
  )

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchTransacoes(query)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erro ao carregar transações'))
      .finally(() => setLoading(false))
  }, [query])

  // Reset paginação quando filtros mudarem
  useEffect(() => {
    setOffset(0)
  }, [uploadId, status, qDebounced, customerDebounced, categoryDebounced, startDate, endDate, minAmount, maxAmount])

  function resetFilters() {
    setStatus('')
    setQ('')
    setCustomer('')
    setCategory('')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setSortBy('date')
    setSortDir('desc')
    setLimit(25)
    setOffset(0)
  }

  const items: TransacaoItem[] = data?.items ?? []
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)

  return (
    <section className="bg-bg-surface border border-bg-border rounded-2xl overflow-hidden">
      <header className="p-5 border-b border-bg-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              className="text-lg text-text-primary font-display font-700"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
            >
              Transações
            </h2>
            <p className="text-xs text-text-muted mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
              {loading ? 'Carregando...' : `${total.toLocaleString('pt-BR')} registros • exibindo ${from}-${to}`}
            </p>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-bg-border text-text-secondary hover:border-accent-green/40 hover:text-accent-green transition-all"
          >
            <RotateCcw size={14} />
            Limpar filtros
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className={clsx(inputClass, 'pl-9')}
                placeholder="Buscar (cliente, descrição, categoria)"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Status (todos)</option>
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
            <option value="atrasado">Atrasado</option>
          </select>

          <input
            className={inputClass}
            placeholder="Cliente"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />

          <input
            className={inputClass}
            placeholder="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 lg:col-span-6">
            <input
              className={inputClass}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              className={inputClass}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-6">
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="Valor mín."
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="Valor máx."
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-6">
            <select className={inputClass} value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}>
              <option value="date">Ordenar: Data</option>
              <option value="amount">Ordenar: Valor</option>
            </select>
            <select className={inputClass} value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>

          <div className="lg:col-span-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>Por página</span>
              <select
                className="bg-bg-elevated border border-bg-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none"
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0) }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0 || loading}
                className="w-9 h-9 rounded-lg border border-bg-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-xs text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setOffset(Math.min((totalPages - 1) * limit, offset + limit))}
                disabled={offset + limit >= total || loading}
                className="w-9 h-9 rounded-lg border border-bg-border bg-bg-elevated text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-accent-red mt-3">{error}</p>}
      </header>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg-surface border-b border-bg-border">
            <tr className="text-xs uppercase tracking-widest text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              <th className="text-left px-5 py-3 whitespace-nowrap">Data</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Cliente</th>
              <th className="text-left px-5 py-3 min-w-[360px]">Descrição</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Categoria</th>
              <th className="text-left px-5 py-3 whitespace-nowrap">Status</th>
              <th className="text-right px-5 py-3 whitespace-nowrap">Valor</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-bg-border">
                  <td className="px-5 py-3"><div className="h-4 w-20 rounded shimmer-bg" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-32 rounded shimmer-bg" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-80 rounded shimmer-bg" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-28 rounded shimmer-bg" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-20 rounded shimmer-bg" /></td>
                  <td className="px-5 py-3"><div className="h-4 w-24 ml-auto rounded shimmer-bg" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-text-muted">
                  Nenhuma transação encontrada com os filtros atuais.
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="border-b border-bg-border hover:bg-bg-elevated/60 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{fmtDate(t.date)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-primary">{t.customer ?? '—'}</td>
                  <td className="px-5 py-3 text-text-secondary">{t.description ?? '—'}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">{t.category ?? '—'}</td>
                  <td className="px-5 py-3 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-mono text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                    {fmtMoney(t.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

