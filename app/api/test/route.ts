import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test the Supabase connection
    const { data, error } = await supabase.from('facilities').select('count').limit(1)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'API is working correctly', data })
  } catch (err) {
    console.error('Error in test endpoint:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 