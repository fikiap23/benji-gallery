'use server'

import { db } from '@/lib/db'
import type { Message, Media } from '@/lib/types'
import { revalidatePath } from 'next/cache'

export async function saveEmail(data: { name: string; email: string }) {
  try {
    // Check if email already exists
    const existingEmail = await db.email.findUnique({
      where: { email: data.email },
    })

    if (existingEmail) {
      // If email exists, just update the name
      const updated = await db.email.update({
        where: { email: data.email },
        data: { name: data.name },
      })
      return { success: true, email: updated }
    } else {
      // Otherwise create a new record
      const email = await db.email.create({
        data: {
          name: data.name,
          email: data.email,
        },
      })
      return { success: true, email }
    }
  } catch (error) {
    console.error('Error saving email:', error)
    return { success: false, error: 'Failed to save email' }
  }
}

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
export async function toggleLikePhoto(mediaId: string): Promise<{
  success: boolean
  likes: number
  error?: string
}> {
  try {
    const updatedMedia = await db.media.update({
      where: { id: mediaId },
      data: {
        likes: {
          increment: 1,
        },
      },
    })

    revalidatePath('/gallery')

    return { success: true, likes: updatedMedia.likes }
  } catch (error) {
    console.error('Error liking media:', error)
    return { success: false, likes: 0, error: 'Failed to like media' }
  }
}
