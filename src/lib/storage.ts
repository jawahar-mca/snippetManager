/**
 * All data lives in localStorage — works perfectly on GitHub Pages
 * since there is no server. Entries persist across browser sessions.
 * For cross-device sync, use the Export / Import JSON buttons.
 */
import { Entry } from '@/types'

const KEY = 'snippetmanager:entries'

export function loadEntries(): Entry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Entry[]
    // First visit — seed with two example entries
    const seeds = getSeedEntries()
    localStorage.setItem(KEY, JSON.stringify(seeds))
    return seeds
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(entries))
}

export function addEntry(entry: Entry): Entry[] {
  const all = loadEntries()
  const updated = [entry, ...all]
  saveEntries(updated)
  return updated
}

export function updateEntry(entry: Entry): Entry[] {
  const all = loadEntries()
  const updated = all.map(e => (e.id === entry.id ? entry : e))
  saveEntries(updated)
  return updated
}

export function removeEntry(id: string): Entry[] {
  const all = loadEntries()
  const updated = all.filter(e => e.id !== id)
  saveEntries(updated)
  return updated
}

export function exportEntries(): void {
  const entries = loadEntries()
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `snippetmanager-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importEntries(json: string): Entry[] {
  const entries = JSON.parse(json) as Entry[]
  saveEntries(entries)
  return entries
}

function getSeedEntries(): Entry[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'seed-001',
      title: 'Find duplicate characters in a string',
      topic: 'Strings',
      tags: ['duplicate', 'string', 'set', 'frequency', 'map', 'characters'],
      language: 'typescript',
      explanation: `## Problem\nGiven a string, find all characters that appear more than once.\n\n## Approach\nUse a \`Map<string, number>\` to build a frequency table in O(n), then filter entries where count > 1.\n\n## Complexity\n- Time: O(n)\n- Space: O(k) where k = unique character count`,
      codeBlocks: [{
        id: 'cb-001',
        language: 'typescript',
        caption: 'Frequency map approach — O(n)',
        code: `function findDuplicateChars(str: string): string[] {\n  const freq = new Map<string, number>()\n\n  for (const char of str) {\n    freq.set(char, (freq.get(char) ?? 0) + 1)\n  }\n\n  return [...freq.entries()]\n    .filter(([, count]) => count > 1)\n    .map(([char]) => char)\n}\n\nconsole.log(findDuplicateChars("programming"))\n// => ['r', 'g', 'm']`,
      }],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-002',
      title: 'Debounce a function in TypeScript',
      topic: 'Performance',
      tags: ['debounce', 'performance', 'hooks', 'timer', 'closure'],
      language: 'typescript',
      explanation: `## Problem\nPrevent a function from firing too frequently (search input, resize handler).\n\n## Approach\nClose over a timer reference. Each call clears the previous timer and schedules a new one. Only fires after \`delay\` ms of silence.\n\n## Complexity\n- Time: O(1) per call\n- Space: O(1)`,
      codeBlocks: [
        {
          id: 'cb-002a',
          language: 'typescript',
          caption: 'Generic debounce utility',
          code: `function debounce<T extends (...args: unknown[]) => void>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout>\n\n  return (...args: Parameters<T>) => {\n    clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), delay)\n  }\n}`,
        },
        {
          id: 'cb-002b',
          language: 'react',
          caption: 'useDebounce React hook',
          code: `import { useState, useEffect } from 'react'\n\nfunction useDebounce<T>(value: T, delay: number): T {\n  const [debounced, setDebounced] = useState<T>(value)\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay)\n    return () => clearTimeout(timer)\n  }, [value, delay])\n\n  return debounced\n}\n\n// Usage\nconst debouncedQuery = useDebounce(query, 300)`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]
}
