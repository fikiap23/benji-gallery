// app/api/media/route.ts

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sort = (searchParams.get('sort') || 'recent') as
    | 'recent'
    | 'oldest'
    | 'likes'
  const type = searchParams.get('type') || 'all'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sort === 'recent'
      ? { createdAt: 'desc' }
      : sort === 'oldest'
      ? { createdAt: 'asc' }
      : { like: { _count: 'desc' } }

  const where: Prisma.MediaWhereInput = {
    ...(type !== 'all' && { type: type === 'images' ? 'image' : 'video' }),
    ...(search && {
      comment: {
        some: {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    }),
  }

  const media = await db.media.findMany({
    where,
    orderBy,
    include: {
      comment: true,
      like: true,
      _count: true,
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  })

  return NextResponse.json(media)
}
