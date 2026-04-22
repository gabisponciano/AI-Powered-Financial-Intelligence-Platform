const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData

  const res = await fetch(`${BASE}${path}`, {
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Upload ──────────────────────────────────────────────
export async function uploadFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload/file_upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Analysis ────────────────────────────────────────────
export async function fetchKpis(uploadId: number) {
  return req<KPIs>(`/analysis/kpis?upload_id=${uploadId}`)
}

export async function fetchEvolucao(uploadId: number) {
  return req<EvolucaoItem[]>(`/analysis/evolucao?upload_id=${uploadId}`)
}

export async function fetchPorCliente(uploadId: number) {
  return req<ClienteItem[]>(`/analysis/por-cliente?upload_id=${uploadId}`)
}

export async function fetchPorCategoria(uploadId: number) {
  return req<CategoriaItem[]>(`/analysis/por-categoria?upload_id=${uploadId}`)
}

export async function fetchAnomalias(uploadId: number) {
  return req<AnomaliaItem[]>(`/analysis/anomalias?upload_id=${uploadId}`)
}

// ── LLM Analysis ────────────────────────────────────────
export async function fetchInsights(uploadId: number) {
  return req<InsightsResponse>(`/llm_analysis/insights?upload_id=${uploadId}`)
}

export async function fetchAnoaliasIA(uploadId: number) {
  return req<AnomaliasIAResponse>(`/llm_analysis/anomalias-ia?upload_id=${uploadId}`)
}

export async function naturalLanguageQuery(uploadId: number, question: string) {
  return req<NLQueryResponse>(`/llm_analysis/query?upload_id=${uploadId}`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
}

// ── RAG ─────────────────────────────────────────────────
export async function ragAsk(question: string, uploadId?: number) {
  return req<RagResponse>(`/rag/ask`, {
    method: 'POST',
    body: JSON.stringify({ question, upload_id: uploadId ?? null }),
  })
}

// ── Types ────────────────────────────────────────────────
export interface KPIs {
  receita_total: number
  ticket_medio: number
  total_transacoes: number
  taxa_inadimplencia: number
  valor_pendente: number
  inadimplentes_count: number
}

export interface EvolucaoItem {
  mes: string
  pago?: number
  pendente?: number
  atrasado?: number
  [key: string]: string | number | undefined
}

export interface ClienteItem { cliente: string; receita: number }
export interface CategoriaItem { categoria: string; total: number }
export interface AnomaliaItem {
  id: number; amount: number; customer: string
  description: string; date: string; status: string; motivo: string
}

export interface Insight {
  titulo: string; descricao: string; tipo: 'positivo' | 'negativo' | 'neutro' | 'alerta'
}
export interface InsightsResponse { insights: Insight[] }

export interface AnomaliasIAResponse {
  total_anomalias: number; limiar: number; media: number
  desvio_padrao: number; anomalias: AnomaliaEnrichedItem[]
}
export interface AnomaliaEnrichedItem extends AnomaliaItem {
  explicacao_ia: string; severidade: 'alta' | 'media' | 'baixa'
}

export interface NLQueryResponse { question: string; answer: string; context_used: object }
export interface RagResponse { answer: string; sources_used: number }
