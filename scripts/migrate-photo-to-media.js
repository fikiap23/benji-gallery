// Migration script to convert Photos to Media
// Run this after applying the Prisma schema changes with prisma migrate dev
// Usage: node scripts/migrate-photo-to-media.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migratePhotosToMedia() {
  console.log('Starting migration of Photos to Media...')

  try {
    // 1. Get all photos from the old table
    const photos = await prisma.photo.findMany()
    console.log(`Found ${photos.length} photos to migrate`)

    // 2. Insert each photo as a media item with type="image"
    let successCount = 0
    let errorCount = 0

    for (const photo of photos) {
      try {
        await prisma.media.create({
          data: {
            id: photo.id, // Preserve the original ID
            url: photo.url,
            name: photo.name,
            likes: photo.likes,
            createdAt: photo.createdAt,
            type: 'image', // All existing photos are images
            fileType: 'image/jpeg', // Assume JPEG for existing photos
          }
        })
        successCount++
      } catch (error) {
        console.error(`Error migrating photo ID ${photo.id}:`, error)
        errorCount++
      }
    }

    console.log(`Migration completed:`)
    console.log(`- ${successCount} photos successfully migrated to media`)
    console.log(`- ${errorCount} photos failed to migrate`)

  } catch (error) {
    console.error('Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migratePhotosToMedia()
  .then(() => {
    console.log('Migration script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration script encountered an error:', error)
    process.exit(1)
  }) 