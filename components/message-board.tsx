"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { MessageCircle, User, Quote } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageBoardProps {
  messages: Message[]
}

export function MessageBoard({ messages }: MessageBoardProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium">No messages yet</h3>
        <p className="text-muted-foreground mt-2">Be the first to leave a message!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}

function MessageCard({ message }: { message: Message }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="bg-muted/30 pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{message.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{message.name}</CardTitle>
            <CardDescription>{formatDate(message.createdAt)}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-2 items-start">
          <Quote className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
          <p className="text-muted-foreground italic">{message.content}</p>
        </div>
      </CardContent>
    </Card>
  )
} 