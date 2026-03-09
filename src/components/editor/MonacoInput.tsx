'use client'

import MonacoBlock from './MonacoBlock'
import { Language } from '@/types'

interface Props {
  code: string
  language: Language
  onChange: (value: string) => void
  height?: string
}

export default function MonacoInput({ code, language, onChange, height = '240px' }: Props) {
  return (
    <MonacoBlock
      code={code}
      language={language}
      readOnly={false}
      height={height}
      onChange={onChange}
    />
  )
}
