import { createUploadthing, type FileRouter } from "uploadthing/next"
import { db } from "@/lib/db"
import { z } from "zod"

// Create new UploadThing instance
const f = createUploadthing()

export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: "128MB", maxFileCount: 100 },
    video: { maxFileSize: "8GB", maxFileCount: 100 }
  })
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
      })
    )
    .middleware(async ({ input }) => {
      // Log input data
      console.log("Middleware received input:", input);
      
      // Return the metadata - whatever you return here is passed to onUploadComplete
      return {
        userName: input.name,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete with file:", file.name);
      console.log("File type:", file.type);
      console.log("Metadata in onUploadComplete:", metadata);
      
      // Determine if it's a video or image
      const isVideo = file.type.startsWith('video/');
      
      try {
        // Use file.url for now, but prepare for migration to file.ufsUrl
        const fileUrl = file.ufsUrl || file.url;
        
        if (!fileUrl) {
          throw new Error("No URL available for uploaded file");
        }
        
        // Save to database using the Media model
        const savedMedia = await db.media.create({
          data: {
            url: fileUrl,
            name: metadata.userName || "Unknown User",
            type: isVideo ? "video" : "image",
            fileType: file.type,
            size: file.size,
            // For videos, we'll update thumbnails later if needed
            thumbnail: null,
          },
        });
        
        console.log(`Successfully saved ${isVideo ? 'video' : 'image'} to database:`, savedMedia);
        
        return { 
          uploadedBy: metadata.userName,
          mediaId: savedMedia.id,
          mediaType: isVideo ? "video" : "image",
          url: fileUrl
        };
      } catch (dbError) {
        console.error("Database error:", dbError);
        throw new Error("Failed to save to database: " + (dbError as Error).message);
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

