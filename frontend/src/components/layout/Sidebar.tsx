'use client'
import { useState } from 'react'
import {
  LayoutDashboard, MessageSquare, Lightbulb, AlertTriangle,
  BarChart2, Upload, ChevronRight, Zap, List
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transacoes', label: 'Transações', icon: List },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'anomalias', label: 'Anomalias', icon: AlertTriangle },
  { id: 'clientes', label: 'Clientes', icon: BarChart2 },
]

interface SidebarProps {
  active: string
  onNavigate: (id: string) => void
  uploadId: number | null
  onUploadClick: () => void
}

export function Sidebar({ active, onNavigate, uploadId, onUploadClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'relative flex flex-col border-r border-bg-border bg-bg-surface transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-bg-border">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-green flex items-center justify-center">
          <Zap size={16} className="text-bg-base" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-display font-700 text-lg tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Finflow
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-accent-green-dim text-accent-green'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              )}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
              {!collapsed && (
                <span style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
              )}
              {!collapsed && isActive && (
                <div className="ml-auto w-1 h-4 rounded-full bg-accent-green" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Upload status + button */}
      <div className="p-3 border-t border-bg-border">
        <button
          onClick={onUploadClick}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
            'border border-dashed border-bg-border hover:border-accent-green hover:text-accent-green text-text-muted',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Upload size={15} className="flex-shrink-0" />
          {!collapsed && (
            <span style={{ fontFamily: 'var(--font-body)' }}>
              {uploadId ? `#${uploadId} carregado` : 'Upload CSV'}
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-10"
      >
        <ChevronRight size={12} className={clsx('transition-transform', collapsed ? '' : 'rotate-180')} />
      </button>
    </aside>
  )
}
