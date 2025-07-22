"use client"

import type React from "react"
import { useContext, useState, useEffect } from "react"
import { createContext } from 'react'
import type { AuthUser } from "@/types"
import { supabase } from "@/lib/supabase"
import { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string, isAdmin?: boolean) => Promise<boolean>
  signup: (email: string, password: string, userData: Omit<AuthUser, 'id' | 'email' | 'role'>) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to convert Supabase user to our AuthUser type
const mapSupabaseUser = async (session: Session | null): Promise<AuthUser | null> => {
  if (!session?.user) return null
  
  try {
    // Fetch the user's profile data from our users table
    // Use a direct approach that avoids complex RLS policies
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    if (error) {
      console.error("Error fetching user data:", error.message || error)
      
      // If we get a recursion error, try a simpler approach
      if (error.message?.includes('recursion')) {
        // Create a basic user object from the session
        return {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user',
          department: session.user.user_metadata?.department || 'Unassigned',
          position: session.user.user_metadata?.position || 'Unassigned'
        }
      }
      return null
    }
    
    if (!data) {
      console.error("No user data found")
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department: data.department,
      position: data.position
    }
  } catch (error) {
    console.error("Exception in mapSupabaseUser:", error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing token in localStorage
        const token = localStorage.getItem("auth-token")
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const authUser = await mapSupabaseUser(session)
          setUser(authUser)
        } else if (token) {
          // Try to use the token from localStorage if no active session
          try {
            const { data, error } = await supabase.auth.getUser(token)
            
            if (!error && data.user) {
              const authUser = await mapSupabaseUser({ user: data.user, access_token: token } as Session)
              setUser(authUser)
            } else {
              // Invalid token, remove it
              localStorage.removeItem("auth-token")
            }
          } catch (tokenError) {
            console.error("Error using stored token:", tokenError)
            localStorage.removeItem("auth-token")
          }
        }
        
        setLoading(false)
        
        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              const authUser = await mapSupabaseUser(session)
              setUser(authUser)
              
              // Store token on sign in
              if (session.access_token) {
                localStorage.setItem("auth-token", session.access_token)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              localStorage.removeItem("auth-token")
            }
          }
        )
        
        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setLoading(false)
      }
    }
    
    initializeAuth()
  }, [])

  const login = async (email: string, password: string, isAdmin: boolean = false): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error("Login error:", error.message)
        return false
      }
      
      // Store the token in localStorage
      if (data.session?.access_token) {
        localStorage.setItem("auth-token", data.session.access_token)
      }
      
      // Fetch user profile to check role
      const authUser = await mapSupabaseUser(data.session)
      
      if (!authUser) {
        console.error("Failed to fetch user profile after login")
        return false
      }
      
      // If this is an admin login, verify the user has admin role
      if (isAdmin && authUser.role !== 'admin') {
        // Sign out if not admin
        await supabase.auth.signOut()
        localStorage.removeItem("auth-token")
        return false
      }
      
      setUser(authUser)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }
  
  const signup = async (
    email: string, 
    password: string, 
    userData: Omit<AuthUser, 'id' | 'email' | 'role'>
  ): Promise<boolean> => {
    try {
      // Create auth user with metadata that will be used by the database trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            department: userData.department,
            position: userData.position,
            role: 'user' // Add role to metadata as well
          }
        }
      })
      
      if (authError || !authData.user) {
        console.error("Signup error:", authError)
        return false
      }
      
      // The database trigger will create the user profile automatically
      // User will be set by the auth state change listener
      return true
    } catch (error) {
      console.error("Signup error:", error)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("auth-token")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, signup, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
