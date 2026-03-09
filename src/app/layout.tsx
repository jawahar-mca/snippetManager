import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnippetManager — Personal Code Knowledge Base',
  description: 'Search, save and retrieve your engineering solutions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-vault-bg text-vault-text font-body antialiased">
        {children}
      </body>
    </html>
  )
}
