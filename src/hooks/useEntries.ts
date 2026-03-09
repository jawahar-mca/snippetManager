'use client'

/**
 * useEntries — central state for all entries.
 *
 * Storage strategy (in priority order):
 *   1. If GitHub is configured → read/write to GitHub repo via API
 *   2. Fallback → localStorage (offline / not configured)
 *
 * This means:
 *   - Data is permanently stored in your Git repo
 *   - Works across all devices and browsers
 *   - Falls back to localStorage if GitHub not set up
 */

import { useState, useEffect, useCallback } from 'react'
import { Entry } from '@/types'
import {
  loadEntries as loadLocal,
  saveEntries as saveLocal,
  addEntry as addLocal,
  updateEntry as updateLocal,
  removeEntry as removeLocal,
  importEntries,
} from '@/lib/storage'
import {
  loadGitHubConfig,
  isGitHubConfigured,
  fetchAllEntriesFromGitHub,
  saveEntryToGitHub,
  deleteEntryFromGitHub,
} from '@/lib/github'
import { resetSearchIndex } from '@/lib/search'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

export function useEntries() {
  const [entries, setEntries]     = useState<Entry[]>([])
  const [loading, setLoading]     = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setLoading(true)

      if (isGitHubConfigured()) {
        // Load from GitHub
        setSyncStatus('syncing')
        const config = loadGitHubConfig()!
        const { entries: remote, error } = await fetchAllEntriesFromGitHub(config)

        if (error) {
          setSyncStatus('error')
          setSyncError(error)
          // Fallback to localStorage if GitHub fails
          setEntries(loadLocal())
        } else {
          setSyncStatus('success')
          // Mirror to localStorage as offline cache
          saveLocal(remote)
          setEntries(remote)
        }
      } else {
        // localStorage only
        setEntries(loadLocal())
        setSyncStatus('idle')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  // ── Add ───────────────────────────────────────────────────────────────────
  const add = useCallback(async (entry: Entry) => {
    // Optimistic update — show immediately
    setEntries(prev => {
      const updated = [entry, ...prev]
      saveLocal(updated)
      return updated
    })
    resetSearchIndex()

    if (isGitHubConfigured()) {
      setSyncStatus('syncing')
      const config = loadGitHubConfig()!
      const { success, error } = await saveEntryToGitHub(config, entry)
      if (success) {
        setSyncStatus('success')
      } else {
        setSyncStatus('error')
        setSyncError(error ?? 'Failed to save to GitHub')
      }
    }
  }, [])

  // ── Update ────────────────────────────────────────────────────────────────
  const update = useCallback(async (entry: Entry) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === entry.id ? entry : e)
      saveLocal(updated)
      return updated
    })
    resetSearchIndex()

    if (isGitHubConfigured()) {
      setSyncStatus('syncing')
      const config = loadGitHubConfig()!
      const { success, error } = await saveEntryToGitHub(config, entry)
      if (success) {
        setSyncStatus('success')
      } else {
        setSyncStatus('error')
        setSyncError(error ?? 'Failed to update on GitHub')
      }
    }
  }, [])

  // ── Remove ────────────────────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
    const entry = entries.find(e => e.id === id)
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id)
      saveLocal(updated)
      return updated
    })
    resetSearchIndex()

    if (isGitHubConfigured() && entry) {
      setSyncStatus('syncing')
      const config = loadGitHubConfig()!
      const { success, error } = await deleteEntryFromGitHub(config, entry)
      if (success) {
        setSyncStatus('success')
      } else {
        setSyncStatus('error')
        setSyncError(error ?? 'Failed to delete from GitHub')
      }
    }
  }, [entries])

  // ── Import (bulk restore) ─────────────────────────────────────────────────
  const importAll = useCallback((json: string): boolean => {
    try {
      const imported = importEntries(json)
      setEntries(imported)
      resetSearchIndex()
      return true
    } catch {
      return false
    }
  }, [])

  return {
    entries,
    loading,
    syncStatus,
    syncError,
    add,
    update,
    remove,
    importAll,
    reload: () => window.location.reload(),
  }
}
