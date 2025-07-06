import { db } from "@/lib/db"
import type { Message } from "@/lib/types"

/**
 * Retrieves all messages from the database
 */
export async function getMessages(): Promise<Message[]> {
  try {
    // Get all messages from database
    const messages = await db.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return messages
  } catch (error) {
    console.error("Error fetching messages:", error)
    return []
  }
}

/**
 * Saves a new message to the database
 */
export async function saveMessage(data: { content: string; name: string }): Promise<Message> {
  const message = await db.message.create({
    data: {
      content: data.content,
      name: data.name,
    },
  })
  
  return message
} 