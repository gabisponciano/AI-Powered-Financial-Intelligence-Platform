'use client'
import { Upload, ArrowRight } from 'lucide-react'

export function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center max-w-sm animate-fade-in">
        {/* Abstract grid decoration */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-1 opacity-30">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm bg-accent-green"
                style={{ opacity: Math.random() * 0.8 + 0.2 }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-accent-green-dim border border-accent-green/30 flex items-center justify-center">
              <Upload size={18} className="text-accent-green" />
            </div>
          </div>
        </div>

        <h2
          className="text-2xl text-text-primary mb-2"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          Nenhum dado carregado
        </h2>
        <p className="text-sm text-text-secondary mb-8 leading-relaxed">
          Faça upload de um arquivo CSV ou XLSX com suas transações para começar a análise.
        </p>

        <button
          onClick={onUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-green text-bg-base text-sm font-500 hover:opacity-90 transition-opacity"
          style={{ fontWeight: 500 }}
        >
          Importar arquivo
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
