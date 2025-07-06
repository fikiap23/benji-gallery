import { db } from "@/lib/db"
import type { Photo } from "@/lib/types"
import { isImageUrlValid } from "@/lib/utils"

export type SortOption = "recent" | "oldest" | "likes"

/**
 * Retrieves all valid photos from the database
 * If cleanupDeleted is true, it will also remove references to deleted photos
 */
export async function getPhotos(options: { 
  cleanupDeleted?: boolean;
  sortBy?: SortOption;
} = {}): Promise<Photo[]> {
  const { cleanupDeleted = true, sortBy = "recent" } = options;
  
  try {
    // Determine the sort order
    const orderBy = {
      recent: { createdAt: "desc" as const },
      oldest: { createdAt: "asc" as const },
      likes: { likes: "desc" as const },
    }[sortBy];
    
    // Get all photos from database
    const photos = await db.photo.findMany({
      orderBy,
    })

    // Create an array to collect invalid photo IDs
    const invalidPhotoIds: string[] = []
    const validPhotos: Photo[] = []

    // Check each photo URL
    for (const photo of photos) {
      const isValid = await isImageUrlValid(photo.url)
      
      if (isValid) {
        // Keep valid photos
        // Use type assertion to handle the likes field
        validPhotos.push(photo as unknown as Photo)
      } else {
        // Track invalid photo IDs for cleanup
        invalidPhotoIds.push(photo.id)
        console.log(`Found invalid photo URL: ${photo.url} for photo ID: ${photo.id}`)
      }
    }

    // Optionally clean up invalid photo references from database
    if (cleanupDeleted && invalidPhotoIds.length > 0) {
      try {
        const deleteResult = await db.photo.deleteMany({
          where: {
            id: {
              in: invalidPhotoIds
            }
          }
        })
        console.log(`Cleaned up ${deleteResult.count} deleted photos from database`)
      } catch (cleanupError) {
        console.error("Error cleaning up deleted photos:", cleanupError)
      }
    }

    return validPhotos
  } catch (error) {
    console.error("Error fetching photos:", error)
    return []
  }
}

/**
 * Initiates a cleanup of deleted photos without returning data
 * Useful for scheduled cleanup jobs
 */
export async function cleanupDeletedPhotos(): Promise<{ removed: number }> {
  try {
    // Get all photos from database
    const photos = await db.photo.findMany({
      select: {
        id: true,
        url: true
      }
    })

    // Create an array to collect invalid photo IDs
    const invalidPhotoIds: string[] = []

    // Check each photo URL
    for (const photo of photos) {
      const isValid = await isImageUrlValid(photo.url)
      
      if (!isValid) {
        invalidPhotoIds.push(photo.id)
      }
    }

    // Delete invalid photos
    if (invalidPhotoIds.length > 0) {
      const deleteResult = await db.photo.deleteMany({
        where: {
          id: {
            in: invalidPhotoIds
          }
        }
      })
      
      return { removed: deleteResult.count }
    }

    return { removed: 0 }
  } catch (error) {
    console.error("Error cleaning up photos:", error)
    return { removed: 0 }
  }
}

