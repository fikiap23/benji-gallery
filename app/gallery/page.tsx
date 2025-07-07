import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Upload } from 'lucide-react'
import { getMedia, type SortOption, type MediaTypeFilter } from '@/lib/media'
import { Gallery } from '@/components/gallery'
import { GallerySorter } from '@/components/gallery-sorter'
import type { Media } from '@/lib/types'

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: {
    sort?: SortOption
    type?: MediaTypeFilter
  }
}) {
  const sortBy = searchParams.sort || 'recent'
  const mediaType = searchParams.type || 'all'

  let media: Media[] = []
  try {
    media = await getMedia({ sortBy, type: mediaType })
  } catch (error) {
    console.error('Error fetching media:', error)
    // Continue with empty media array
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-serif">Benji's Gallery</h1>
              <p className="text-sm text-muted-foreground">
                Memories from our special day
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <GallerySorter currentSort={sortBy} mediaType={mediaType} />
        </div>
        <Gallery media={media} />
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Benji — Benji — June 28th, 2023</p>
        </div>
      </footer>
    </div>
  )
}
