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
import { Users, User, Mail, Lock, Briefcase, Building2, ArrowLeft, Clock, UserPlus, CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button"
import { MicrosoftSignInButton } from "@/components/auth/microsoft-signin-button"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    position: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const result = await signup(
        formData.email,
        formData.password,
        {
          name: formData.name,
          organization: formData.organization,
          position: formData.position
        }
      )

      if (result.success) {
        if (result.needsVerification) {
          // Redirect to email verification page
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        } else {
          // User is automatically logged in (email confirmation disabled)
          router.push("/conference-room-booking")
        }
      } else {
        setError("Failed to create account. Please try again.")
      }
    } catch (err) {
      setError("An error occurred during signup")
      console.error(err)
    }

    setLoading(false)
  }

  const inputClasses = "pl-12 pr-4 py-2.5 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 rounded-xl text-base font-medium hover:bg-slate-50 focus:bg-white dark:bg-slate-700/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:focus:border-teal-400"

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Left Side - Hero Section with Image and Branding */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Background Image with Blur Effect */}
        <div className="absolute inset-0">
          <Image
            src="/3d-rendering-business-meeting-room-office-building.jpg"
            alt="Modern 3D conference room"
            fill
            className="object-cover filter blur-[1px]"
            priority
          />
          {/* Enhanced Gradient Overlay - Responsive to theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-teal-900/80 dark:from-slate-950/90 dark:via-slate-900/85 dark:to-teal-950/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent dark:from-slate-950/95 dark:via-transparent dark:to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          <div className="max-w-lg space-y-8 animate-fadeIn">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4 mb-12">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-md border border-white/10 shadow-2xl dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15">
                <Users className="h-10 w-10 text-teal-300 dark:text-teal-200" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Conference Hub</h1>
                <p className="text-teal-200 text-base font-medium dark:text-teal-100">Smart Room Booking Platform</p>
              </div>
            </div>

            {/* Enhanced Value Proposition */}
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl font-bold leading-tight tracking-tight mb-6">
                  Join Thousands of Teams Already Using Conference Hub
                </h2>
                <p className="text-xl text-white/90 leading-relaxed font-light">
                  Transform how your organization manages meeting spaces with our comprehensive booking platform.
                </p>
              </div>

              {/* Enhanced Benefits */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <CheckCircle className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Eliminate double bookings forever</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <Star className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Increase space utilization by 40%</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <Clock className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Save 2+ hours per week on scheduling</span>
                </div>
              </div>

              {/* Enhanced Social Proof */}
              <div className="pt-10 border-t border-white/20 dark:border-white/25">
                <p className="text-base text-white/70 mb-6 font-medium dark:text-white/80">Trusted by teams at</p>
                <div className="flex items-center gap-8 text-white/60 dark:text-white/70">
                  <span className="text-base font-semibold">Fortune 500 Companies</span>
                  <span className="text-white/40 dark:text-white/50">•</span>
                  <span className="text-base font-semibold">Startups</span>
                  <span className="text-white/40 dark:text-white/50">•</span>
                  <span className="text-base font-semibold">Universities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Signup Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 h-full overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Header - Only visible on small screens */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg dark:shadow-teal-500/25">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Conference Hub</h1>
                <p className="text-teal-600 text-base font-medium dark:text-teal-400">Smart Room Booking</p>
              </div>
            </div>
            {/* Enhanced Mobile benefits */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-200/50 dark:from-slate-800/50 dark:to-slate-700/50 dark:border-slate-600/50">
              <p className="text-base text-slate-700 font-medium mb-4 dark:text-slate-300">
                Join thousands of teams already using Conference Hub to:
              </p>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                  <span>Eliminate double bookings</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                  <span>Increase space utilization</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-teal-500 dark:text-teal-400" />
                  <span>Save time on scheduling</span>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-3xl animate-slide-up dark:bg-slate-800/90 dark:shadow-slate-900/50">
            <CardHeader className="text-center pb-4 pt-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:shadow-teal-500/25 dark:hover:shadow-teal-500/40">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight dark:text-slate-100">Join Conference Hub</CardTitle>
              <CardDescription className="text-slate-600 text-base font-medium dark:text-slate-300">Create your account to start booking conference rooms</CardDescription>
            </CardHeader>
          <CardContent className="pb-6 px-8">
            {/* OAuth Buttons */}
            <div className="space-y-4">
              <GoogleOAuthButton text="Sign up with Google" />
              <MicrosoftSignInButton variant="outline" className="text-slate-700 dark:text-slate-300">
                Sign up with Microsoft
              </MicrosoftSignInButton>
            </div>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500 font-medium dark:bg-slate-800 dark:text-slate-400">
                  Or create account with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-semibold text-base dark:text-slate-200">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                id="name"
                name="name"
                placeholder="John Smith"
                value={formData.name}
                onChange={handleChange}
                required
                    className={inputClasses}
              />
            </div>
              </div>

            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-base dark:text-slate-200">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@company.com"
                value={formData.email}
                onChange={handleChange}
                required
                    className={inputClasses}
              />
            </div>
              </div>

            <div className="space-y-2">
                <Label htmlFor="organization" className="text-slate-700 font-semibold text-base dark:text-slate-200">Organization</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10 dark:text-slate-500" />
                  <Input
                    id="organization"
                    name="organization"
                    type="text"
                    placeholder="Enter your organization name"
                    value={formData.organization}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700 font-semibold text-base dark:text-slate-200">Position</Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                id="position"
                name="position"
                placeholder="Manager"
                value={formData.position}
                onChange={handleChange}
                required
                    className={inputClasses}
              />
            </div>
              </div>
              
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-base dark:text-slate-200">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                required
                    className={inputClasses}
              />
            </div>
              </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-base dark:text-slate-200">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                    className={inputClasses}
              />
            </div>
              </div>

            {error && (
                <div>
                  <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200 rounded-xl dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
                </div>
            )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-3 text-base shadow-lg shadow-teal-500/25 transition-all duration-300 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] rounded-xl dark:shadow-teal-500/20 dark:hover:shadow-teal-500/30"
                disabled={loading}
              >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
            
            <div className="mt-6 pt-6 border-t border-slate-200 text-center space-y-4 dark:border-slate-600">
              <div>
                <p className="text-sm text-slate-600 mb-2 font-medium dark:text-slate-400">Already have an account?</p>
                <Link
                  href="/login"
                  className="inline-block text-teal-600 hover:text-teal-700 font-semibold text-base transition-all duration-300 hover:scale-105 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  Sign In
                </Link>
              </div>
              <Link
                href="/"
                className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors gap-2 text-base font-medium dark:text-slate-400 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
