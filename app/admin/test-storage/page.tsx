"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function TestStoragePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runTest = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/test-storage", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to run storage test")
      }

      const data = await response.json()
      setResults(data)

      if (Object.entries(data)
        .filter(([key]) => key !== 'details')
        .every(([_, value]) => value === true)) {
        toast({
          title: "Storage Test Passed",
          description: "All storage tests passed successfully!",
          variant: "default",
        })
      } else {
        toast({
          title: "Storage Test Failed",
          description: "Some storage tests failed. Check the results for details.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error running storage test:", error)
      toast({
        title: "Error",
        description: "Failed to run storage test. See console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectUpload = async () => {
    setIsLoading(true)

    try {
      // Create a test file
      const testContent = 'This is a direct test file.'
      const testFile = new File([testContent], "direct-test.txt", { type: "text/plain" })
      
      // Create form data
      const formData = new FormData()
      formData.append("file", testFile)
      
      // Upload the file
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.details || "Upload failed")
      }
      
      toast({
        title: "Direct Upload Test Passed",
        description: `File uploaded successfully. URL: ${data.url}`,
        variant: "default",
      })
    } catch (error) {
      console.error("Direct upload test error:", error)
      toast({
        title: "Direct Upload Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Storage Test</h2>
          <p className="text-muted-foreground">Test Supabase storage configuration</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Storage Test</CardTitle>
          <CardDescription>Run tests to verify that Supabase storage is correctly configured</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex space-x-4">
            <Button onClick={runTest} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Storage Test
            </Button>
            <Button onClick={testDirectUpload} disabled={isLoading} variant="outline">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Direct Upload
            </Button>
          </div>
          
          {results && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              
              <div className="space-y-2">
                {Object.entries(results)
                  .filter(([key]) => key !== 'details')
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      {value ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: {String(value)}</span>
                    </div>
                  ))}
              </div>
              
              {results.details && Object.keys(results.details).length > 0 && (
                <div>
                  <h4 className="text-md font-medium mb-2">Details</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                    {JSON.stringify(results.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 