import { supabase } from './supabase'

/**
 * Sets up the Supabase storage bucket for room images
 * This should be run once during application initialization
 */
export async function setupStorage() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }
    
    const bucketName = 'conference-hub'
    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    // If bucket doesn't exist, create it
    if (!bucketExists) {
      console.log(`Creating storage bucket: ${bucketName}`)
      const { error: createError } = await supabase
        .storage
        .createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        throw createError
      }
      
      console.log(`Storage bucket ${bucketName} created successfully`)
    } else {
      console.log(`Storage bucket ${bucketName} already exists`)
    }
    
    // Update bucket to be public
    const { error: updateError } = await supabase
      .storage
      .updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
    
    if (updateError) {
      console.error('Error updating bucket:', updateError)
      throw updateError
    }
    
    console.log(`Storage bucket ${bucketName} configured successfully`)
    return true
  } catch (error) {
    console.error('Failed to set up storage:', error)
    return false
  }
} 