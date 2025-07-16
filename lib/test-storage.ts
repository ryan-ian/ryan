import { supabase } from './supabase'

/**
 * Tests the Supabase storage bucket configuration
 * This can be run to verify that the bucket is properly set up
 */
export async function testStorageSetup() {
  const results = {
    bucketExists: false,
    bucketIsPublic: false,
    canUpload: false,
    canGetPublicUrl: false,
    canDelete: false,
    details: {} as any
  }
  
  try {
    console.log('Testing Supabase storage configuration...')
    
    // 1. Check if bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      results.details.listBucketsError = listError
      return results
    }
    
    const bucketName = 'conference-hub'
    const bucket = buckets.find(b => b.name === bucketName)
    
    results.bucketExists = !!bucket
    console.log(`Bucket '${bucketName}' exists:`, results.bucketExists)
    
    if (!results.bucketExists) {
      console.log('Bucket does not exist. Please create it first.')
      return results
    }
    
    // 2. Check if bucket is public
    results.bucketIsPublic = bucket.public
    console.log(`Bucket '${bucketName}' is public:`, results.bucketIsPublic)
    
    // 3. Test upload
    const testFileName = `test-${Date.now()}.txt`
    const testContent = 'This is a test file to verify storage permissions.'
    const testFile = new Blob([testContent], { type: 'text/plain' })
    
    console.log(`Attempting to upload test file: ${testFileName}`)
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(`test/${testFileName}`, testFile, {
        cacheControl: '3600',
        upsert: true
      })
    
    results.canUpload = !uploadError
    results.details.uploadResult = uploadData
    
    if (uploadError) {
      console.error('Upload test failed:', uploadError)
      results.details.uploadError = uploadError
      return results
    }
    
    console.log('Upload test successful:', uploadData)
    
    // 4. Test getting public URL
    const { data: urlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(`test/${testFileName}`)
    
    results.canGetPublicUrl = !!urlData.publicUrl
    results.details.publicUrl = urlData.publicUrl
    
    console.log('Public URL test successful:', urlData.publicUrl)
    
    // 5. Test deletion
    const { error: deleteError } = await supabase
      .storage
      .from(bucketName)
      .remove([`test/${testFileName}`])
    
    results.canDelete = !deleteError
    
    if (deleteError) {
      console.error('Delete test failed:', deleteError)
      results.details.deleteError = deleteError
    } else {
      console.log('Delete test successful')
    }
    
    // Final result
    const allTests = Object.entries(results)
      .filter(([key]) => key !== 'details')
      .every(([_, value]) => value === true)
    
    console.log('All tests passed:', allTests)
    console.log('Test results:', results)
    
    return results
  } catch (error) {
    console.error('Error testing storage setup:', error)
    results.details.unexpectedError = error
    return results
  }
} 