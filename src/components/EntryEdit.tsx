'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useEntries } from '@/hooks/useEntries'
import EntryForm from '@/components/EntryForm'
import { Entry } from '@/types'
import { loadEntries } from '@/lib/storage'

// Receives id as a plain prop from the server wrapper edit/page.tsx
export default function EntryEdit({ id }: { id: string }) {
  const { update } = useEntries()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const all = loadEntries()
    const found = all.find(e => e.id === id)
    if (found) setEntry(found)
    else setNotFound(true)
  }, [id])

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-vault-dim">
        Entry not found.{' '}
        <Link href="/" className="ml-2 text-vault-bright underline">Go back</Link>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center text-vault-dim">
        Loading...
      </div>
    )
  }

  return <EntryForm initial={entry} onSave={(updated: Entry) => update(updated)} />
}
