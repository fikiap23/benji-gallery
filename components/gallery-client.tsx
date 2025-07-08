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
  const [isLoading, setIsLoading] = useState(false)
  const loader = useRef<HTMLDivElement | null>(null)

  const loadMore = async () => {
    setIsLoading(true)
    const newMedia = await getMedia({
      sortBy,
      type: mediaType,
      search,
      page,
      pageSize: 10,
    })
    setMedia((prev) => (page === 1 ? newMedia : [...prev, ...newMedia]))
    setHasMore(newMedia.length > 0)
    setIsLoading(false)
  }

  useEffect(() => {
    loadMore()
  }, [page, sortBy, mediaType, search])

  useEffect(() => {
    setMedia([])
    setPage(1)
    setHasMore(true)
  }, [sortBy, mediaType, search])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
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
  }, [loader, hasMore, isLoading])

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <SearchInput initialSearch={search} />
        <GallerySorter currentSort={sortBy} mediaType={mediaType} />
      </div>
      <Gallery
        media={media}
        currentUserId={currentUserId}
        isLoading={isLoading && page === 1}
      />
      {isLoading && page > 1 && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={loader} className="h-10" />
    </>
  )
}
