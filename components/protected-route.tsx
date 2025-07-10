"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "manager" | "user"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (requiredRole === "admin" && user.role !== "admin") {
        router.push("/conference-room-booking")
        return
      }

      if (requiredRole === "manager" && !["admin", "manager"].includes(user.role)) {
        router.push("/conference-room-booking")
        return
      }
    }
  }, [user, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole === "admin" && user.role !== "admin") {
    return null
  }

  if (requiredRole === "manager" && !["admin", "manager"].includes(user.role)) {
    return null
  }

  return <>{children}</>
}
