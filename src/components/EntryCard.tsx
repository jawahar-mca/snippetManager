'use client'

import { Trash2, ExternalLink, Calendar, Tag } from 'lucide-react'
import { Entry } from '@/types'
import { LANGUAGE_LABELS, LANGUAGE_COLORS, formatDate, cn } from '@/lib/utils'

interface Props {
  entry: Entry
  query: string
  onDelete: (id: string) => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  )
}

export default function EntryCard({ entry, query, onDelete }: Props) {
  const excerpt = entry.explanation
    .replace(/#+\s/g, '').replace(/`/g, '').replace(/\*\*/g, '')
    .slice(0, 160) + '…'

  function confirmDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${entry.title}"?`)) onDelete(entry.id)
  }

  function openEntry() {
    window.location.hash = `entry/${entry.id}`
  }

  return (
    <div
      className="group relative rounded-xl border border-vault-border bg-vault-card hover:border-vault-bright/40 transition-all duration-200 overflow-hidden animate-slide-up cursor-pointer"
      onClick={openEntry}
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-vault-accent via-vault-bright to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-vault-text group-hover:text-vault-bright transition-colors leading-snug line-clamp-2">
              {highlight(entry.title, query)}
            </h2>
            <p className="text-xs text-vault-dim mt-0.5">
              <span className="text-vault-bright/60">#</span> {highlight(entry.topic, query)}
            </p>
          </div>
          <span className={cn('shrink-0 text-xs px-2 py-0.5 rounded-full border font-mono', LANGUAGE_COLORS[entry.language])}>
            {LANGUAGE_LABELS[entry.language]}
          </span>
        </div>

        <p className="text-sm text-vault-dim leading-relaxed line-clamp-3 mb-3">
          {highlight(excerpt, query)}
        </p>

        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {entry.tags.slice(0, 5).map(tag => (
              <span key={tag} className="tag-pill">{highlight(tag, query)}</span>
            ))}
            {entry.tags.length > 5 && (
              <span className="tag-pill opacity-50">+{entry.tags.length - 5}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-vault-dim pt-2 border-t border-vault-border/50">
          <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(entry.updatedAt)}</span>
          <span className="flex items-center gap-1"><Tag size={11} />{entry.codeBlocks.length} snippet{entry.codeBlocks.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1">
            <button onClick={confirmDelete}
              className="opacity-0 group-hover:opacity-100 hover:text-vault-red transition-all p-1 rounded">
              <Trash2 size={13} />
            </button>
            <button onClick={openEntry}
              className="opacity-0 group-hover:opacity-100 hover:text-vault-bright transition-all p-1 rounded">
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
