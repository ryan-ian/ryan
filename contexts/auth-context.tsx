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
  signInWithGoogle: () => Promise<void>
  signup: (email: string, password: string, userData: Omit<AuthUser, 'id' | 'email' | 'role'>) => Promise<{ success: boolean; needsVerification?: boolean }>
  completeProfile: (organization: string, position: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>
  resetPassword: (newPassword: string) => Promise<{ success: boolean; message: string }>
  loading: boolean
  needsProfileCompletion: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to check if profile needs completion
const checkProfileCompletion = (user: AuthUser): boolean => {
  return user.organization === 'OAuth - Pending' || user.position === 'OAuth - Pending'
}

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
          organization: session.user.user_metadata?.organization || 'Unassigned',
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
      organization: data.organization,
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
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)

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
          setNeedsProfileCompletion(authUser ? checkProfileCompletion(authUser) : false)
        } else if (token) {
          // Try to use the token from localStorage if no active session
          try {
            const { data, error } = await supabase.auth.getUser(token)
            
            if (!error && data.user) {
              const authUser = await mapSupabaseUser({ user: data.user, access_token: token } as Session)
              setUser(authUser)
              setNeedsProfileCompletion(authUser ? checkProfileCompletion(authUser) : false)
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
              setNeedsProfileCompletion(authUser ? checkProfileCompletion(authUser) : false)
              
              // Store token on sign in
              if (session.access_token) {
                localStorage.setItem("auth-token", session.access_token)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setNeedsProfileCompletion(false)
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

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error("Google OAuth error:", error.message)
        throw error
      }
      
      // The redirect will handle the rest of the flow
    } catch (error) {
      console.error("Google sign-in error:", error)
      throw error
    }
  }

  const completeProfile = async (organization: string, position: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!user) {
        return { success: false, message: "No authenticated user found" }
      }

      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        return { success: false, message: "No valid session found" }
      }

      // Update the user profile via API
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ organization, position })
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, message: error.message || 'Failed to update profile' }
      }

      // Update local user state
      const updatedUser = { ...user, organization, position }
      setUser(updatedUser)
      setNeedsProfileCompletion(false)

      return { success: true, message: 'Profile completed successfully' }
    } catch (error) {
      console.error("Profile completion error:", error)
      return { success: false, message: 'An unexpected error occurred' }
    }
  }
  
  const signup = async (
    email: string,
    password: string,
    userData: Omit<AuthUser, 'id' | 'email' | 'role'>
  ): Promise<{ success: boolean; needsVerification?: boolean }> => {
    try {
      // Create auth user with metadata that will be used by the database trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            organization: userData.organization,
            position: userData.position,
            role: 'user' // Add role to metadata as well
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-success`
        }
      })

      if (authError || !authData.user) {
        console.error("Signup error:", authError)
        return { success: false }
      }

      // Check if email confirmation is required
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        // Email verification is required
        return { success: true, needsVerification: true }
      }

      // The database trigger will create the user profile automatically
      // User will be set by the auth state change listener
      return { success: true, needsVerification: false }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("auth-token")
    setUser(null)
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error("Forgot password error:", error.message)
        return { 
          success: false, 
          message: "Failed to send reset email. Please try again." 
        }
      }

      return { 
        success: true, 
        message: "Password reset instructions have been sent to your email." 
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      return { 
        success: false, 
        message: "An unexpected error occurred. Please try again." 
      }
    }
  }

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      })

      if (error) {
        console.error("Reset password error:", error.message)
        return { 
          success: false, 
          message: "Failed to reset password. Please try again." 
        }
      }

      return { 
        success: true, 
        message: "Password has been successfully reset." 
      }
    } catch (error) {
      console.error("Reset password error:", error)
      return { 
        success: false, 
        message: "An unexpected error occurred. Please try again." 
      }
    }
  }

  return <AuthContext.Provider value={{ 
    user, 
    login, 
    signInWithGoogle, 
    signup, 
    completeProfile, 
    logout, 
    forgotPassword, 
    resetPassword, 
    loading, 
    needsProfileCompletion 
  }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
