'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Pencil, Trash2, Calendar, Copy, Check } from 'lucide-react'
import { Entry } from '@/types'
import { loadEntries } from '@/lib/storage'
import { LANGUAGE_LABELS, LANGUAGE_COLORS, formatDate, cn } from '@/lib/utils'
import MonacoBlock from '@/components/editor/MonacoBlock'

interface Props {
  id: string
  onDelete: (id: string) => void
}

export default function EntryDetail({ id, onDelete }: Props) {
  const [entry, setEntry] = useState<Entry | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const found = loadEntries().find(e => e.id === id)
    if (found) setEntry(found)
    else setNotFound(true)
  }, [id])

  function handleDelete() {
    if (!entry) return
    if (!confirm(`Delete "${entry.title}"?`)) return
    onDelete(entry.id)
  }

  function copyCode(code: string, blockId: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(blockId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center text-vault-dim">
      Entry not found.
      <button className="ml-2 text-vault-bright underline" onClick={() => { window.location.hash = '/' }}>Go back</button>
    </div>
  )

  if (!entry) return (
    <div className="min-h-screen flex items-center justify-center text-vault-dim">Loading…</div>
  )

  function renderExplanation(md: string) {
    return md.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-vault-bright font-display text-lg font-semibold mt-6 mb-2">{line.slice(3)}</h2>
      if (line.startsWith('### ')) return <h3 key={i} className="text-vault-text font-semibold mt-4 mb-1">{line.slice(4)}</h3>
      if (line.startsWith('- ')) return <li key={i} className="text-vault-dim text-sm ml-4 list-disc">{renderInline(line.slice(2))}</li>
      if (!line.trim()) return <br key={i} />
      return <p key={i} className="text-vault-dim text-sm leading-relaxed">{renderInline(line)}</p>
    })
  }

  function renderInline(text: string): React.ReactNode {
    return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="font-mono text-vault-green bg-vault-muted/40 px-1 py-0.5 rounded text-xs">{part.slice(1, -1)}</code>
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="text-vault-text font-semibold">{part.slice(2, -2)}</strong>
      return part
    })
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <header className="sticky top-0 z-40 border-b border-vault-border bg-vault-bg/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => { window.location.hash = '/' }}
            className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-vault-text truncate">{entry.title}</h1>
            <p className="text-xs text-vault-dim">{entry.topic}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { window.location.hash = `edit/${entry.id}` }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-vault-border text-vault-dim hover:text-vault-text hover:border-vault-muted transition-colors text-sm">
              <Pencil size={13} /> Edit
            </button>
            <button onClick={handleDelete}
              className="p-2 rounded-lg text-vault-dim hover:text-vault-red hover:bg-vault-red/10 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={cn('text-xs px-2.5 py-1 rounded-full border font-mono', LANGUAGE_COLORS[entry.language])}>
            {LANGUAGE_LABELS[entry.language]}
          </span>
          <span className="flex items-center gap-1 text-xs text-vault-dim">
            <Calendar size={11} /> {formatDate(entry.updatedAt)}
          </span>
          {entry.tags.map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
        </div>

        {entry.explanation && (
          <section className="mb-8 p-5 rounded-xl border border-vault-border bg-vault-surface">
            <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest mb-4">Explanation</p>
            <div className="space-y-1">{renderExplanation(entry.explanation)}</div>
          </section>
        )}

        <section className="space-y-6">
          <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest">
            Code Snippets ({entry.codeBlocks.length})
          </p>
          {entry.codeBlocks.map(block => (
            <div key={block.id} className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-vault-border bg-vault-card">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono', LANGUAGE_COLORS[block.language])}>
                    {LANGUAGE_LABELS[block.language]}
                  </span>
                  {block.caption && <span className="text-sm text-vault-dim">{block.caption}</span>}
                </div>
                <button onClick={() => copyCode(block.code, block.id)}
                  className="flex items-center gap-1.5 text-xs text-vault-dim hover:text-vault-bright transition-colors px-2 py-1 rounded">
                  {copiedId === block.id
                    ? <><Check size={12} className="text-vault-green" /> Copied</>
                    : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <MonacoBlock code={block.code} language={block.language} readOnly={true} />
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
