"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CreditCard, AlertCircle, CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import type { Room } from "@/types"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (paymentData: any) => void
  onError: (error: string) => void
  bookingData: {
    room_id: string
    title: string
    description?: string
    start_time: string
    end_time: string
  }
  room: Room
}

declare global {
  interface Window {
    PaystackPop: any
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  bookingData,
  room
}: PaymentModalProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'ready' | 'processing' | 'verifying' | 'success' | 'error'>('ready')
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentData, setPaymentData] = useState<any>(null)

  // Calculate payment amount
  const calculateAmount = () => {
    if (!room.hourly_rate || !bookingData.start_time || !bookingData.end_time) return 0
    
    const start = new Date(bookingData.start_time)
    const end = new Date(bookingData.end_time)
    const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    
    return durationHours * room.hourly_rate
  }

  const amount = calculateAmount()
  const currency = room.currency || 'GHS'

  // Load Paystack script
  useEffect(() => {
    if (isOpen && !window.PaystackPop) {
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      document.body.appendChild(script)
      
      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('ready')
      setErrorMessage('')
      setPaymentData(null)
      setIsProcessing(false)
      setIsVerifying(false)
    }
  }, [isOpen])

  const initializePayment = async () => {
    if (!user) {
      onError('User not authenticated')
      return
    }

    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      const token = localStorage.getItem("auth-token")
      
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment initialization failed')
      }

      // Open Paystack modal
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: amount * 100, // Convert to kobo/pesewas
          currency: currency,
          ref: result.payment.reference,
          callback: function(response: any) {
            handlePaymentCallback(response)
          },
          onClose: function() {
            setIsProcessing(false)
            setPaymentStep('ready')
          }
        })
        
        handler.openIframe()
      } else {
        throw new Error('Paystack not loaded')
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      setErrorMessage(error.message || 'Failed to initialize payment')
      setPaymentStep('error')
      setIsProcessing(false)
    }
  }

  const handlePaymentCallback = async (response: any) => {
    setIsVerifying(true)
    setPaymentStep('verifying')

    try {
      const token = localStorage.getItem("auth-token")
      
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reference: response.reference
        })
      })

      const verifyResult = await verifyResponse.json()

      if (verifyResponse.ok && verifyResult.success) {
        setPaymentData(verifyResult)
        setPaymentStep('success')
        
        // Call success callback after a brief delay to show success state
        setTimeout(() => {
          onSuccess({
            reference: response.reference,
            amount: amount,
            currency: currency,
            status: 'success',
            verificationData: verifyResult
          })
        }, 2000)
      } else {
        throw new Error(verifyResult.message || 'Payment verification failed')
      }
    } catch (error: any) {
      console.error('Payment verification error:', error)
      setErrorMessage(error.message || 'Payment verification failed')
      setPaymentStep('error')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRetry = () => {
    setPaymentStep('ready')
    setErrorMessage('')
    setIsProcessing(false)
    setIsVerifying(false)
  }

  const renderContent = () => {
    switch (paymentStep) {
      case 'ready':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Payment
              </DialogTitle>
              <DialogDescription>
                Secure payment powered by Paystack
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Payment Summary */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Room:</span>
                    <span>{room.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Meeting:</span>
                    <span>{bookingData.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Duration:</span>
                    <span>{Math.ceil((new Date(bookingData.end_time).getTime() - new Date(bookingData.start_time).getTime()) / (1000 * 60 * 60))} hours</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{currency} {amount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Button */}
              <Button 
                onClick={initializePayment}
                disabled={isProcessing}
                className="w-full h-12 text-base"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {currency} {amount.toFixed(2)}
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )

      case 'processing':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">Please complete your payment in the Paystack window</p>
          </div>
        )

      case 'verifying':
        return (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Verifying Payment</h3>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )

      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2 text-green-700">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">Your booking is being processed...</p>
            <div className="space-y-2 text-sm">
              <div>Reference: {paymentData?.payment?.reference}</div>
              <div>Amount: {currency} {amount.toFixed(2)}</div>
            </div>
          </div>
        )

      case 'error':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Payment Failed
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "sm:max-w-md",
          paymentStep === 'processing' || paymentStep === 'verifying' || paymentStep === 'success' 
            ? "pointer-events-none" 
            : ""
        )}
      >
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
