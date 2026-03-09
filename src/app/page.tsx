'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Search, Download, Upload, BookOpen, Hash, Cpu, Github, CloudOff, Cloud, Loader } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { search } from '@/lib/search'
import { exportEntries } from '@/lib/storage'
import { isGitHubConfigured } from '@/lib/github'
import EntryCard from '@/components/EntryCard'
import SearchBar from '@/components/search/SearchBar'
import LanguageFilter from '@/components/search/LanguageFilter'
import EntryDetail from '@/components/EntryDetail'
import EntryForm from '@/components/EntryForm'
import GitHubSetup from '@/components/GitHubSetup'
import { Language } from '@/types'
import { cn } from '@/lib/utils'

// ── Hash router ────────────────────────────────────────────────────────────

type Route =
  | { view: 'home' }
  | { view: 'new' }
  | { view: 'detail'; id: string }
  | { view: 'edit'; id: string }

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  if (path === 'new') return { view: 'new' }
  const edit = path.match(/^edit\/(.+)$/)
  if (edit) return { view: 'edit', id: edit[1] }
  const entry = path.match(/^entry\/(.+)$/)
  if (entry) return { view: 'detail', id: entry[1] }
  return { view: 'home' }
}

function goto(hash: string) {
  window.location.hash = hash
}

// ── App root ───────────────────────────────────────────────────────────────

export default function App() {
  const [route, setRoute] = useState<Route>({ view: 'home' })
  const [showGitHubSetup, setShowGitHubSetup] = useState(false)
  const entriesState = useEntries()
  const { entries, loading, syncStatus, syncError, add, update, remove, importAll } = entriesState

  useEffect(() => {
    function onHashChange() { setRoute(parseHash(window.location.hash)) }
    onHashChange()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route.view === 'detail') {
    return (
      <>
        <EntryDetail id={route.id} onDelete={id => { remove(id); goto('/') }} />
        {showGitHubSetup && <GitHubSetup onClose={() => setShowGitHubSetup(false)} onSaved={() => window.location.reload()} />}
      </>
    )
  }
  if (route.view === 'new') {
    return <EntryForm onSave={entry => { add(entry); goto(`entry/${entry.id}`) }} />
  }
  if (route.view === 'edit') {
    const entry = entries.find(e => e.id === route.id)
    if (!entry) return (
      <div className="min-h-screen flex items-center justify-center text-vault-dim">
        Not found. <button className="ml-2 text-vault-bright underline" onClick={() => goto('/')}>Go back</button>
      </div>
    )
    return <EntryForm initial={entry} onSave={updated => { update(updated); goto(`entry/${updated.id}`) }} />
  }

  return (
    <>
      <HomeView
        entries={entries}
        loading={loading}
        syncStatus={syncStatus}
        syncError={syncError}
        remove={remove}
        importAll={importAll}
        onOpenGitHubSetup={() => setShowGitHubSetup(true)}
      />
      {showGitHubSetup && (
        <GitHubSetup
          onClose={() => setShowGitHubSetup(false)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  )
}

// ── Home view ──────────────────────────────────────────────────────────────

interface HomeViewProps {
  entries: ReturnType<typeof useEntries>['entries']
  loading: boolean
  syncStatus: ReturnType<typeof useEntries>['syncStatus']
  syncError: string | null
  remove: (id: string) => void
  importAll: (json: string) => Promise<boolean>
  onOpenGitHubSetup: () => void
}

function HomeView({ entries, loading, syncStatus, syncError, remove, importAll, onOpenGitHubSetup }: HomeViewProps) {
  const [query, setQuery] = useState('')
  const [langFilter, setLangFilter] = useState<Language | 'all'>('all')
  const importRef = useRef<HTMLInputElement>(null)
  const [githubConfigured, setGithubConfigured] = useState(false)

  useEffect(() => {
    setGithubConfigured(isGitHubConfigured())
  }, [])

  const results = useMemo(() => {
    let list = search(query, entries)
    if (langFilter !== 'all') list = list.filter(r => r.entry.language === langFilter)
    return list
  }, [query, entries, langFilter])

  const topics = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach(e => map.set(e.topic, (map.get(e.topic) ?? 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [entries])

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const ok = await importAll(ev.target?.result as string)
      if (!ok) alert('Invalid backup file.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-vault-border bg-vault-bg/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => goto('/')} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-vault-accent flex items-center justify-center">
              <Cpu size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-vault-text tracking-tight">
              Snippet Manager
            </span>
          </button>

          <div className="flex-1 max-w-2xl mx-auto">
            <SearchBar value={query} onChange={setQuery} count={results.length} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sync status indicator */}
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1 text-xs text-vault-dim">
                <Loader size={12} className="animate-spin" /> Syncing…
              </span>
            )}
            {syncStatus === 'error' && (
              <span title={syncError ?? ''} className="flex items-center gap-1 text-xs text-vault-red cursor-help">
                <CloudOff size={13} /> Sync failed
              </span>
            )}
            {syncStatus === 'success' && githubConfigured && (
              <span className="flex items-center gap-1 text-xs text-vault-green">
                <Cloud size={13} /> Synced
              </span>
            )}

            {/* GitHub setup button */}
            <button
              onClick={onOpenGitHubSetup}
              title={githubConfigured ? 'GitHub sync configured' : 'Set up GitHub sync'}
              className={cn(
                'p-2 rounded-lg transition-colors',
                githubConfigured
                  ? 'text-vault-green hover:bg-vault-surface'
                  : 'text-vault-dim hover:text-vault-text hover:bg-vault-surface'
              )}>
              <Github size={16} />
            </button>

            <button onClick={exportEntries} title="Export JSON"
              className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
              <Download size={16} />
            </button>
            <button onClick={() => importRef.current?.click()} title="Import JSON"
              className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
              <Upload size={16} />
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

            <button onClick={() => goto('new')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-accent hover:bg-vault-bright transition-colors text-white text-sm font-medium">
              <Plus size={15} /> New Entry
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 gap-6 py-6">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-52 shrink-0">
          <div className="rounded-xl border border-vault-border bg-vault-surface p-4">
            <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest mb-3">Topics</p>
            <ul className="space-y-1">
              <li>
                <button onClick={() => setQuery('')}
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
            <div className="flex items-center justify-center py-24 text-vault-dim">
              <Loader size={20} className="animate-spin mr-2" /> Loading…
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Search size={40} className="text-vault-muted" />
              <p className="text-vault-dim text-lg">
                {query ? `No results for "${query}"` : 'No entries yet.'}
              </p>
              {!query && (
                <button onClick={() => goto('new')}
                  className="px-4 py-2 rounded-lg bg-vault-accent text-white text-sm hover:bg-vault-bright transition-colors">
                  Add your first entry
                </button>
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



// 'use client'

// import { useState, useEffect, useMemo, useRef } from 'react'
// import { Plus, Search, Download, Upload, BookOpen, Hash, Cpu, Github, CloudOff, Cloud, Loader } from 'lucide-react'
// import { useEntries } from '@/hooks/useEntries'
// import { search } from '@/lib/search'
// import { exportEntries } from '@/lib/storage'
// import { isGitHubConfigured } from '@/lib/github'
// import EntryCard from '@/components/EntryCard'
// import SearchBar from '@/components/search/SearchBar'
// import LanguageFilter from '@/components/search/LanguageFilter'
// import EntryDetail from '@/components/EntryDetail'
// import EntryForm from '@/components/EntryForm'
// import GitHubSetup from '@/components/GitHubSetup'
// import { Language } from '@/types'
// import { cn } from '@/lib/utils'

// // ── Hash router ────────────────────────────────────────────────────────────

// type Route =
//   | { view: 'home' }
//   | { view: 'new' }
//   | { view: 'detail'; id: string }
//   | { view: 'edit'; id: string }

// function parseHash(hash: string): Route {
//   const path = hash.replace(/^#\/?/, '')
//   if (path === 'new') return { view: 'new' }
//   const edit = path.match(/^edit\/(.+)$/)
//   if (edit) return { view: 'edit', id: edit[1] }
//   const entry = path.match(/^entry\/(.+)$/)
//   if (entry) return { view: 'detail', id: entry[1] }
//   return { view: 'home' }
// }

// function goto(hash: string) {
//   window.location.hash = hash
// }

// // ── App root ───────────────────────────────────────────────────────────────

// export default function App() {
//   const [route, setRoute] = useState<Route>({ view: 'home' })
//   const [showGitHubSetup, setShowGitHubSetup] = useState(false)
//   const entriesState = useEntries()
//   const { entries, loading, syncStatus, syncError, add, update, remove, importAll } = entriesState

//   useEffect(() => {
//     function onHashChange() { setRoute(parseHash(window.location.hash)) }
//     onHashChange()
//     window.addEventListener('hashchange', onHashChange)
//     return () => window.removeEventListener('hashchange', onHashChange)
//   }, [])

//   if (route.view === 'detail') {
//     return (
//       <>
//         <EntryDetail id={route.id} onDelete={id => { remove(id); goto('/') }} />
//         {showGitHubSetup && <GitHubSetup onClose={() => setShowGitHubSetup(false)} onSaved={() => window.location.reload()} />}
//       </>
//     )
//   }
//   if (route.view === 'new') {
//     return <EntryForm onSave={entry => { add(entry); goto(`entry/${entry.id}`) }} />
//   }
//   if (route.view === 'edit') {
//     const entry = entries.find(e => e.id === route.id)
//     if (!entry) return (
//       <div className="min-h-screen flex items-center justify-center text-vault-dim">
//         Not found. <button className="ml-2 text-vault-bright underline" onClick={() => goto('/')}>Go back</button>
//       </div>
//     )
//     return <EntryForm initial={entry} onSave={updated => { update(updated); goto(`entry/${updated.id}`) }} />
//   }

//   return (
//     <>
//       <HomeView
//         entries={entries}
//         loading={loading}
//         syncStatus={syncStatus}
//         syncError={syncError}
//         remove={remove}
//         importAll={importAll}
//         onOpenGitHubSetup={() => setShowGitHubSetup(true)}
//       />
//       {showGitHubSetup && (
//         <GitHubSetup
//           onClose={() => setShowGitHubSetup(false)}
//           onSaved={() => window.location.reload()}
//         />
//       )}
//     </>
//   )
// }

// // ── Home view ──────────────────────────────────────────────────────────────

// interface HomeViewProps {
//   entries: ReturnType<typeof useEntries>['entries']
//   loading: boolean
//   syncStatus: ReturnType<typeof useEntries>['syncStatus']
//   syncError: string | null
//   remove: (id: string) => void
//   importAll: (json: string) => boolean
//   onOpenGitHubSetup: () => void
// }

// function HomeView({ entries, loading, syncStatus, syncError, remove, importAll, onOpenGitHubSetup }: HomeViewProps) {
//   const [query, setQuery] = useState('')
//   const [langFilter, setLangFilter] = useState<Language | 'all'>('all')
//   const importRef = useRef<HTMLInputElement>(null)
//   const [githubConfigured, setGithubConfigured] = useState(false)

//   useEffect(() => {
//     setGithubConfigured(isGitHubConfigured())
//   }, [])

//   const results = useMemo(() => {
//     let list = search(query, entries)
//     if (langFilter !== 'all') list = list.filter(r => r.entry.language === langFilter)
//     return list
//   }, [query, entries, langFilter])

//   const topics = useMemo(() => {
//     const map = new Map<string, number>()
//     entries.forEach(e => map.set(e.topic, (map.get(e.topic) ?? 0) + 1))
//     return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
//   }, [entries])

//   function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
//     const file = e.target.files?.[0]
//     if (!file) return
//     const reader = new FileReader()
//     reader.onload = ev => {
//       const ok = importAll(ev.target?.result as string)
//       if (!ok) alert('Invalid backup file.')
//     }
//     reader.readAsText(file)
//     e.target.value = ''
//   }

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Header */}
//       <header className="sticky top-0 z-40 border-b border-vault-border bg-vault-bg/90 backdrop-blur-md">
//         <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
//           <button onClick={() => goto('/')} className="flex items-center gap-2 shrink-0">
//             <div className="w-8 h-8 rounded-lg bg-vault-accent flex items-center justify-center">
//               <Cpu size={16} className="text-white" />
//             </div>
//             <span className="font-display font-bold text-lg text-vault-text tracking-tight">
//               SnippetManager
//             </span>
//           </button>

//           <div className="flex-1 max-w-2xl mx-auto">
//             <SearchBar value={query} onChange={setQuery} count={results.length} />
//           </div>

//           <div className="flex items-center gap-2 shrink-0">
//             {/* Sync status indicator */}
//             {syncStatus === 'syncing' && (
//               <span className="flex items-center gap-1 text-xs text-vault-dim">
//                 <Loader size={12} className="animate-spin" /> Syncing…
//               </span>
//             )}
//             {syncStatus === 'error' && (
//               <span title={syncError ?? ''} className="flex items-center gap-1 text-xs text-vault-red cursor-help">
//                 <CloudOff size={13} /> Sync failed
//               </span>
//             )}
//             {syncStatus === 'success' && githubConfigured && (
//               <span className="flex items-center gap-1 text-xs text-vault-green">
//                 <Cloud size={13} /> Synced
//               </span>
//             )}

//             {/* GitHub setup button */}
//             <button
//               onClick={onOpenGitHubSetup}
//               title={githubConfigured ? 'GitHub sync configured' : 'Set up GitHub sync'}
//               className={cn(
//                 'p-2 rounded-lg transition-colors',
//                 githubConfigured
//                   ? 'text-vault-green hover:bg-vault-surface'
//                   : 'text-vault-dim hover:text-vault-text hover:bg-vault-surface'
//               )}>
//               <Github size={16} />
//             </button>

//             <button onClick={exportEntries} title="Export JSON"
//               className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
//               <Download size={16} />
//             </button>
//             <button onClick={() => importRef.current?.click()} title="Import JSON"
//               className="p-2 rounded-lg text-vault-dim hover:text-vault-text hover:bg-vault-surface transition-colors">
//               <Upload size={16} />
//             </button>
//             <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

//             <button onClick={() => goto('new')}
//               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-vault-accent hover:bg-vault-bright transition-colors text-white text-sm font-medium">
//               <Plus size={15} /> New Entry
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Body */}
//       <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 gap-6 py-6">
//         {/* Sidebar */}
//         <aside className="hidden lg:flex flex-col gap-4 w-52 shrink-0">
//           <div className="rounded-xl border border-vault-border bg-vault-surface p-4">
//             <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest mb-3">Topics</p>
//             <ul className="space-y-1">
//               <li>
//                 <button onClick={() => setQuery('')}
//                   className="w-full text-left flex items-center justify-between text-sm px-2 py-1 rounded-lg hover:bg-vault-muted/40 transition-colors text-vault-text">
//                   <span className="flex items-center gap-2"><BookOpen size={12} className="text-vault-dim" />All</span>
//                   <span className="text-vault-dim text-xs">{entries.length}</span>
//                 </button>
//               </li>
//               {topics.map(([topic, count]) => (
//                 <li key={topic}>
//                   <button onClick={() => setQuery(topic)}
//                     className="w-full text-left flex items-center justify-between text-sm px-2 py-1 rounded-lg hover:bg-vault-muted/40 transition-colors text-vault-dim hover:text-vault-text">
//                     <span className="flex items-center gap-2 truncate">
//                       <Hash size={12} className="shrink-0" />
//                       <span className="truncate">{topic}</span>
//                     </span>
//                     <span className="text-xs shrink-0">{count}</span>
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </aside>

//         {/* Main */}
//         <main className="flex-1 min-w-0">
//           <div className="mb-4">
//             <LanguageFilter selected={langFilter} onChange={setLangFilter} entries={entries} />
//           </div>
//           {loading ? (
//             <div className="flex items-center justify-center py-24 text-vault-dim">
//               <Loader size={20} className="animate-spin mr-2" /> Loading…
//             </div>
//           ) : results.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-24 gap-4">
//               <Search size={40} className="text-vault-muted" />
//               <p className="text-vault-dim text-lg">
//                 {query ? `No results for "${query}"` : 'No entries yet.'}
//               </p>
//               {!query && (
//                 <button onClick={() => goto('new')}
//                   className="px-4 py-2 rounded-lg bg-vault-accent text-white text-sm hover:bg-vault-bright transition-colors">
//                   Add your first entry
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
//               {results.map(({ entry }) => (
//                 <EntryCard key={entry.id} entry={entry} query={query} onDelete={remove} />
//               ))}
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   )
// }
