'use client'
import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { UploadModal } from '@/components/ui/UploadModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { EvolucaoChart } from '@/components/dashboard/EvolucaoChart'
import { TopClientes } from '@/components/dashboard/Rankings'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { AnomaliasPanel } from '@/components/dashboard/AnomaliasPanel'
import { TransactionsList } from '@/components/dashboard/TransactionsList'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { useUpload } from '@/hooks/useUpload'
import clsx from 'clsx'

type View = 'dashboard' | 'transacoes' |'chat' |'insights' | 'anomalias' | 'clientes'

const PAGE_TITLES: Record<View, string> = {
  dashboard: 'Dashboard',
  transacoes: 'Transações',
  chat: 'Assistente Virtual',
  insights: 'Insights',
  anomalias: 'Anomalias',
  clientes: 'Clientes',
}

export default function Home() {
  const [view, setView] = useState<View>('dashboard')
  const [showUpload, setShowUpload] = useState(false)
  const { upload, uploading, uploadId, setUploadId } = useUpload()

  const [mountedViews, setMountedViews] = useState<Partial<Record<View, boolean>>>({ dashboard: true })
  const contentKey = useMemo(() => (uploadId ? `upload-${uploadId}` : 'no-upload'), [uploadId])

  useEffect(() => {
    // New upload => reset cached views/state
    setMountedViews({ dashboard: true })
  }, [contentKey])

  function handleUploadSuccess(id: number) {
    setUploadId(id)
    setView('dashboard')
  }

  function navigate(next: View) {
    setView(next)
    setMountedViews((prev) => ({ ...prev, [next]: true }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <Sidebar
        active={view}
        onNavigate={(id) => navigate(id as View)}
        uploadId={uploadId}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Center panel */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Topbar */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-bg-border flex-shrink-0">
            <div>
              <h1
                className="text-lg text-accent-green"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
              >
                {PAGE_TITLES[view]}
              </h1>
              {uploadId && (
                <p className="text-xs text-text-muted font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                  upload #{uploadId}
                </p>
              )}
            </div>

            {uploadId && (
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-bg-border text-text-secondary hover:border-accent-green/40 hover:text-accent-green transition-all"
              >
                Trocar arquivo
              </button>
            )}
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" key={contentKey}>
            {!uploadId ? (
              <EmptyState onUpload={() => setShowUpload(true)} />
            ) : (
              <>
                {mountedViews.dashboard && (
                  <div className={clsx(view === 'dashboard' ? 'block' : 'hidden')}>
                    <DashboardView uploadId={uploadId} />
                  </div>
                )}

                {mountedViews.transacoes && (
                  <div className={clsx(view === 'transacoes' ? 'block' : 'hidden', 'p-6')}>
                    <TransactionsList uploadId={uploadId} />
                  </div>
                )}

                {mountedViews.chat && (
                  <div className={clsx(view === 'chat' ? 'block' : 'hidden', 'h-full')}>
                    <ChatPanel uploadId={uploadId} />
                  </div>
                )}

                {mountedViews.insights && (
                  <div className={clsx(view === 'insights' ? 'block' : 'hidden', 'p-6')}>
                    <InsightsPanel uploadId={uploadId} />
                  </div>
                )}

                {mountedViews.anomalias && (
                  <div className={clsx(view === 'anomalias' ? 'block' : 'hidden', 'p-6')}>
                    <AnomaliasPanel uploadId={uploadId} />
                  </div>
                )}

                {mountedViews.clientes && (
                  <div className={clsx(view === 'clientes' ? 'block' : 'hidden', 'p-6 grid grid-cols-1 lg:grid-cols-2 gap-4')}>
                    <TopClientes uploadId={uploadId} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
          uploadFn={upload}
          uploading={uploading}
        />
      )}
    </div>
  )
}

/* ── Dashboard layout ─────────────────────────────────── */
function DashboardView({ uploadId }: { uploadId: number }) {
  return (
    <div className="p-6 space-y-4">
      <KpiCards uploadId={uploadId} />
      <EvolucaoChart uploadId={uploadId} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopClientes uploadId={uploadId} />
        {/* <TopCategorias uploadId={uploadId} /> */}
      </div>
      {/* <InsightsPanel uploadId={uploadId} /> */}
    </div>
  )
}
