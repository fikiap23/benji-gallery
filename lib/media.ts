import { db } from '@/lib/db'
import type { Media } from '@/lib/types'
import { isMediaUrlValid } from '@/lib/utils'
import { Prisma } from '@prisma/client'

export type SortOption = 'recent' | 'oldest' | 'likes'
export type MediaTypeFilter = 'all' | 'images' | 'videos'

/**
 * Retrieves all valid media from the database
 * If cleanupDeleted is true, it will also remove references to deleted media
 */
export async function getMedia(
  options: {
    cleanupDeleted?: boolean
    sortBy?: SortOption
    type?: MediaTypeFilter
    search?: string
  } = {}
): Promise<Media[]> {
  const { sortBy = 'recent', type = 'all', search } = options

  try {
    // Prepare filtering by type
    const typeFilter =
      type === 'all' ? {} : { type: type === 'images' ? 'image' : 'video' }

    const commentSearchFilter = search
      ? {
          comment: {
            some: {
              content: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {}

    // Combine all filters
    const where = {
      ...typeFilter,
      ...commentSearchFilter,
    }

    const mediaItems = await db.media.findMany({
      where,
      orderBy:
        sortBy === 'recent'
          ? { createdAt: 'desc' }
          : sortBy === 'oldest'
          ? { createdAt: 'asc' }
          : sortBy === 'likes'
          ? { like: { _count: 'desc' } }
          : { createdAt: 'desc' },
      include: {
        comment: true,
        like: true,
        _count: true,
      },
    })

    return mediaItems as unknown as Media[]
  } catch (error) {
    console.error('Error fetching media:', error)
    return []
  }
}

/**
 * Backwards compatibility function for getPhotos
 */
export async function getPhotos(
  options: {
    cleanupDeleted?: boolean
    sortBy?: SortOption
  } = {}
): Promise<Media[]> {
  return getMedia({ ...options, type: 'images' })
}

/**
 * Initiates a cleanup of deleted media without returning data
 * Useful for scheduled cleanup jobs
 */
export async function cleanupDeletedMedia(): Promise<{ removed: number }> {
  try {
    // Get all media from database
    const mediaItems = await db.media.findMany({
      select: {
        id: true,
        url: true,
        type: true,
      },
    })

    // Create an array to collect invalid media IDs
    const invalidMediaIds: string[] = []

    // Check each media URL
    for (const item of mediaItems) {
      const isValid = await isMediaUrlValid(item.url, item.type)

      if (!isValid) {
        invalidMediaIds.push(item.id)
      }
    }

    // Delete invalid media
    if (invalidMediaIds.length > 0) {
      const deleteResult = await db.media.deleteMany({
        where: {
          id: {
            in: invalidMediaIds,
          },
        },
      })

      return { removed: deleteResult.count }
    }

    return { removed: 0 }
  } catch (error) {
    console.error('Error cleaning up media:', error)
    return { removed: 0 }
  }
}

/**
 * Backwards compatibility function for cleanupDeletedPhotos
 */
export async function cleanupDeletedPhotos(): Promise<{ removed: number }> {
  return cleanupDeletedMedia()
}
