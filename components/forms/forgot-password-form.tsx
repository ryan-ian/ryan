"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const result = await forgotPassword(email)
    
    setSuccess(result.success)
    setMessage(result.message)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Email Sent!
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <p>Didn't receive the email? Check your spam folder or</p>
          <button
            onClick={() => {
              setSuccess(false)
              setMessage("")
              setEmail("")
            }}
            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
          >
            try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="email" className="text-slate-700 font-semibold text-base dark:text-slate-200">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-12 pr-4 py-3 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 rounded-xl text-base font-medium hover:bg-slate-50 focus:bg-white dark:bg-slate-700/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:focus:border-teal-400"
          />
        </div>
      </div>
      
      {message && !success && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200 rounded-xl dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{message}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold py-4 text-lg shadow-xl shadow-teal-500/25 transition-all duration-300 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] rounded-xl dark:shadow-teal-500/20 dark:hover:shadow-teal-500/30"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Reset Instructions"}
      </Button>
    </form>
  )
}
