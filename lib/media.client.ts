import { MediaTypeFilter, SortOption } from './media'
import type { Media } from './types'
import qs from 'query-string'

export async function getMedia({
  sortBy,
  type,
  search,
  page = 1,
  pageSize = 10,
}: {
  sortBy: SortOption
  type: MediaTypeFilter
  search: string
  page: number
  pageSize: number
}): Promise<Media[]> {
  const query = qs.stringify({
    sort: sortBy,
    type,
    search,
    page,
    pageSize,
  })

  const res = await fetch(`/api/media?${query}`)
  return res.json()
}
