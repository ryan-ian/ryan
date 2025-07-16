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
import { Users, Mail, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UserLoginPage() {
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

    // Regular user login (no admin check)
    const success = await login(email, password)
    if (success) {
      router.push("/conference-room-booking")
    } else {
      setError("Invalid credentials. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
      
      <div className="z-10 w-full max-w-md">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-3 rounded-full bg-primary/10 text-primary shadow-lg">
                <Users className="h-8 w-8" />
              </div>
          </div>
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to book conference rooms</CardDescription>
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
                placeholder="your.email@company.com"
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
            
            <div className="mt-6 pt-6 border-t border-border/50 text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Don't have an account?</p>
                <Link 
                  href="/signup" 
                  className="inline-block text-primary hover:text-primary/80 font-medium transition-colors"
                >
              Create Account
            </Link>
          </div>
              
              <div className="text-center">
                <Link 
                  href="/" 
                  className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors gap-1 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
            </Link>
              </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
