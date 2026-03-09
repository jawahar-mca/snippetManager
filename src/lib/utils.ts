import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Language } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  typescript: 'TypeScript', javascript: 'JavaScript', python: 'Python',
  react: 'React / TSX', bash: 'Bash', css: 'CSS', html: 'HTML',
  json: 'JSON', sql: 'SQL', other: 'Other',
}

export const LANGUAGE_COLORS: Record<Language, string> = {
  typescript: 'text-vault-blue border-vault-blue/30 bg-vault-blue/10',
  javascript: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  python:     'text-vault-green border-vault-green/30 bg-vault-green/10',
  react:      'text-vault-blue border-vault-blue/30 bg-vault-blue/10',
  bash:       'text-vault-dim border-vault-dim/30 bg-vault-dim/10',
  css:        'text-vault-pink border-vault-pink/30 bg-vault-pink/10',
  html:       'text-vault-orange border-vault-orange/30 bg-vault-orange/10',
  json:       'text-vault-dim border-vault-dim/30 bg-vault-dim/10',
  sql:        'text-vault-green border-vault-green/30 bg-vault-green/10',
  other:      'text-vault-dim border-vault-dim/30 bg-vault-dim/10',
}

export const MONACO_LANGUAGE: Record<Language, string> = {
  typescript: 'typescript', javascript: 'javascript', python: 'python',
  react: 'typescript', bash: 'shell', css: 'css', html: 'html',
  json: 'json', sql: 'sql', other: 'plaintext',
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export const ALL_LANGUAGES: Language[] = [
  'typescript', 'javascript', 'react', 'python',
  'bash', 'css', 'html', 'json', 'sql', 'other',
]
