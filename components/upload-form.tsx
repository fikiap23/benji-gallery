'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { UploadDropzone } from '@uploadthing/react'
import { toast } from 'sonner'
import { getProfile } from '@/app/actions'
import { Camera, Film, CheckCircle } from 'lucide-react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'

// Define the input type for the mediaUploader endpoint
type MediaUploaderInput = {
  name: string
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
})

export function UploadForm() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [userData, setUserData] = useState({ name: '', email: '' })
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [didUpload, setDidUpload] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  // Check for saved user info on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getProfile()

        if (user) {
          form.setValue('name', user.name)
          form.setValue('email', user.email)
          setUserData({ name: user.name, email: user.email })
          setIsReturningUser(true)
          setIsUploading(true)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [form])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (uploadComplete) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-medium">Thank You!</h3>
        <p className="text-muted-foreground">
          {didUpload
            ? 'Your media has been uploaded successfully.'
            : 'Your information has been submitted successfully.'}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
          <Button onClick={() => router.push('/gallery')}>View Gallery</Button>
          <Button
            variant="outline"
            onClick={() => {
              setUploadComplete(false)
              setDidUpload(false)
              setIsUploading(true)
            }}
          >
            Upload More Media
          </Button>
        </div>
      </div>
    )
  }

  if (isUploading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">
              Upload Your Media (Optional)
            </h3>
            <p className="text-sm text-muted-foreground">
              Uploading as <span className="font-medium">{userData.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span>Photos (up to 8MB)</span>
          </div>
          <div className="flex items-center gap-1">
            <Film className="h-4 w-4" />
            <span>Videos (up to 16MB)</span>
          </div>
        </div>

        <UploadDropzone<OurFileRouter, 'mediaUploader'>
          endpoint="mediaUploader"
          onClientUploadComplete={(res) => {
            if (res && res.length > 0) {
              setDidUpload(true)
            } else {
              setDidUpload(false)
            }
            setUploadComplete(true)
            toast.success('Media uploaded successfully!')
            router.refresh()
          }}
          onUploadError={(error: Error) => {
            toast.error(`Error uploading: ${error.message}`)
          }}
          config={{
            mode: 'auto',
          }}
          appearance={{
            container: 'border-dashed',
            button: 'bg-primary hover:bg-primary/90 px-6 py-2.5',
          }}
          content={{
            label: `Drop your photos and videos here, or click to browse`,
          }}
          input={{
            name: userData.name,
          }}
        />

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setDidUpload(false)
            setUploadComplete(true)
            toast.success('Information submitted successfully!')
          }}
        >
          Finish & Continue (No Upload)
        </Button>
      </div>
    )
  }
}
