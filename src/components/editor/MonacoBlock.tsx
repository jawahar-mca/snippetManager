'use client'

import dynamic from 'next/dynamic'
import { MONACO_LANGUAGE } from '@/lib/utils'
import { Language } from '@/types'

const Editor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  { ssr: false, loading: () => <div className="bg-vault-surface animate-pulse" style={{ height: '120px' }} /> }
)

interface Props {
  code: string
  language: Language
  readOnly?: boolean
  height?: string
  onChange?: (value: string) => void
}

export default function MonacoBlock({ code, language, readOnly = true, height, onChange }: Props) {
  const lineCount = code.split('\n').length
  const computedHeight = height ?? `${Math.min(Math.max(lineCount * 20 + 40, 80), 600)}px`

  return (
    <div className="overflow-hidden">
      <Editor
        height={computedHeight}
        language={MONACO_LANGUAGE[language]}
        value={code}
        onChange={v => onChange?.(v ?? '')}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontLigatures: true,
          lineNumbers: 'on',
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          scrollbar: { vertical: 'hidden', horizontal: 'auto' },
          overviewRulerLanes: 0,
          folding: !readOnly,
          contextmenu: !readOnly,
          renderValidationDecorations: readOnly ? 'off' : 'on',
        }}
      />
    </div>
  )
}
