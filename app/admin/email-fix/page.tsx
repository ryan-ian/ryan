"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function EmailFixPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [results, setResults] = useState<any>(null)

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/fix-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, testEmail: testEmail || undefined })
      })
      
      const data = await response.json()
      setResults({ action, data })
    } catch (error) {
      setResults({ action, error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Configuration Fix Tool</h1>
        <p className="text-muted-foreground">Diagnose and fix email sending issues</p>
      </div>

      <div className="grid gap-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Email Troubleshooting Actions</CardTitle>
            <CardDescription>
              Use these tools to diagnose and fix your email configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => handleAction('diagnose')}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Diagnose Issues
              </Button>
              
              <Button 
                onClick={() => handleAction('auto-fix')}
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Auto-Fix Configuration
              </Button>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Test Email Address</label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => handleAction('test')}
                disabled={isLoading || !testEmail}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Test Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>
                Results: {results.action?.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.error ? (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{results.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Diagnosis Results */}
                  {results.action === 'diagnose' && results.data?.diagnosis && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Environment Variables</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(results.data.diagnosis.env_variables).map(([key, value]) => (
                            <Badge key={key} variant={value ? "default" : "destructive"}>
                              {key}: {value ? "✓" : "✗"}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Current Configuration</h4>
                        <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                          {JSON.stringify(results.data.diagnosis.current_config, null, 2)}
                        </pre>
                      </div>

                      {results.data.diagnosis.provider_detection && (
                        <div>
                          <h4 className="font-medium mb-2">Provider Detection</h4>
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Detected: {results.data.diagnosis.provider_detection.detected}
                            </AlertDescription>
                          </Alert>
                          <pre className="bg-muted p-3 rounded text-sm mt-2 overflow-x-auto">
                            {JSON.stringify(results.data.diagnosis.provider_detection.recommended_config, null, 2)}
                          </pre>
                        </div>
                      )}

                      {results.data.diagnosis.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Suggestions</h4>
                          <ul className="space-y-1">
                            {results.data.diagnosis.suggestions.map((suggestion: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                                <span className="text-sm">{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test Results */}
                  {results.action === 'test' && results.data?.result && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {results.data.result.initialization ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span>Initialization: {results.data.result.initialization ? 'Success' : 'Failed'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {results.data.result.connection ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span>Connection: {results.data.result.connection ? 'Success' : 'Failed'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {results.data.result.sending ? 
                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <span>Email Sending: {results.data.result.sending ? 'Success' : 'Failed'}</span>
                      </div>

                      {results.data.result.errors.length > 0 && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <ul>
                              {results.data.result.errors.map((error: string, index: number) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {/* Auto-fix Results */}
                  {results.action === 'auto-fix' && (
                    <div>
                      {results.data.success ? (
                        <div className="space-y-3">
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{results.data.message}</AlertDescription>
                          </Alert>
                          <div>
                            <h4 className="font-medium mb-2">Recommended Environment Variables:</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                              {Object.entries(results.data.recommended_config).map(([key, value]) => 
                                `${key}=${value}`
                              ).join('\n')}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{results.data.error}</AlertDescription>
                          </Alert>
                          {results.data.suggestions && (
                            <div>
                              <h4 className="font-medium mb-2">Suggestions:</h4>
                              <ul className="space-y-1">
                                {results.data.suggestions.map((suggestion: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                                    <span className="text-sm">{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Common Solutions */}
        <Card>
          <CardHeader>
            <CardTitle>Common Email Configuration Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Gmail Configuration</h4>
              <pre className="bg-muted p-3 rounded text-sm">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password`}
              </pre>
              <p className="text-sm text-muted-foreground mt-2">
                Note: You must use an app-specific password, not your regular Gmail password.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Outlook Configuration</h4>
              <pre className="bg-muted p-3 rounded text-sm">
{`SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-regular-password`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}