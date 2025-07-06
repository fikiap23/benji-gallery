import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Camera, Heart, MessageCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[75vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/benji-hero.jpeg"
          alt="Benji Hero"
          fill
          className="object-cover absolute inset-0 z-0"
          priority
        />
        <div className="z-10 text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-md">
            Benji’s Growth Journal
          </h1>
          <p className="text-white text-base sm:text-lg mt-3 drop-shadow-sm max-w-md mx-auto">
            A place to celebrate every smile, step, and memory.
          </p>
          <Button asChild className="mt-5">
            <Link href="/gallery">Explore Memories</Link>
          </Button>
        </div>
        <div className="absolute inset-0 bg-black/30 z-0" />
      </section>

      {/* Highlights Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 text-center">
            <HighlightCard
              icon={<Camera className="h-7 w-7 text-indigo-600 mx-auto mb-3" />}
              title="Upload"
              description="Capture & share milestones"
              href="/upload"
            />
            <HighlightCard
              icon={<Heart className="h-7 w-7 text-pink-500 mx-auto mb-3" />}
              title="Gallery"
              description="Relive Benji’s journey"
              href="/gallery"
            />
            <HighlightCard
              icon={
                <MessageCircle className="h-7 w-7 text-teal-600 mx-auto mb-3" />
              }
              title="Messages"
              description="Send your love & wishes"
              href="/messages"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-center py-6 border-t">
        <p className="text-xs text-muted-foreground">
          Made with love for Benji — Born July 6th, 2025
        </p>
      </footer>
    </div>
  )
}

function HighlightCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <div className="bg-white shadow rounded-lg p-5 hover:shadow-md transition">
      {icon}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-3">{description}</p>
      <Button asChild variant="outline" size="sm">
        <Link href={href}>Go</Link>
      </Button>
    </div>
  )
}
