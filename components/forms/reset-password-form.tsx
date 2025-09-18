"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, CheckCircle2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { resetPassword } = useAuth()
  const router = useRouter()

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setValidationErrors([])

    // Validate password
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setLoading(false)
      return
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      // Update password directly with Supabase - session should already be set
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      })

      if (error) {
        console.error("Reset password error:", error.message)
        setMessage("Failed to reset password. Please try again.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setMessage("Password has been successfully reset.")
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      console.error("Reset password error:", error)
      setMessage("An unexpected error occurred. Please try again.")
    }
    
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
            Password Reset Successfully!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {message}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Redirecting you to the login page in a few seconds...
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="password" className="text-slate-700 font-semibold text-base dark:text-slate-200">
          New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 z-10" />
          <PasswordInput
            id="password"
            placeholder="Enter your new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-12 pr-12 py-3 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 rounded-xl text-base font-medium hover:bg-slate-50 focus:bg-white dark:bg-slate-700/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:focus:border-teal-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="confirmPassword" className="text-slate-700 font-semibold text-base dark:text-slate-200">
          Confirm New Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 z-10" />
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-12 pr-12 py-3 bg-slate-50/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300 rounded-xl text-base font-medium hover:bg-slate-50 focus:bg-white dark:bg-slate-700/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-700 dark:focus:bg-slate-700 dark:focus:border-teal-400"
          />
        </div>
      </div>

      {/* Password Requirements */}
      {password && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Requirements:</p>
          <div className="space-y-1">
            {[
              { text: "At least 8 characters", test: password.length >= 8 },
              { text: "One uppercase letter", test: /[A-Z]/.test(password) },
              { text: "One lowercase letter", test: /[a-z]/.test(password) },
              { text: "One number", test: /[0-9]/.test(password) }
            ].map((req, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${req.test ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className={req.test ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                  {req.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200 rounded-xl dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
        {loading ? "Resetting Password..." : "Reset Password"}
      </Button>
    </form>
  )
}
