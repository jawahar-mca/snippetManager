'use client'

import { useEntries } from '@/hooks/useEntries'
import EntryForm from '@/components/EntryForm'
import { Entry } from '@/types'

export default function NewEntryPage() {
  const { add } = useEntries()

  function handleSave(entry: Entry) {
    add(entry)
  }

  return <EntryForm onSave={handleSave} />
}
