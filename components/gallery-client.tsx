'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Gallery } from '@/components/gallery'
import { GallerySorter } from '@/components/gallery-sorter'
import SearchInput from '@/components/gallery-search-input'
import { MediaTypeFilter, SortOption } from '@/lib/media'
import { Media } from '@/lib/types'
import { getMedia } from '@/lib/media.client'

export default function GalleryClient({
  currentUserId,
}: {
  currentUserId: string
}) {
  const searchParams = useSearchParams()
  const sortBy = (searchParams.get('sort') || 'recent') as SortOption
  const mediaType = (searchParams.get('type') || 'all') as MediaTypeFilter
  const search = searchParams.get('search')?.toLowerCase() || ''

  const [media, setMedia] = useState<Media[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loader = useRef<HTMLDivElement | null>(null)

  // Fetch media
  const loadMore = async () => {
    const newMedia = await getMedia({
      sortBy,
      type: mediaType,
      search,
      page,
      pageSize: 10,
    })

    setMedia((prev) => (page === 1 ? newMedia : [...prev, ...newMedia]))
    setHasMore(newMedia.length > 0)
  }

  // Trigger fetch on page change
  useEffect(() => {
    loadMore()
  }, [page, sortBy, mediaType, search])

  // Reset when sort, type, or search changes
  useEffect(() => {
    setMedia([])
    setPage(1)
    setHasMore(true)
  }, [sortBy, mediaType, search])

  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 1 }
    )

    if (loader.current) {
      observer.observe(loader.current)
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current)
      }
    }
  }, [loader, hasMore])

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <SearchInput initialSearch={search} />
        <GallerySorter currentSort={sortBy} mediaType={mediaType} />
      </div>
      <Gallery media={media} currentUserId={currentUserId} />
      <div ref={loader} className="h-10" />
    </>
  )
}
