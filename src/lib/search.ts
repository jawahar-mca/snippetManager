import Fuse, { IFuseOptions } from 'fuse.js'
import { Entry, SearchResult } from '@/types'

const OPTIONS: IFuseOptions<Entry> = {
  includeScore: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: [
    { name: 'title',              weight: 0.30 },
    { name: 'topic',              weight: 0.20 },
    { name: 'tags',               weight: 0.20 },
    { name: 'explanation',        weight: 0.15 },
    { name: 'codeBlocks.code',    weight: 0.10 },
    { name: 'codeBlocks.caption', weight: 0.05 },
  ],
}

let fuse: Fuse<Entry> | null = null

export function resetSearchIndex(): void {
  fuse = null
}

export function search(query: string, entries: Entry[]): SearchResult[] {
  if (!query.trim()) {
    return entries
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((entry, refIndex) => ({ entry, refIndex, score: 0 }))
  }
  if (!fuse) fuse = new Fuse(entries, OPTIONS)
  return fuse.search(query).map(r => ({
    entry: r.item,
    refIndex: r.refIndex,
    score: r.score ?? 1,
  }))
}
