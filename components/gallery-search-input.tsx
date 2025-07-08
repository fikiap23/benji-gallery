'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { X, Search } from 'lucide-react'

export default function SearchInput({
  initialSearch,
}: {
  initialSearch: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      router.push(`?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timeout)
  }, [search])

  return (
    <div className="relative w-full md:max-w-sm">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="w-4 h-4" />
      </span>

      <Input
        placeholder="Search comments..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9 pr-10 focus-visible:ring-1 focus-visible:ring-primary"
      />

      {search && (
        <button
          onClick={() => setSearch('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
