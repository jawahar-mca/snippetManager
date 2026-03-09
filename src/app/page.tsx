'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Download, Upload, BookOpen, Hash, Cpu } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { search } from '@/lib/search'
import { exportEntries } from '@/lib/storage'
import EntryCard from '@/components/EntryCard'
import SearchBar from '@/components/search/SearchBar'
import LanguageFilter from '@/components/search/LanguageFilter'
import { Language } from '@/types'

export default function HomePage() {
  const { entries, loading, remove, importAll } = useEntries()
  const [query, setQuery] = useState('')
  const [langFilter, setLangFilter] = useState<Language | 'all'>('all')
  const importRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    let list = search(query, entries)
    if (langFilter !== 'all') {
      list = list.filter(r => r.entry.language === langFilter)
    }
    return list
  }, [query, entries, langFilter])

  const topics = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach(e => map.set(e.topic, (map.get(e.topic) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [entries])

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const ok = importAll(ev.target?.result as string)
      if (!ok) alert('Invalid backup file.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-vault-border bg-vault-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-vault-accent flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-vault-text tracking-tight">
              SnippetManager
            </span>
          </Link>

          <div className="flex-1 max-w-2xl mx-auto">
            <SearchBar value={query} onChange={setQuery} count={results.length} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={exportEntries} title="Export backup JSON"
              className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
              <Download size={16} />
            </button>
            <button onClick={() => importRef.current?.click()} title="Import backup JSON"
              className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
              <Upload size={16} />
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Link href="/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-accent hover:bg-vault-bright transition-colors text-white text-sm font-medium">
              <Plus size={15} /> New Entry
            </Link>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 gap-6 py-6">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-52 shrink-0">
          <div className="rounded-xl border border-vault-border bg-vault-surface p-4">
            <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest mb-3">Topics</p>
            <ul className="space-y-1">
              <li>
                <button onClick={() => { setQuery(''); setLangFilter('all') }}
                  className="w-full text-left flex items-center justify-between text-sm px-2 py-1 rounded-lg hover:bg-vault-muted/40 transition-colors text-vault-text">
                  <span className="flex items-center gap-2"><BookOpen size={12} className="text-vault-dim" />All</span>
                  <span className="text-vault-dim text-xs">{entries.length}</span>
                </button>
              </li>
              {topics.map(([topic, count]) => (
                <li key={topic}>
                  <button onClick={() => setQuery(topic)}
                    className="w-full text-left flex items-center justify-between text-sm px-2 py-1 rounded-lg hover:bg-vault-muted/40 transition-colors text-vault-dim hover:text-vault-text">
                    <span className="flex items-center gap-2 truncate">
                      <Hash size={12} className="shrink-0" />
                      <span className="truncate">{topic}</span>
                    </span>
                    <span className="text-xs shrink-0">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          <div className="mb-4">
            <LanguageFilter selected={langFilter} onChange={setLangFilter} entries={entries} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-vault-dim">Loading...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Search size={40} className="text-vault-muted" />
              <p className="text-vault-dim text-lg">
                {query ? `No results for "${query}"` : 'No entries yet.'}
              </p>
              {!query && (
                <Link href="/new"
                  className="px-4 py-2 rounded-lg bg-vault-accent text-white text-sm hover:bg-vault-bright transition-colors">
                  Add your first entry
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
              {results.map(({ entry }) => (
                <EntryCard key={entry.id} entry={entry} query={query} onDelete={remove} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
