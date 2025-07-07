'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Heart, Play, User } from 'lucide-react'
import { createComment, deleteMedia, toggleLikePhoto } from '@/app/actions'
import { cn, generateVideoThumbnail } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VideoPlayer } from '@/components/video-player'
import type { Media } from '@/lib/types'

interface GalleryProps {
  media: Media[]
}

export function Gallery({ media }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Media | null>(null)
  const [likedPhotos, setLikedPhotos] = useState<Record<string, number>>({})
  const [userLikedPhotos, setUserLikedPhotos] = useState<Set<string>>(new Set())
  const [doubleTapTimer, setDoubleTapTimer] = useState<
    Record<string, NodeJS.Timeout | null>
  >({})
  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, string>
  >({})
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  // Load user liked photos from localStorage
  useEffect(() => {
    try {
      const likedPhotosJson = localStorage.getItem('userLikedPhotos')
      if (likedPhotosJson) {
        const likedPhotoIds = JSON.parse(likedPhotosJson)
        if (Array.isArray(likedPhotoIds)) {
          setUserLikedPhotos(new Set(likedPhotoIds))
        }
      }

      // Load cached thumbnails from localStorage
      const thumbnailsJson = localStorage.getItem('videoThumbnails')
      if (thumbnailsJson) {
        const thumbnails = JSON.parse(thumbnailsJson)
        setVideoThumbnails(thumbnails)
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
  }, [])

  // Generate thumbnails for videos that don't have them
  useEffect(() => {
    const generateMissingThumbnails = async () => {
      const videoItems = media.filter((item) => item.type === 'video')
      const newThumbnails: Record<string, string> = { ...videoThumbnails }
      let hasNewThumbnails = false

      for (const video of videoItems) {
        if (!videoThumbnails[video.id]) {
          try {
            const thumbnail = await generateVideoThumbnail(video.url)
            newThumbnails[video.id] = thumbnail
            hasNewThumbnails = true
          } catch (error) {
            console.error(
              `Failed to generate thumbnail for video ${video.id}:`,
              error
            )
          }
        }
      }

      if (hasNewThumbnails) {
        setVideoThumbnails(newThumbnails)
        try {
          localStorage.setItem('videoThumbnails', JSON.stringify(newThumbnails))
        } catch (error) {
          console.error('Error saving thumbnails to localStorage:', error)
        }
      }
    }

    generateMissingThumbnails()
  }, [media])

  const handleImageError = (photoId: string) => {
    console.error(`Image failed to load for photo ID: ${photoId}`)
  }

  const handleLikePhoto = async (photoId: string, event?: React.MouseEvent) => {
    // Prevent event bubbling if event exists
    if (event) {
      event.stopPropagation()
    }

    // Check if user has already liked this photo
    if (userLikedPhotos.has(photoId)) {
      toast.info("You've already liked this photo!")
      return
    }

    // Optimistic update for UI
    setLikedPhotos((prev) => {
      const mediaItem = media.find((p) => p.id === photoId)
      const currentLikes = mediaItem?.likes || 0
      const newLikes =
        (prev[photoId] !== undefined ? prev[photoId] : currentLikes) + 1
      return { ...prev, [photoId]: newLikes }
    })

    // Add to user liked photos in state
    const newUserLikedPhotos = new Set(userLikedPhotos)
    newUserLikedPhotos.add(photoId)
    setUserLikedPhotos(newUserLikedPhotos)

    // Save to localStorage
    try {
      localStorage.setItem(
        'userLikedPhotos',
        JSON.stringify([...newUserLikedPhotos])
      )
    } catch (error) {
      console.error('Error saving liked photos to localStorage:', error)
    }

    try {
      const result = await toggleLikePhoto(photoId)
      if (result.error) {
        throw new Error(result.error)
      }

      // Update with the real count from the server
      setLikedPhotos((prev) => {
        // Copy the previous state
        const newLikes: Record<string, number> = { ...prev }
        // Update with the new like count
        newLikes[photoId] = result.likes
        return newLikes
      })
    } catch (error) {
      console.error('Error liking photo:', error)
      toast.error('Failed to like photo. Please try again.')

      // Revert the optimistic update
      setLikedPhotos((prev) => {
        const newLikedPhotos: Record<string, number> = {}
        // Copy all entries except the one to remove
        Object.entries(prev).forEach(([key, value]) => {
          if (key !== photoId) {
            newLikedPhotos[key] = value
          }
        })
        return newLikedPhotos
      })

      // Remove from user liked photos
      const revertedUserLikedPhotos = new Set(userLikedPhotos)
      revertedUserLikedPhotos.delete(photoId)
      setUserLikedPhotos(revertedUserLikedPhotos)

      // Update localStorage
      try {
        localStorage.setItem(
          'userLikedPhotos',
          JSON.stringify([...revertedUserLikedPhotos])
        )
      } catch (error) {
        console.error('Error saving liked photos to localStorage:', error)
      }
    }
  }

  const handlePhotoTap = (photoId: string, event: React.MouseEvent) => {
    event.preventDefault()
    const mediaItem = media.find((p) => p.id === photoId)
    if (!mediaItem) return

    // Check if we have a timer for this photo (indicating a potential double tap)
    if (doubleTapTimer[photoId]) {
      // This is a double tap, like the photo if not already liked
      if (!userLikedPhotos.has(photoId)) {
        handleLikePhoto(photoId, event)
      }

      // Clear the timer
      clearTimeout(doubleTapTimer[photoId]!)
      setDoubleTapTimer((prev) => ({ ...prev, [photoId]: null }))
    } else {
      // This is the first tap, set a timer
      const timer = setTimeout(() => {
        // Single tap - show photo details
        setSelectedPhoto(mediaItem)

        // Clear the timer
        setDoubleTapTimer((prev) => ({ ...prev, [photoId]: null }))
      }, 300) // 300ms is a good double-tap detection threshold

      setDoubleTapTimer((prev) => ({ ...prev, [photoId]: timer }))
    }
  }

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!comment.trim()) return

    startTransition(async () => {
      try {
        const newComment = await createComment({
          content: comment,
          mediaId: selectedPhoto?.id || '',
        })

        setComment('')

        setSelectedPhoto((prev) =>
          prev
            ? {
                ...prev,
                comment: [...(prev.comment || []), newComment],
              }
            : prev
        )
      } catch (error) {
        console.error('Failed to submit comment', error)
      }
    })
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No media yet. Be the first to upload!
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:scale-[1.02] group"
            onClick={(e) => handlePhotoTap(item.id, e)}
          >
            {item.type === 'video' ? (
              <div className="relative w-full h-full">
                <Image
                  src={videoThumbnails[item.id] || item.thumbnail || item.url}
                  alt={`Video by ${item.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => handleImageError(item.id)}
                  priority={false}
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <Image
                src={item.url}
                alt={`Photo by ${item.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onError={() => handleImageError(item.id)}
                priority={false}
              />
            )}

            {/* Tombol Like */}
            <div className="absolute bottom-2 right-2">
              <button
                onClick={(e) => handleLikePhoto(item.id, e)}
                className={cn(
                  'flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-black/50 text-white',
                  userLikedPhotos.has(item.id) && 'cursor-default'
                )}
                aria-label={
                  userLikedPhotos.has(item.id) ? 'Already liked' : 'Like photo'
                }
                disabled={userLikedPhotos.has(item.id)}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    userLikedPhotos.has(item.id) ||
                      (likedPhotos[item.id] || item.likes) > item.likes
                      ? 'fill-red-500 text-red-500'
                      : 'text-white'
                  )}
                />
                <span>
                  {likedPhotos[item.id] !== undefined
                    ? likedPhotos[item.id]
                    : item.likes}
                </span>
              </button>
            </div>

            {/* Tombol Delete */}
            <div className="absolute bottom-2 left-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  const confirmDelete = confirm(
                    'Are you sure you want to delete this media?'
                  )
                  if (!confirmDelete) return

                  const res = await deleteMedia(item.id)
                  if (res.success) {
                    toast.success('Media deleted')
                    window.location.reload()
                  } else {
                    toast.error(res.error || 'Failed to delete media')
                  }
                }}
                className="text-xs px-2 py-1 rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>

            {/* Label nama */}
            <div className="absolute top-2 left-2">
              <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Camera className="h-3 w-3" />
                <span>{item.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-5xl w-full p-6 bg-background rounded-2xl shadow-2xl space-y-6">
          {selectedPhoto && (
            <>
              {/* Header */}
              <DialogHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DialogTitle className="text-xl font-semibold">
                      {selectedPhoto.name}
                    </DialogTitle>
                    <div className="flex items-center gap-1 bg-muted text-xs text-muted-foreground px-2 py-1 rounded-full">
                      <Camera className="w-4 h-4" />
                      <span>Photographer</span>
                    </div>
                  </div>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* Media */}
              <div className="w-full rounded-xl overflow-hidden bg-muted relative flex items-center justify-center max-h-[60vh]">
                {selectedPhoto.type === 'video' ? (
                  <VideoPlayer
                    src={selectedPhoto.url}
                    poster={selectedPhoto.thumbnail}
                  />
                ) : (
                  <Image
                    src={selectedPhoto.url}
                    alt={`Photo by ${selectedPhoto.name}`}
                    width={1200}
                    height={800}
                    className="w-full h-auto max-h-[60vh] rounded-md object-cover"
                    onError={() => toast.error('Failed to load photo')}
                  />
                )}
              </div>

              {/* Likes & Comments */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b pb-3">
                  <button
                    onClick={() => handleLikePhoto(selectedPhoto.id)}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors',
                      userLikedPhotos.has(selectedPhoto.id) && 'cursor-default'
                    )}
                    disabled={userLikedPhotos.has(selectedPhoto.id)}
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5 transition-colors',
                        userLikedPhotos.has(selectedPhoto.id) ||
                          (likedPhotos[selectedPhoto.id] ||
                            selectedPhoto.likes) > selectedPhoto.likes
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span>
                      {likedPhotos[selectedPhoto.id] !== undefined
                        ? likedPhotos[selectedPhoto.id]
                        : selectedPhoto.likes}{' '}
                      Likes
                    </span>
                  </button>

                  <span className="text-sm text-muted-foreground">
                    {selectedPhoto.comment?.length || 0} Comments
                  </span>
                </div>

                {/* Comment List */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto px-1">
                  {selectedPhoto.comment?.map((comment) => (
                    <div key={comment.id} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-muted text-xs text-muted-foreground px-2 py-1 rounded-full">
                        <User className="w-4 h-4" />
                        <span>{comment.name}</span>
                      </div>
                      <span className="text-sm">{comment.content}</span>
                    </div>
                  ))}
                </div>

                {/* New Comment Input */}
                <form
                  onSubmit={handleSubmitComment}
                  className="flex items-center gap-2 mt-2"
                >
                  <input
                    type="text"
                    name="comment"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="flex-1 border border-input rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary/90"
                  >
                    {isPending ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted animate-pulse"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-100/20 to-gray-200/20" />
        </div>
      ))}
    </div>
  )
}
