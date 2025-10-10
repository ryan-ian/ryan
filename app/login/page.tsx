"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft, Calendar, MapPin, Clock, Shield } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/forms/login-form"
import Image from "next/image"

export default function UserLoginPage() {
  return (
    <div className="-h-screenf flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Left Side - Hero Section with Image and Branding */}
      <div className="hidden items-center lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image with Blur Effect */}
        <div className="absolute inset-0">
          <Image
            src="/room-business-meeting.jpg"
            alt="Modern conference room"
            fill
            className="object-cover filter blur-[1px]"
            priority
          />
          {/* Enhanced Gradient Overlay - Responsive to theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-teal-900/80 dark:from-slate-950/90 dark:via-slate-900/85 dark:to-teal-950/85"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent dark:from-slate-950/95 dark:via-transparent dark:to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col mt-4 px-16 text-white">
          <div className="max-w-lg space-y-8 animate-fadeIn">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-md border border-white/10 shadow-2xl dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15">
                <Users className="h-10 w-10 text-teal-300 dark:text-teal-200" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Conference Hub</h1>
                <p className="text-teal-200 text-base font-medium dark:text-teal-100">Smart Room Booking Platform</p>
              </div>
            </div>

            {/* Enhanced Value Proposition */}
            <div className="space-y-2">
              <div>
                <h2 className="text-3xl font-bold leading-tight tracking-tight mb-6">
                  Streamline Your Meeting Space Management
                </h2>
                <p className="text-xl text-white/90 leading-relaxed font-light">
                  Book conference rooms, manage resources, and optimize your workspace with our intelligent booking platform.
                </p>
              </div>

              {/* Enhanced Feature Highlights */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <Calendar className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Real-time availability checking</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <MapPin className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Interactive room discovery</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 backdrop-blur-sm border border-white/10 group-hover:border-teal-400/30 transition-all duration-300 dark:from-teal-400/25 dark:to-teal-600/25 dark:border-white/15 dark:group-hover:border-teal-400/40">
                    <Clock className="h-6 w-6 text-teal-300 dark:text-teal-200" />
                  </div>
                  <span className="text-white/90 text-lg font-medium dark:text-white/95">Automated booking management</span>
                </div>
              </div>

              {/* Trust Indicators */}
              {/* <div className="pt-10 border-t border-white/20 dark:border-white/25">
                <p className="text-base text-white/70 mb-6 font-medium dark:text-white/80">Trusted by teams at</p>
                <div className="flex items-center gap-8 text-white/60 dark:text-white/70">
                  <span className="text-base font-semibold">Fortune 500 Companies</span>
                  <span className="text-white/40 dark:text-white/50">•</span>
                  <span className="text-base font-semibold">Startups</span>
                  <span className="text-white/40 dark:text-white/50">•</span>
                  <span className="text-base font-semibold">Universities</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Enhanced Login Form */}
      <div className="w-full h-screen lg:w-1/2 flex items-center  justify-center p-6 lg:p-12 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen lg:min-h-0">
        <div className="w-full max-w-lg">
          {/* Mobile Header - Only visible on small screens */}
          {/* <div className="lg:hidden text-center mb-10">
            {/* <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg dark:shadow-teal-500/25">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Conference Hub</h1>
                <p className="text-teal-600 text-base font-medium dark:text-teal-400">Smart Room Booking</p>
              </div>
            </div> */}
            {/* Enhanced Mobile value proposition */}
            {/* <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-slate-50 border border-teal-200/50 dark:from-slate-800/50 dark:to-slate-700/50 dark:border-slate-600/50">
              <p className="text-base text-slate-700 font-medium dark:text-slate-300">
                Streamline your meeting space management with real-time availability and automated booking.
              </p>
            </div> */}
          {/* </div> */} 

          <Card className=" shadow-xl  border-0 bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-3xl animate-slide-up dark:bg-slate-800/90 dark:shadow-slate-900/50">
            <CardHeader className="space-y-2 text-center pb-8 pt-8">
              {/* <div className="flex justify-center mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 dark:shadow-teal-500/25 dark:hover:shadow-teal-500/40">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div> */}
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome Back</CardTitle>
              <CardDescription className="text-slate-600 text-lg font-medium dark:text-slate-300">Sign in to access your workspace</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-6 lg:px-10">
              <LoginForm />

              <div className="mt-2 pt-2 border-t border-slate-200 text-center space-y-6 dark:border-slate-600">
                <div>
                  <p className="text-base text-slate-600 mb-3 font-medium dark:text-slate-400">Don't have an account? 
                    <span>
                    <Link
                    href="/signup"
                    className="inline-block text-teal-600 hover:text-teal-700 font-semibold text-sm transition-all duration-300 hover:scale-105 pl-1 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    Create Account
                  </Link>
                    </span>
                  </p>
                  
                </div>
                {/* <Link
                  href="/"
                  className="inline-flex items-center text-slate-500 hover:text-slate-700 transition-colors gap-2 text-base font-medium dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back to Home</span>
                </Link> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
