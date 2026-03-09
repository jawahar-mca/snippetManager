export type Language =
  | 'typescript' | 'javascript' | 'python'
  | 'react' | 'angular' | 'bash' | 'css' | 'html'
  | 'json' | 'sql' | 'other'
export interface CodeBlock {
  id: string
  language: Language
  code: string
  caption?: string
}

export interface Entry {
  id: string
  title: string
  topic: string
  tags: string[]
  language: Language
  explanation: string
  codeBlocks: CodeBlock[]
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  entry: Entry
  refIndex: number
  score?: number
}
