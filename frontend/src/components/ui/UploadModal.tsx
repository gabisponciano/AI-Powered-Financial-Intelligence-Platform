'use client'
import { useRef, useState } from 'react'
import { Upload, X, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface UploadModalProps {
  onClose: () => void
  onSuccess: (uploadId: number) => void
  uploadFn: (file: File) => Promise<number | null>
  uploading: boolean
}

export function UploadModal({ onClose, onSuccess, uploadFn, uploading }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(f: File) {
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) {
      setError('Por favor, envie um arquivo CSV ou XLSX')
      return
    }
    
    setFile(f)
    setError(null)
    const id = await uploadFn(f)
    if (id !== null) { 
      setDone(true)
      setTimeout(() => { onSuccess(id); onClose() }, 1200) 
    } else {
      setError('Erro ao fazer upload do arquivo')
      setFile(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-bg-surface border border-bg-border rounded-2xl p-6 shadow-2xl animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-xl font-700 text-text-primary mb-1" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Importar arquivo
        </h2>
        <p className="text-sm text-text-secondary mb-6">CSV ou XLSX com suas transações</p>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3 text-accent-green animate-fade-in">
            <CheckCircle2 size={40} />
            <span className="text-sm">Upload concluído!</span>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
              onClick={() => {
                console.log('Click on drop area')
                inputRef.current?.click()
              }}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 min-h-48',
                dragging
                  ? 'border-accent-green bg-accent-green-dim'
                  : 'border-bg-border hover:border-accent-green/50 bg-bg-elevated'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => { 
                  console.log('File input changed')
                  const f = e.target.files?.[0]
                  if (f) handleFile(f) 
                }}
              />
              {uploading ? (
                <Loader2 size={28} className="text-accent-green animate-spin" />
              ) : file ? (
                <FileText size={28} className="text-accent-green" />
              ) : (
                <Upload size={28} className="text-text-muted" />
              )}
              <div className="text-center">
                <p className="text-sm text-text-primary">
                  {uploading ? 'Processando...' : file ? file.name : 'Arraste ou clique para selecionar'}
                </p>
                {!file && !uploading && (
                  <p className="text-xs text-text-muted mt-1">.csv ou .xlsx</p>
                )}
              </div>
            </div>
            {error && (
              <p className="text-xs text-accent-red mt-3 text-center">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
