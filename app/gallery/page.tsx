import Link from 'next/link'
import { ChevronLeft, Upload } from 'lucide-react'
import { getCurrentUserId } from '@/lib/jwt'
import { Button } from '@/components/ui/button'
import GalleryClient from '@/components/gallery-client'

export default async function GalleryPage() {
  const currentUserId = await getCurrentUserId()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-serif">Benji's Gallery</h1>
              <p className="text-sm text-muted-foreground">
                Memories from our special day
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <GalleryClient currentUserId={currentUserId!} />
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Benji — June 28th, 2023</p>
        </div>
      </footer>
    </div>
  )
}
