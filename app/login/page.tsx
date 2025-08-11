"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ArrowLeft, Users, Calendar, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { LoginForm } from "@/components/forms/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-4rem)] flex">
        {/* Left Side - Hero Section with Image and Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/room-business-meeting.jpg"
              alt="Modern conference room"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/90 via-brand-navy-800/80 to-brand-teal-600/70"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            <div className="max-w-md">
              {/* Logo/Brand */}
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm">
                  <Users className="h-8 w-8 text-brand-teal-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Conference Hub</h1>
                  <p className="text-brand-teal-200 text-sm">Admin Portal</p>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold leading-tight mb-4">
                    Manage Your Organization's Meeting Spaces
                  </h2>
                  <p className="text-lg text-white/90 leading-relaxed">
                    Access powerful administrative tools to oversee room bookings, manage resources, and optimize workspace utilization.
                  </p>
                </div>

                {/* Admin Features */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brand-teal-500/20">
                      <Calendar className="h-5 w-5 text-brand-teal-300" />
                    </div>
                    <span className="text-white/90">Comprehensive booking oversight</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brand-teal-500/20">
                      <MapPin className="h-5 w-5 text-brand-teal-300" />
                    </div>
                    <span className="text-white/90">Room and resource management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-brand-teal-500/20">
                      <Clock className="h-5 w-5 text-brand-teal-300" />
                    </div>
                    <span className="text-white/90">Usage analytics and reporting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Login Form */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="max-w-lg w-full">
            {/* Mobile Header - Only visible on small screens */}
            <div className="lg:hidden text-center mb-10">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg dark:shadow-teal-500/25">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Conference Hub</h1>
                  <p className="text-teal-600 text-base font-medium dark:text-teal-400">Admin Portal</p>
                </div>
              </div>
            </div>

            <Card className="border-0 bg-white/90 backdrop-blur-xl shadow-2xl shadow-slate-200/50 rounded-3xl animate-slide-up dark:bg-slate-800/90 dark:shadow-slate-900/50">
              <CardHeader className="space-y-2 text-center pb-8 pt-10">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 dark:shadow-teal-500/25 dark:hover:shadow-teal-500/40">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Admin Sign In</CardTitle>
                <CardDescription className="text-slate-600 text-lg font-medium dark:text-slate-300">Access the administrative dashboard</CardDescription>
              </CardHeader>
              <CardContent className="pb-10 px-10">
                <LoginForm />

                <div className="mt-8 pt-8 border-t border-slate-200 text-center space-y-6 dark:border-slate-600">
                  <div>
                    <p className="text-base text-slate-600 mb-3 font-medium dark:text-slate-400">Need user access?</p>
                    <Link
                      href="/user-login"
                      className="inline-block text-teal-600 hover:text-teal-700 font-semibold text-lg transition-all duration-300 hover:scale-105 dark:text-teal-400 dark:hover:text-teal-300"
                    >
                      User Login
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
    </MainLayout>
  )
}
