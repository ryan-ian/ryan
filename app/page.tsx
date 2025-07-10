import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Calendar, Users, Shield } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-gray-900">Conference Hub</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional conference room booking and management system for modern workplaces
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                For Users
              </CardTitle>
              <CardDescription>Book and manage conference rooms with ease</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Browse and book available rooms
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Manage your bookings
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  View room details and amenities
                </li>
              </ul>
              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/user-login">User Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                For Administrators
              </CardTitle>
              <CardDescription>Manage the entire conference room system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Manage rooms and resources
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User and booking management
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Analytics and reporting
                </li>
              </ul>
              <div className="pt-4">
                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href="/login">Admin Login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">New to Conference Hub?</p>
          <Button asChild variant="secondary">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
