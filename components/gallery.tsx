'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Heart, MessageCircle, Play, User } from 'lucide-react'
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
import { useRouter } from 'next/navigation'

interface GalleryProps {
  media: Media[]
  currentUserId: string
}

export function Gallery({ media, currentUserId }: GalleryProps) {
  const router = useRouter()
  const [selectedPhoto, setSelectedPhoto] = useState<Media | null>(null)
  const [doubleTapTimer, setDoubleTapTimer] = useState<
    Record<string, NodeJS.Timeout | null>
  >({})
  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, string>
  >({})
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const hasLiked = selectedPhoto?.like?.some(
    (like) => like.userId === currentUserId
  )

  // Load user liked photos from localStorage
  useEffect(() => {
    try {
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
    if (event) event.stopPropagation()

    try {
      const result = await toggleLikePhoto(photoId)

      if (!result.success) {
        toast.error(result.error || 'Failed to toggle like.')
        return
      }

      setSelectedPhoto((prev) => {
        if (!prev) return prev

        let updatedLikes = prev.like || []

        if (result.isLiked) {
          updatedLikes = [
            ...updatedLikes,
            {
              id: 'temp-id',
              userId: currentUserId!,
              mediaId: photoId,
              createdAt: new Date(),
            },
          ]
        } else {
          updatedLikes = updatedLikes.filter(
            (like) => like.userId !== currentUserId
          )
        }

        return {
          ...prev,
          like: updatedLikes,
        }
      })

      router.refresh()
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Something went wrong.')
    }
  }

  const handlePhotoTap = (photoId: string, event: React.MouseEvent) => {
    event.preventDefault()
    const mediaItem = media.find((p) => p.id === photoId)
    if (!mediaItem) return

    // Check if we have a timer for this photo (indicating a potential double tap)
    if (doubleTapTimer[photoId]) {
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
        {media.map((item) => {
          const hasLiked = item.like?.some(
            (like) => like.userId === currentUserId
          )
          const likeCount = item.like?.length || 0
          return (
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
              <button
                onClick={(e) => handleLikePhoto(item.id, e)}
                className={cn(
                  'flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-black/50 text-white transition-all',
                  'hover:bg-black/70 active:scale-95'
                )}
                aria-label={hasLiked ? 'Unlike photo' : 'Like photo'}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    hasLiked ? 'fill-red-500 text-red-500' : 'text-white'
                  )}
                />
                <span>{likeCount}</span>
              </button>

              {/* Tombol Like */}
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={(e) => handleLikePhoto(item.id, e)}
                  className={cn(
                    'flex items-center gap-1 text-sm px-2 py-1 rounded-full bg-black/50 text-white transition-all',
                    'hover:bg-black/70 active:scale-95',
                    hasLiked && 'cursor-default'
                  )}
                  aria-label={hasLiked ? 'Unlike photo' : 'Like photo'}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4 transition-colors',
                      hasLiked ? 'fill-red-500 text-red-500' : 'text-white'
                    )}
                  />
                  <span>{likeCount}</span>
                </button>
              </div>

              {/* Total Comments */}
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center gap-1 text-white bg-black/50 px-2 py-1 text-sm rounded-full">
                  <MessageCircle className="w-4 h-4" />
                  <span>{item.comment?.length || 0}</span>
                </div>
              </div>

              {/* Label nama */}
              <div className="absolute top-2 left-2">
                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  <span>{item.name}</span>
                </div>
              </div>
            </div>
          )
        })}
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
                      hasLiked && 'cursor-default'
                    )}
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5 transition-colors',
                        hasLiked
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground'
                      )}
                    />
                    <span>{selectedPhoto?.like?.length || 0} Likes</span>
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
