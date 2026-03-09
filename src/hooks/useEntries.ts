'use client'

import { useState, useEffect, useCallback } from 'react'
import { Entry } from '@/types'
import { loadEntries, addEntry, updateEntry, removeEntry, importEntries } from '@/lib/storage'
import { resetSearchIndex } from '@/lib/search'

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setEntries(loadEntries())
    setLoading(false)
  }, [])

  const add = useCallback((entry: Entry) => {
    setEntries(addEntry(entry))
    resetSearchIndex()
  }, [])

  const update = useCallback((entry: Entry) => {
    setEntries(updateEntry(entry))
    resetSearchIndex()
  }, [])

  const remove = useCallback((id: string) => {
    setEntries(removeEntry(id))
    resetSearchIndex()
  }, [])

  const importAll = useCallback((json: string): boolean => {
    try {
      setEntries(importEntries(json))
      resetSearchIndex()
      return true
    } catch {
      return false
    }
  }, [])

  return { entries, loading, add, update, remove, importAll }
}
