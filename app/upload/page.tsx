import { UploadForm } from '@/components/upload-form'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-serif">Upload Media</h1>
            <p className="text-sm text-muted-foreground">
              Share your memories with us
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-6">
            <UploadForm />
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Benji — July 06, 2025</p>
        </div>
      </footer>
    </div>
  )
}
