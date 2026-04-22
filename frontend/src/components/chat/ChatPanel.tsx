'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { ragAsk } from '@/lib/api'
import clsx from 'clsx'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: number
}

const SUGGESTIONS = [
  'Qual cliente tem maior risco de inadimplência?',
  'Qual foi o mês com maior receita?',
  'Resuma os principais padrões das transações',
]

export function ChatPanel({ uploadId }: { uploadId: number | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(q?: string) {
    const question = q ?? input.trim()
    if (!question || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: question }])
    setLoading(true)
    try {
      const res = await ragAsk(question, uploadId ?? undefined)
      setMessages((m) => [...m, { role: 'assistant', content: res.answer, sources: res.sources_used }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Erro ao processar sua pergunta. Verifique se há dados carregados.' }])
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    if (loading) return
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-bg-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-green-dim border border-accent-green/20 flex items-center justify-center">
          <Sparkles size={14} className="text-accent-green" />
        </div>
        <div>
          <h2 className="text-sm font-500 text-text-primary" style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Chat IA</h2>
          <p className="text-xs text-text-muted">
            {uploadId ? `Analisando upload #${uploadId}` : 'Todos os uploads'}
          </p>
        </div>
        <div className="flex-1" />
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            disabled={loading}
            className="w-8 h-8 rounded-lg border border-bg-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors flex items-center justify-center"
            aria-label="Limpar conversa"
            title="Limpar conversa"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 mt-4 animate-fade-in">
            <p className="text-xs text-text-muted text-center mb-2">Sugestões</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-xs px-3 py-2.5 rounded-lg border border-bg-border text-text-secondary hover:border-accent-green/40 hover:text-text-primary transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={clsx('flex gap-3 animate-slide-up', m.role === 'user' ? 'flex-row-reverse' : '')}
            style={{ animationDelay: '0ms', animationFillMode: 'both' }}
          >
            <div className={clsx(
              'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center',
              m.role === 'assistant' ? 'bg-accent-green-dim text-accent-green' : 'bg-bg-elevated text-text-secondary'
            )}>
              {m.role === 'assistant' ? <Bot size={13} /> : <User size={13} />}
            </div>
            <div className={clsx(
              'max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed',
              m.role === 'assistant'
                ? 'bg-bg-elevated text-text-primary border border-bg-border'
                : 'bg-accent-green-dim text-accent-green border border-accent-green/20'
            )}>
              {m.content}
              {m.sources !== undefined && (
                <p className="text-xs text-text-muted mt-1.5 border-t border-bg-border pt-1.5">
                  {m.sources} transações consultadas
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-accent-green-dim flex items-center justify-center">
              <Bot size={13} className="text-accent-green" />
            </div>
            <div className="bg-bg-elevated border border-bg-border rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Loader2 size={12} className="text-accent-green animate-spin" />
              <span className="text-xs text-text-muted">Analisando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-bg-border">
        <div className="flex items-center gap-2 bg-bg-elevated border border-bg-border rounded-xl px-3 py-2 focus-within:border-accent-green/40 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Pergunte sobre seus dados..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent-yellow disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
          >
            <Send size={12} className="text-text-primary" />
          </button>
        </div>
      </div>
    </div>
  )
}
