'use server'

import { db } from '@/lib/db'
import { getCurrentUserId, getSecretKey } from '@/lib/jwt'
import type { Message } from '@/lib/types'
import { jwtVerify } from 'jose'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function saveMessage(data: {
  content: string
  name: string
}): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const createdMessage = await db.message.create({
      data: {
        content: data.content,
        name: data.name,
      },
    })

    revalidatePath('/messages')

    return { success: true, message: createdMessage }
  } catch (error) {
    console.error('Error saving message:', error)
    return { success: false, error: 'Failed to save message' }
  }
}

/**
 * Toggle like status for a media item (photo or video)
 */
export async function toggleLikePhoto(mediaId: string) {
  const userId = await getCurrentUserId()
  if (!userId)
    return {
      success: false,
      likes: 0,
      isLiked: false,
      error: 'Not authenticated',
    }

  try {
    const existingLike = await db.like.findFirst({
      where: { userId, mediaId },
    })

    let isLiked: boolean

    if (existingLike) {
      await db.like.delete({
        where: { id: existingLike.id },
      })
      isLiked = false
    } else {
      await db.like.create({
        data: { mediaId, userId },
      })
      isLiked = true
    }

    const likeCount = await db.like.count({
      where: { mediaId },
    })

    return { success: true, likes: likeCount, isLiked }
  } catch (err) {
    console.error('Error in toggleLikePhoto:', err)
    return {
      success: false,
      likes: 0,
      isLiked: false,
      error: 'Something went wrong',
    }
  }
}

export async function deleteFileFromUploadThing(key: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.uploadthing.com/v6/deleteFiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Uploadthing-Api-Key': process.env.UPLOADTHING_SECRET!,
      },
      body: JSON.stringify({
        fileKeys: [key],
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error('Failed to delete file from UploadThing:', data)
      return false
    }

    return true
  } catch (err) {
    console.error('Error deleting from UploadThing:', err)
    return false
  }
}

export async function deleteMedia(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const media = await db.media.findUnique({
      where: { id },
    })

    if (!media) return { success: false, error: 'Media not found' }

    let deletedFromUT = true
    if (media.uploadthingKey) {
      deletedFromUT = await deleteFileFromUploadThing(media.uploadthingKey)
    }

    if (!deletedFromUT)
      return { success: false, error: 'Failed to delete from UploadThing' }

    await db.media.delete({ where: { id } })

    revalidatePath('/gallery')

    return { success: true }
  } catch (err) {
    console.error('Delete media error:', err)
    return { success: false, error: 'Failed to delete media' }
  }
}

export async function createComment({
  content,
  mediaId,
}: {
  content: string
  mediaId: string
}) {
  if (!content || !mediaId) {
    throw new Error('Missing fields')
  }

  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  let userId: string = ''
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey())
      userId = (payload as any).userId
    } catch (e) {
      throw new Error('Invalid token')
    }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('User not found')
  }

  const comment = await db.comment.create({
    data: {
      content,
      name: user.name,
      mediaId,
      userId: userId || null,
    },
  })

  // revalidatePath('/media')

  return comment
}

export async function getProfile() {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value

  let userId: string = ''
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey())
      userId = (payload as any).userId
    } catch (e) {
      throw new Error('Invalid token')
    }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error('User not found')
  }
  return user
}
