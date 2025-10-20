"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn(
      "disabled:cursor-not-allowed",
      // Light mode base styles
      "[&>div>div]:bg-white [&>div>div]:text-gray-900 [&>div>div]:border-gray-300",
      // Dark mode consistent styles
      "dark:[&>div>div]:bg-brand-navy-800 dark:[&>div>div]:text-brand-navy-50 dark:[&>div>div]:border-brand-navy-700",
      // Focus rings
      "[&>div>div]:ring-offset-0 [&>div>div]:focus-visible:ring-2 [&>div>div]:focus-visible:ring-blue-500 dark:[&>div>div]:focus-visible:ring-brand-teal-500",
      className
    )}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center border-y border-r text-base transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        // Light theme
        "bg-white text-gray-900 border-gray-300",
        // Dark theme
        "dark:bg-brand-navy-800 dark:text-brand-navy-50 dark:border-brand-navy-700",
        // Active/focus ring
        isActive && "z-10 ring-2 ring-blue-500 dark:ring-brand-teal-500",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
