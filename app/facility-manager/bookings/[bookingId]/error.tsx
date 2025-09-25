"use client"

import { useEffect } from "react"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BookingDetailsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Booking details page error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an error while loading the booking details. This could be due to a network issue or the booking not being found.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Error Details:</h4>
            <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
              {error.message}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/facility-manager/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bookings
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



