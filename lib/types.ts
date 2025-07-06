export interface Media {
  id: string
  url: string
  name: string
  type: 'image' | 'video'
  fileType?: string
  thumbnail?: string
  size?: number
  duration?: number
  likes: number
  createdAt: Date
}

// Keep Photo type for backwards compatibility
export type Photo = Media

export interface Email {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Message {
  id: string
  content: string
  name: string
  createdAt: Date
}

