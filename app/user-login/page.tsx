"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/forms/login-form"

export default function UserLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-md w-full">
        <Card className="border-border bg-card shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">User Login</CardTitle>
            <CardDescription>Sign in to access the Conference Hub</CardDescription>
          </CardHeader>
          
          <CardContent className="pb-8">
            <LoginForm isAdmin={false} redirectPath="/conference-room-booking" />
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
  )
}
