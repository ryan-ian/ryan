"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Pass isAdmin=true to enforce admin role check
    const success = await login(email, password, true)
    if (success) {
      router.push("/admin")
    } else {
      setError("Invalid credentials or insufficient permissions. Please try again.")
    }
    setLoading(false)
  }

  return (
    <MainLayout showFooter={false} className="bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-md">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-3 rounded-full bg-primary/10 text-primary shadow-lg">
                  <Shield className="h-8 w-8" />
                </div>
            </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Admin Portal</CardTitle>
              <CardDescription className="text-muted-foreground">Sign in to access the Conference Hub admin panel</CardDescription>
          </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@conferencehub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                      className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all"
                />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                      className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all"
                />
                  </div>
              </div>
              {error && (
                  <div>
                    <Alert variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                  </div>
              )}
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]" 
                  disabled={loading}
                >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
              <div className="mt-8 text-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </MainLayout>
  )
}
