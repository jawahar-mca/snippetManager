// import EntryDetail from '@/components/EntryDetail'

// // Required for Next.js static export with dynamic [id] routes.
// // Returns empty array = no pages pre-rendered at build time.
// // The client component reads localStorage at runtime instead.
// export function generateStaticParams() {
//   return []
// }

// export const dynamicParams = false

// export default function EntryPage({ params }: { params: { id: string } }) {
//   return <EntryDetail id={params.id} />
// }


'use client'

import EntryDetail from '@/components/EntryDetail'
import { useParams } from 'next/navigation'

export default function EntryPage() {
  const params = useParams()
  const segments = params.slug as string[]

  // slug[0] = the UUID, slug[1] = 'edit' if present
  const id = segments[0]
  const isEdit = segments[1] === 'edit'

  if (isEdit) {
    const EntryEdit = require('@/components/EntryEdit').default
    return <EntryEdit id={id} />
  }

  return <EntryDetail id={id} />
}