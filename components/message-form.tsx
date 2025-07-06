"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { saveMessage } from "@/app/actions"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  content: z.string().min(1, {
    message: "Message cannot be empty.",
  }).max(500, {
    message: "Message must be less than 500 characters."
  }),
})

export function MessageForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userName, setUserName] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  })

  // Load saved name from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("userName") || ""
      setUserName(savedName)
      form.setValue("name", savedName)
    } catch (error) {
      console.error("Error loading user name:", error)
    }
  }, [form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await saveMessage({
        name: values.name,
        content: values.content,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      // Save name to localStorage
      try {
        localStorage.setItem("userName", values.name)
      } catch (error) {
        console.error("Error saving to localStorage:", error)
      }
      
      toast.success("Message posted successfully!")
      form.reset({ name: values.name, content: "" })
      router.refresh()
    } catch (error) {
      console.error("Error posting message:", error)
      toast.error("Failed to post message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-muted/30 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Leave a Message</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Message</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share your wishes or thoughts..." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription className="flex justify-between">
                  <span>Share your wishes with the couple</span>
                  <span className="text-muted-foreground">{field.value.length}/500</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Message"}
          </Button>
        </form>
      </Form>
    </div>
  )
} 