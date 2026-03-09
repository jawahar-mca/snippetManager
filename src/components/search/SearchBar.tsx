'use client'

import { Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  count: number
}

export default function SearchBar({ value, onChange, count }: Props) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-dim pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search by title, topic, tag, language, code, or any word…"
        className="w-full bg-vault-surface border border-vault-border rounded-xl pl-9 pr-16 py-2 text-sm text-vault-text placeholder:text-vault-dim/60 focus:outline-none focus:border-vault-bright/60 focus:ring-1 focus:ring-vault-bright/20 transition-all"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-vault-dim hover:text-vault-text">
          <X size={14} />
        </button>
      )}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-vault-dim font-mono">
        {count}
      </span>
    </div>
  )
}
