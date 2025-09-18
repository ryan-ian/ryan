"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Briefcase, Building2, User, ArrowRight } from 'lucide-react'

export default function CompleteProfilePage() {
  const { user, completeProfile, needsProfileCompletion } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    organization: '',
    position: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if user doesn't need profile completion
    if (!user) {
      router.push('/signin')
      return
    }
    
    if (!needsProfileCompletion) {
      router.push('/conference-room-booking')
      return
    }
  }, [user, needsProfileCompletion, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.organization.trim() || !formData.position.trim()) {
        setError('Please fill in all required fields')
        return
      }

      const result = await completeProfile(formData.organization.trim(), formData.position.trim())
      
      if (result.success) {
        // Redirect to dashboard
        router.push('/conference-room-booking')
      } else {
        setError(result.message)
      }
    } catch (error) {
      console.error('Profile completion error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "pl-12 h-12 text-base border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"

  if (!user || !needsProfileCompletion) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We need a bit more information to complete your account setup
          </p>
        </div>

        <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm dark:bg-slate-800/80">
          <CardHeader className="text-center space-y-2 pb-6">
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Welcome, {user.name}!
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Please provide your organization and position details
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="organization" className="text-slate-700 font-semibold text-base dark:text-slate-200">
                  Organization
                </Label>
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
                <Label htmlFor="position" className="text-slate-700 font-semibold text-base dark:text-slate-200">
                  Position
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    placeholder="e.g., Manager, Developer, Analyst"
                    value={formData.position}
                    onChange={handleChange}
                    className={inputClasses}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Completing Profile...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Complete Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This information helps us provide a better experience tailored to your organization
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
