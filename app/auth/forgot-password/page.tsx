"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form"
import Image from "next/image"

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Left Side - Hero Section with Image and Branding */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
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
        <div className="relative z-10 flex flex-col justify-center px-16 py-20 text-white">
          {/* Logo and Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/30">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
                  Conference Hub
                </h1>
                <p className="text-teal-200 text-lg font-medium">Smart Room Booking Platform</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-md">
            <h2 className="text-5xl font-bold mb-8 leading-tight">
              Secure Account Recovery
            </h2>
            <p className="text-xl text-slate-200 mb-10 leading-relaxed">
              Forgot your password? No problem. We'll send you a secure link to reset your password and get you back to managing your workspace.
            </p>

            {/* Feature List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Secure Reset Process</h3>
                  <p className="text-slate-300">Email-based verification with encrypted reset tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Quick Recovery</h3>
                  <p className="text-slate-300">Reset your password and regain access in minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Account Protection</h3>
                  <p className="text-slate-300">Your account remains secure throughout the process</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm mb-4">Trusted by teams at</p>
            <div className="flex gap-8 text-slate-500 text-sm font-medium">
              <span>Fortune 500 Companies</span>
              <span>•</span>
              <span>Startups</span>
              <span>•</span>
              <span>Universities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl shadow-slate-900/10 bg-white/95 backdrop-blur-sm dark:bg-slate-800/95 dark:shadow-slate-950/20">
            <CardHeader className="pb-8 pt-10 px-10">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.414-6.414a6 6 0 015.743-7.743z" />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-slate-900 mb-3 dark:text-slate-100">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center text-slate-600 text-lg leading-relaxed dark:text-slate-400">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-10">
              <ForgotPasswordForm />

              <div className="mt-8 pt-8 border-t border-slate-200 text-center space-y-6 dark:border-slate-600">
                <div>
                  <p className="text-base text-slate-600 mb-3 font-medium dark:text-slate-400">Remember your password?</p>
                  <Link
                    href="/login"
                    className="inline-block text-teal-600 hover:text-teal-700 font-semibold text-lg transition-all duration-300 hover:scale-105 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    Back to Sign In
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
