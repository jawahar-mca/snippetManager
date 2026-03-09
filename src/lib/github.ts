/**
 * github.ts — GitHub Contents API integration
 *
 * All entry data is stored as JSON files in your GitHub repo at:
 *   content/entries/<id>.json
 *
 * The browser talks directly to GitHub's REST API using a Personal
 * Access Token stored in localStorage. No server, no cost, permanent.
 *
 * API used: https://docs.github.com/en/rest/repos/contents
 */

import { Entry } from '@/types'

const GITHUB_API = 'https://api.github.com'

export interface GitHubConfig {
  token: string       // GitHub Personal Access Token
  owner: string       // GitHub username e.g. "jawahar-mca"
  repo: string        // Repo name e.g. "snippetmanager"
  branch: string      // e.g. "main"
}

const CONFIG_KEY = 'snippetManager:github-config'

// ── Config persistence ─────────────────────────────────────────────────────

export function loadGitHubConfig(): GitHubConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveGitHubConfig(config: GitHubConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export function clearGitHubConfig(): void {
  localStorage.removeItem(CONFIG_KEY)
}

export function isGitHubConfigured(): boolean {
  const c = loadGitHubConfig()
  return !!(c?.token && c?.owner && c?.repo)
}

// ── API helpers ────────────────────────────────────────────────────────────

async function apiRequest(
  config: GitHubConfig,
  method: string,
  path: string,
  body?: object
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function entryPath(id: string) {
  return `/repos/${'' /* filled below */}/contents/content/entries/${id}.json`
}

function fullPath(config: GitHubConfig, id: string) {
  return `/repos/${config.owner}/${config.repo}/contents/content/entries/${id}.json`
}

function encode(obj: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))))
}

function decode(base64: string): object {
  return JSON.parse(decodeURIComponent(escape(atob(base64.replace(/\n/g, '')))))
}

// ── Core operations ────────────────────────────────────────────────────────

/**
 * Fetch all entries from GitHub repo.
 * First lists content/entries/, then fetches each file.
 */
export async function fetchAllEntriesFromGitHub(
  config: GitHubConfig
): Promise<{ entries: Entry[]; error?: string }> {
  try {
    // List the entries directory
    const listRes = await apiRequest(
      config, 'GET',
      `/repos/${config.owner}/${config.repo}/contents/content/entries?ref=${config.branch}`
    )

    if (listRes.status === 404) {
      // Directory doesn't exist yet — first time use
      return { entries: [] }
    }

    if (!listRes.ok) {
      const err = await listRes.json()
      return { entries: [], error: err.message ?? 'Failed to list entries' }
    }

    const files: Array<{ name: string; download_url: string }> = await listRes.json()
    const jsonFiles = files.filter(f => f.name.endsWith('.json'))

    // Fetch all files in parallel
    const results = await Promise.allSettled(
      jsonFiles.map(f => fetch(f.download_url).then(r => r.json() as Promise<Entry>))
    )

    const entries: Entry[] = []
    for (const result of results) {
      if (result.status === 'fulfilled') entries.push(result.value)
    }

    // Sort by updatedAt descending
    return {
      entries: entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
  } catch (e) {
    return { entries: [], error: String(e) }
  }
}

/**
 * Save a single entry to GitHub as content/entries/<id>.json
 * Creates the file if it doesn't exist, updates (with SHA) if it does.
 */
export async function saveEntryToGitHub(
  config: GitHubConfig,
  entry: Entry
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = fullPath(config, entry.id)

    // Check if file already exists (need SHA for updates)
    let sha: string | undefined
    const existing = await apiRequest(config, 'GET', path)
    if (existing.ok) {
      const data = await existing.json()
      sha = data.sha
    }

    // Create or update
    const res = await apiRequest(config, 'PUT', path, {
      message: sha
        ? `update: ${entry.title}`
        : `add: ${entry.title}`,
      content: encode(entry),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.message ?? 'Failed to save' }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/**
 * Delete an entry file from GitHub.
 */
export async function deleteEntryFromGitHub(
  config: GitHubConfig,
  entry: Entry
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = fullPath(config, entry.id)

    // Must get SHA before deleting
    const existing = await apiRequest(config, 'GET', path)
    if (!existing.ok) return { success: true } // Already gone

    const data = await existing.json()

    const res = await apiRequest(config, 'DELETE', path, {
      message: `delete: ${entry.title}`,
      sha: data.sha,
      branch: config.branch,
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.message ?? 'Failed to delete' }
    }

    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

/**
 * Validate a token by calling /user
 */
export async function validateToken(
  token: string
): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (!res.ok) return { valid: false, error: 'Invalid token' }
    const data = await res.json()
    return { valid: true, username: data.login }
  } catch (e) {
    return { valid: false, error: String(e) }
  }
}
