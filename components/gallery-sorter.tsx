"use client"

import { useRouter, usePathname } from "next/navigation"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { SortAsc, SortDesc, Heart, Image as ImageIcon, Film, Grid } from "lucide-react"
import type { SortOption } from "@/lib/media"
import type { MediaTypeFilter } from "@/lib/media"

interface GallerySorterProps {
  currentSort: SortOption
  mediaType?: MediaTypeFilter
}

export function GallerySorter({ currentSort, mediaType = "all" }: GallerySorterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSortChange = (value: string) => {
    // Create a new URL with the selected sort option
    const params = new URLSearchParams()
    if (value !== "recent") {
      params.set("sort", value)
    }
    
    // Keep the current media type filter
    if (mediaType !== "all") {
      params.set("type", mediaType)
    }
    
    // Navigate to the new URL
    router.push(`${pathname}?${params.toString()}`)
  }
  
  const handleTypeChange = (value: string) => {
    // Create a new URL with the selected media type
    const params = new URLSearchParams()
    if (value !== "all") {
      params.set("type", value)
    }
    
    // Keep the current sort option
    if (currentSort !== "recent") {
      params.set("sort", currentSort)
    }
    
    // Navigate to the new URL
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">View:</span>
        <Select value={mediaType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="flex items-center gap-2">
              <Grid className="h-4 w-4 mr-1" />
              <span>All media</span>
            </SelectItem>
            <SelectItem value="images" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 mr-1" />
              <span>Photos only</span>
            </SelectItem>
            <SelectItem value="videos" className="flex items-center gap-2">
              <Film className="h-4 w-4 mr-1" />
              <span>Videos only</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent" className="flex items-center gap-2">
              <SortDesc className="h-4 w-4 mr-1" />
              <span>Newest first</span>
            </SelectItem>
            <SelectItem value="oldest" className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 mr-1" />
              <span>Oldest first</span>
            </SelectItem>
            <SelectItem value="likes" className="flex items-center gap-2">
              <Heart className="h-4 w-4 mr-1" />
              <span>Most liked</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 