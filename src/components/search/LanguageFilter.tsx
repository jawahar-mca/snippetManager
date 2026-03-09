'use client'

import { Entry, Language } from '@/types'
import { LANGUAGE_LABELS, LANGUAGE_COLORS, ALL_LANGUAGES, cn } from '@/lib/utils'

interface Props {
  selected: Language | 'all'
  onChange: (l: Language | 'all') => void
  entries: Entry[]
}

export default function LanguageFilter({ selected, onChange, entries }: Props) {
  const counts = ALL_LANGUAGES.reduce<Record<string, number>>((acc, lang) => {
    acc[lang] = entries.filter(e => e.language === lang).length
    return acc
  }, {})

  const active = ALL_LANGUAGES.filter(l => counts[l] > 0)

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onChange('all')}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium border transition-all',
          selected === 'all'
            ? 'bg-vault-accent border-vault-bright text-white'
            : 'border-vault-border text-vault-dim hover:border-vault-muted hover:text-vault-text'
        )}>
        All
      </button>
      {active.map(lang => (
        <button key={lang} onClick={() => onChange(lang)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-all',
            selected === lang
              ? 'bg-vault-accent border-vault-bright text-white'
              : cn('border-vault-border hover:text-vault-text', LANGUAGE_COLORS[lang])
          )}>
          {LANGUAGE_LABELS[lang]} <span className="opacity-60 ml-1">{counts[lang]}</span>
        </button>
      ))}
    </div>
  )
}
