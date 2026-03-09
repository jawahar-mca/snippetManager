'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { Entry, CodeBlock, Language } from '@/types'
import { ALL_LANGUAGES, LANGUAGE_LABELS, cn } from '@/lib/utils'
import MonacoInput from './editor/MonacoInput'

interface Props {
  initial?: Entry
  onSave: (entry: Entry) => void
}

function emptyBlock(): CodeBlock {
  return { id: uuidv4(), language: 'typescript', code: '// Write your solution here\n', caption: '' }
}

export default function EntryForm({ initial, onSave }: Props) {
  const isEdit = !!initial

  const [title,       setTitle]       = useState(initial?.title ?? '')
  const [topic,       setTopic]       = useState(initial?.topic ?? '')
  const [tagsRaw,     setTagsRaw]     = useState(initial?.tags.join(', ') ?? '')
  const [language,    setLanguage]    = useState<Language>(initial?.language ?? 'typescript')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [blocks,      setBlocks]      = useState<CodeBlock[]>(initial?.codeBlocks ?? [emptyBlock()])
  const [errors,      setErrors]      = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!topic.trim()) e.topic = 'Topic is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const now = new Date().toISOString()
    const entry: Entry = {
      id:          initial?.id ?? uuidv4(),
      title:       title.trim(),
      topic:       topic.trim(),
      tags:        tagsRaw.split(',').map(t => t.trim()).filter(Boolean),
      language,
      explanation: explanation.trim(),
      codeBlocks:  blocks,
      createdAt:   initial?.createdAt ?? now,
      updatedAt:   now,
    }
    onSave(entry)
  }

  function addBlock() { setBlocks(prev => [...prev, emptyBlock()]) }
  function removeBlock(id: string) { setBlocks(prev => prev.filter(b => b.id !== id)) }
  function updateBlock(id: string, patch: Partial<CodeBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }

  const inputCls = 'w-full bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-dim/50 focus:outline-none focus:border-vault-bright/60 focus:ring-1 focus:ring-vault-bright/20 transition-all'
  const labelCls = 'block text-xs font-semibold text-vault-dim uppercase tracking-widest mb-1.5'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-vault-border bg-vault-bg/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()}
            className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-display font-bold text-vault-text flex-1">
            {isEdit ? 'Edit Entry' : 'New Entry'}
          </h1>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-vault-accent hover:bg-vault-bright transition-colors text-white text-sm font-medium">
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <div>
          <label className={labelCls}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Find duplicate characters in a string" className={inputCls} />
          {errors.title && <p className="text-xs text-vault-red mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Topic *</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Strings, Arrays, React Hooks" className={inputCls} />
            {errors.topic && <p className="text-xs text-vault-red mt-1">{errors.topic}</p>}
          </div>
          <div>
            <label className={labelCls}>Primary Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value as Language)} className={inputCls}>
              {ALL_LANGUAGES.map(l => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Tags</label>
          <input value={tagsRaw} onChange={e => setTagsRaw(e.target.value)}
            placeholder="duplicate, string, set, frequency  (comma-separated)" className={inputCls} />
          <p className="text-xs text-vault-dim mt-1">Comma-separated — these power the search.</p>
        </div>

        <div>
          <label className={labelCls}>Explanation / Notes</label>
          <textarea value={explanation} onChange={e => setExplanation(e.target.value)}
            placeholder={"## Problem\nDescribe the problem...\n\n## Approach\nExplain your solution...\n\n## Complexity\nTime: O(n)  Space: O(n)"}
            rows={8} className={cn(inputCls, 'resize-y font-mono text-xs leading-relaxed')} />
          <p className="text-xs text-vault-dim mt-1">Supports ## headings, **bold**, `code`</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Code Snippets</label>
            <button onClick={addBlock}
              className="flex items-center gap-1 text-xs text-vault-bright hover:text-white transition-colors">
              <Plus size={13} /> Add Snippet
            </button>
          </div>

          {blocks.map((block, idx) => (
            <div key={block.id} className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-vault-border bg-vault-card">
                <span className="text-xs text-vault-dim font-mono shrink-0">#{idx + 1}</span>
                <select value={block.language}
                  onChange={e => updateBlock(block.id, { language: e.target.value as Language })}
                  className="bg-transparent text-xs text-vault-text border border-vault-border rounded px-2 py-1 focus:outline-none focus:border-vault-bright/60">
                  {ALL_LANGUAGES.map(l => <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>)}
                </select>
                <input value={block.caption ?? ''} onChange={e => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className="flex-1 bg-transparent text-xs text-vault-dim placeholder:text-vault-dim/40 border-none focus:outline-none" />
                {blocks.length > 1 && (
                  <button onClick={() => removeBlock(block.id)}
                    className="text-vault-dim hover:text-vault-red transition-colors shrink-0">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <MonacoInput code={block.code} language={block.language}
                onChange={code => updateBlock(block.id, { code })} height="280px" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
