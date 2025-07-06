import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

/**
 * Checks if a media URL is valid by attempting to load it
 * @param url The URL to check
 * @param type The type of media ('image' or 'video')
 * @returns A promise resolving to true if the URL is valid, false otherwise
 */
export async function isMediaUrlValid(url: string, type?: string): Promise<boolean> {
  if (!url) return false
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    console.error(`Error checking ${type || 'media'} URL ${url}:`, error)
    return false
  }
}

/**
 * Checks if an image URL is valid by attempting to load it
 * @param url The URL to check
 * @returns A promise resolving to true if the URL is valid, false otherwise
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  return isMediaUrlValid(url, 'image')
}

/**
 * Generates a thumbnail from a video URL using HTML5 video element
 */
export function generateVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.src = videoUrl
    
    // When video metadata is loaded, seek to first frame
    video.onloadedmetadata = () => {
      video.currentTime = 0
    }
    
    // When seeking is complete, capture the frame
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context')
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)
        
        // Clean up
        video.remove()
        resolve(thumbnailUrl)
      } catch (error) {
        reject(error)
      }
    }
    
    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }
  })
}

