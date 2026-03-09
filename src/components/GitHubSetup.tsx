'use client'

/**
 * GitHubSetup — modal for configuring the GitHub integration.
 * User enters their PAT once. It's stored in localStorage only (never committed).
 */

import { useState } from 'react'
import { Github, X, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react'
import { GitHubConfig, saveGitHubConfig, clearGitHubConfig, validateToken, loadGitHubConfig } from '@/lib/github'
import { cn } from '@/lib/utils'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export default function GitHubSetup({ onClose, onSaved }: Props) {
  const existing = loadGitHubConfig()

  const [token, setToken] = useState(existing?.token ?? '')
  const [owner, setOwner] = useState(existing?.owner ?? 'jawahar-mca')
  const [repo, setRepo] = useState(existing?.repo ?? 'snippetManager')
  const [branch, setBranch] = useState(existing?.branch ?? 'main')
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [username, setUsername] = useState('')

  async function handleSave() {
    if (!token.trim()) { setErrorMsg('Token is required'); setStatus('error'); return }
    if (!owner.trim()) { setErrorMsg('Owner is required'); setStatus('error'); return }
    if (!repo.trim()) { setErrorMsg('Repo is required'); setStatus('error'); return }

    setStatus('validating')
    setErrorMsg('')

    const { valid, username: uname, error } = await validateToken(token)
    if (!valid) {
      setStatus('error')
      setErrorMsg(error ?? 'Invalid token')
      return
    }

    setUsername(uname ?? '')
    setStatus('valid')

    const config: GitHubConfig = { token, owner, repo, branch }
    saveGitHubConfig(config)
    setTimeout(() => { onSaved(); onClose() }, 800)
  }

  function handleDisconnect() {
    clearGitHubConfig()
    onClose()
    window.location.reload()
  }

  const inputCls = 'w-full bg-vault-bg border border-vault-border rounded-lg px-3 py-2 text-sm text-vault-text placeholder:text-vault-dim/50 focus:outline-none focus:border-vault-bright/60 focus:ring-1 focus:ring-vault-bright/20 transition-all font-mono'
  const labelCls = 'block text-xs font-semibold text-vault-dim uppercase tracking-widest mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-vault-border bg-vault-surface shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-vault-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-vault-accent/20 flex items-center justify-center">
              <Github size={18} className="text-vault-bright" />
            </div>
            <div>
              <h2 className="font-display font-bold text-vault-text">GitHub Sync</h2>
              <p className="text-xs text-vault-dim">Store entries permanently in your repo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-vault-dim hover:text-vault-text transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* How it works */}
          <div className="rounded-xl bg-vault-bg border border-vault-border p-4 space-y-2">
            <p className="text-xs font-semibold text-vault-dim uppercase tracking-widest">How it works</p>
            <ul className="space-y-1.5 text-xs text-vault-dim">
              <li className="flex items-start gap-2"><span className="text-vault-green mt-0.5">✓</span> Entries saved as JSON files in your GitHub repo</li>
              <li className="flex items-start gap-2"><span className="text-vault-green mt-0.5">✓</span> Works across all devices and browsers</li>
              <li className="flex items-start gap-2"><span className="text-vault-green mt-0.5">✓</span> Your token is stored locally only — never committed</li>
              <li className="flex items-start gap-2"><span className="text-vault-green mt-0.5">✓</span> 100% free, no server needed</li>
            </ul>
          </div>

          {/* Token */}
          <div>
            <label className={labelCls}>
              Personal Access Token *{' '}
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=SnippetManager"
                target="_blank" rel="noopener noreferrer"
                className="normal-case text-vault-bright hover:underline inline-flex items-center gap-0.5 ml-1">
                Create one <ExternalLink size={10} />
              </a>
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className={inputCls}
            />
            <p className="text-xs text-vault-dim mt-1">
              Needs <code className="text-vault-green bg-vault-muted/40 px-1 rounded">repo</code> scope only.
            </p>
          </div>

          {/* Owner + Repo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>GitHub Username *</label>
              <input value={owner} onChange={e => setOwner(e.target.value)}
                placeholder="jawahar-mca" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Repository Name *</label>
              <input value={repo} onChange={e => setRepo(e.target.value)}
                placeholder="snippetManager" className={inputCls} />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className={labelCls}>Branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)}
              placeholder="main" className={inputCls} />
          </div>

          {/* Status */}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-vault-red text-sm p-3 rounded-lg bg-vault-red/10 border border-vault-red/20">
              <AlertCircle size={15} /> {errorMsg}
            </div>
          )}
          {status === 'valid' && (
            <div className="flex items-center gap-2 text-vault-green text-sm p-3 rounded-lg bg-vault-green/10 border border-vault-green/20">
              <CheckCircle size={15} /> Connected as <strong>{username}</strong> — saving…
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleSave} disabled={status === 'validating' || status === 'valid'}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all',
                status === 'validating' || status === 'valid'
                  ? 'bg-vault-muted text-vault-dim cursor-not-allowed'
                  : 'bg-vault-accent hover:bg-vault-bright text-white'
              )}>
              {status === 'validating' && <Loader size={14} className="animate-spin" />}
              {status === 'validating' ? 'Validating…' : 'Connect & Save'}
            </button>
            {existing && (
              <button onClick={handleDisconnect}
                className="px-4 py-2.5 rounded-xl border border-vault-red/40 text-vault-red hover:bg-vault-red/10 text-sm transition-all">
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
