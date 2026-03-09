import { Entry } from '@/types'

const GITHUB_API = 'https://api.github.com'

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch: string
}

const CONFIG_KEY = 'snippetmanager:github-config'

// ── Config ─────────────────────────────────────────────────────────────────

export function loadGitHubConfig(): GitHubConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
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

// ── Helpers ────────────────────────────────────────────────────────────────

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

function encodeb64(obj: object): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))))
}

function decodeb64(b64: string): unknown {
  return JSON.parse(decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))))
}

function entryFilePath(config: GitHubConfig, id: string) {
  return `/repos/${config.owner}/${config.repo}/contents/content/entries/${id}.json`
}

// ── Read all entries ───────────────────────────────────────────────────────

export async function fetchAllEntriesFromGitHub(
  config: GitHubConfig
): Promise<{ entries: Entry[]; error?: string }> {
  try {
    // Step 1: list the directory
    const listRes = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/content/entries?ref=${config.branch}`,
      { headers: headers(config.token) }
    )

    if (listRes.status === 404) return { entries: [] }
    if (!listRes.ok) {
      const err = await listRes.json()
      return { entries: [], error: err.message ?? 'Failed to list entries' }
    }

    const files: Array<{ name: string; sha: string; content?: string; encoding?: string }> =
      await listRes.json()

    // Filter to only valid entry JSON files (skip .gitkeep and any non-UUID files)
    const entryFiles = files.filter(
      f => f.name.endsWith('.json') && f.name !== '.gitkeep'
    )

    if (entryFiles.length === 0) return { entries: [] }

    // Step 2: fetch each file one at a time to avoid rate limits
    // GitHub includes base64 content in the listing for small files,
    // so we try to use that first before making extra API calls
    const entries: Entry[] = []

    for (const file of entryFiles) {
      try {
        let entry: Entry | null = null

        // Use inline content if available (avoids extra request)
        if (file.content && file.encoding === 'base64') {
          entry = decodeb64(file.content) as Entry
        } else {
          // Fetch the file individually
          const fileRes = await fetch(
            `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/content/entries/${file.name}?ref=${config.branch}`,
            { headers: headers(config.token) }
          )
          if (!fileRes.ok) continue
          const fileData = await fileRes.json()
          entry = decodeb64(fileData.content) as Entry
        }

        // Validate it looks like a real entry before adding
        if (entry && entry.id && entry.title) {
          entries.push(entry)
        }
      } catch {
        // Skip malformed files silently — don't let one bad file stop the rest
        console.warn(`Skipping malformed entry file: ${file.name}`)
        continue
      }
    }

    return {
      entries: entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
  } catch (e) {
    return { entries: [], error: String(e) }
  }
}

// ── Save one entry ─────────────────────────────────────────────────────────

export async function saveEntryToGitHub(
  config: GitHubConfig,
  entry: Entry
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = entryFilePath(config, entry.id)

    // Get existing SHA if file exists (required for updates)
    let sha: string | undefined
    const existing = await fetch(`${GITHUB_API}${path}`, {
      headers: headers(config.token)
    })
    if (existing.ok) {
      const data = await existing.json()
      sha = data.sha
    }

    const res = await fetch(`${GITHUB_API}${path}`, {
      method: 'PUT',
      headers: headers(config.token),
      body: JSON.stringify({
        message: sha ? `update: ${entry.title}` : `add: ${entry.title}`,
        content: encodeb64(entry),
        branch: config.branch,
        ...(sha ? { sha } : {}),
      }),
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

// ── Delete one entry ───────────────────────────────────────────────────────

export async function deleteEntryFromGitHub(
  config: GitHubConfig,
  entry: Entry
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = entryFilePath(config, entry.id)

    const existing = await fetch(`${GITHUB_API}${path}`, {
      headers: headers(config.token)
    })
    if (!existing.ok) return { success: true } // already gone

    const data = await existing.json()

    const res = await fetch(`${GITHUB_API}${path}`, {
      method: 'DELETE',
      headers: headers(config.token),
      body: JSON.stringify({
        message: `delete: ${entry.title}`,
        sha: data.sha,
        branch: config.branch,
      }),
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

// ── Validate token ─────────────────────────────────────────────────────────

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




// /**
//  * github.ts — GitHub Contents API integration
//  *
//  * All entry data is stored as JSON files in your GitHub repo at:
//  *   content/entries/<id>.json
//  *
//  * The browser talks directly to GitHub's REST API using a Personal
//  * Access Token stored in localStorage. No server, no cost, permanent.
//  *
//  * API used: https://docs.github.com/en/rest/repos/contents
//  */

// import { Entry } from '@/types'

// const GITHUB_API = 'https://api.github.com'

// export interface GitHubConfig {
//   token: string       // GitHub Personal Access Token
//   owner: string       // GitHub username e.g. "jawahar-mca"
//   repo: string        // Repo name e.g. "snippetmanager"
//   branch: string      // e.g. "main"
// }

// const CONFIG_KEY = 'snippetManager:github-config'

// // ── Config persistence ─────────────────────────────────────────────────────

// export function loadGitHubConfig(): GitHubConfig | null {
//   if (typeof window === 'undefined') return null
//   try {
//     const raw = localStorage.getItem(CONFIG_KEY)
//     return raw ? JSON.parse(raw) : null
//   } catch {
//     return null
//   }
// }

// export function saveGitHubConfig(config: GitHubConfig): void {
//   localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
// }

// export function clearGitHubConfig(): void {
//   localStorage.removeItem(CONFIG_KEY)
// }

// export function isGitHubConfigured(): boolean {
//   const c = loadGitHubConfig()
//   return !!(c?.token && c?.owner && c?.repo)
// }

// // ── API helpers ────────────────────────────────────────────────────────────

// async function apiRequest(
//   config: GitHubConfig,
//   method: string,
//   path: string,
//   body?: object
// ): Promise<Response> {
//   return fetch(`${GITHUB_API}${path}`, {
//     method,
//     headers: {
//       Authorization: `Bearer ${config.token}`,
//       Accept: 'application/vnd.github+json',
//       'Content-Type': 'application/json',
//       'X-GitHub-Api-Version': '2022-11-28',
//     },
//     body: body ? JSON.stringify(body) : undefined,
//   })
// }

// function entryPath(id: string) {
//   return `/repos/${'' /* filled below */}/contents/content/entries/${id}.json`
// }

// function fullPath(config: GitHubConfig, id: string) {
//   return `/repos/${config.owner}/${config.repo}/contents/content/entries/${id}.json`
// }

// function encode(obj: object): string {
//   return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))))
// }

// function decode(base64: string): object {
//   return JSON.parse(decodeURIComponent(escape(atob(base64.replace(/\n/g, '')))))
// }

// // ── Core operations ────────────────────────────────────────────────────────

// /**
//  * Fetch all entries from GitHub repo.
//  * First lists content/entries/, then fetches each file.
//  */
// export async function fetchAllEntriesFromGitHub(
//   config: GitHubConfig
// ): Promise<{ entries: Entry[]; error?: string }> {
//   try {
//     // List the entries directory
//     const listRes = await apiRequest(
//       config, 'GET',
//       `/repos/${config.owner}/${config.repo}/contents/content/entries?ref=${config.branch}`
//     )

//     if (listRes.status === 404) {
//       // Directory doesn't exist yet — first time use
//       return { entries: [] }
//     }

//     if (!listRes.ok) {
//       const err = await listRes.json()
//       return { entries: [], error: err.message ?? 'Failed to list entries' }
//     }

//     const files: Array<{ name: string; download_url: string }> = await listRes.json()
//     const jsonFiles = files.filter(f => f.name.endsWith('.json'))

//     // Fetch all files in parallel
//     const results = await Promise.allSettled(
//       jsonFiles.map(f => fetch(f.download_url).then(r => r.json() as Promise<Entry>))
//     )

//     const entries: Entry[] = []
//     for (const result of results) {
//       if (result.status === 'fulfilled') entries.push(result.value)
//     }

//     // Sort by updatedAt descending
//     return {
//       entries: entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
//     }
//   } catch (e) {
//     return { entries: [], error: String(e) }
//   }
// }

// /**
//  * Save a single entry to GitHub as content/entries/<id>.json
//  * Creates the file if it doesn't exist, updates (with SHA) if it does.
//  */
// export async function saveEntryToGitHub(
//   config: GitHubConfig,
//   entry: Entry
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const path = fullPath(config, entry.id)

//     // Check if file already exists (need SHA for updates)
//     let sha: string | undefined
//     const existing = await apiRequest(config, 'GET', path)
//     if (existing.ok) {
//       const data = await existing.json()
//       sha = data.sha
//     }

//     // Create or update
//     const res = await apiRequest(config, 'PUT', path, {
//       message: sha
//         ? `update: ${entry.title}`
//         : `add: ${entry.title}`,
//       content: encode(entry),
//       branch: config.branch,
//       ...(sha ? { sha } : {}),
//     })

//     if (!res.ok) {
//       const err = await res.json()
//       return { success: false, error: err.message ?? 'Failed to save' }
//     }

//     return { success: true }
//   } catch (e) {
//     return { success: false, error: String(e) }
//   }
// }

// /**
//  * Delete an entry file from GitHub.
//  */
// export async function deleteEntryFromGitHub(
//   config: GitHubConfig,
//   entry: Entry
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const path = fullPath(config, entry.id)

//     // Must get SHA before deleting
//     const existing = await apiRequest(config, 'GET', path)
//     if (!existing.ok) return { success: true } // Already gone

//     const data = await existing.json()

//     const res = await apiRequest(config, 'DELETE', path, {
//       message: `delete: ${entry.title}`,
//       sha: data.sha,
//       branch: config.branch,
//     })

//     if (!res.ok) {
//       const err = await res.json()
//       return { success: false, error: err.message ?? 'Failed to delete' }
//     }

//     return { success: true }
//   } catch (e) {
//     return { success: false, error: String(e) }
//   }
// }

// /**
//  * Validate a token by calling /user
//  */
// export async function validateToken(
//   token: string
// ): Promise<{ valid: boolean; username?: string; error?: string }> {
//   try {
//     const res = await fetch(`${GITHUB_API}/user`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         Accept: 'application/vnd.github+json',
//       },
//     })
//     if (!res.ok) return { valid: false, error: 'Invalid token' }
//     const data = await res.json()
//     return { valid: true, username: data.login }
//   } catch (e) {
//     return { valid: false, error: String(e) }
//   }
// }
