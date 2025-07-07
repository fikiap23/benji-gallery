import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { getMessages } from '@/lib/messages'
import { MessageBoard } from '@/components/message-board'
import { MessageForm } from '@/components/message-form'

export default async function MessagesPage() {
  const messages = await getMessages()

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
              <h1 className="text-2xl font-serif">Message Board</h1>
              <p className="text-sm text-muted-foreground">
                Notes and wishes from our family
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <MessageBoard messages={messages} />
            </div>
            <div className="md:sticky md:top-8 self-start">
              <MessageForm />
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Benji — Benji — June 28th, 2023</p>
        </div>
      </footer>
    </div>
  )
}
