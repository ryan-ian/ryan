"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'success' | 'info' | 'warning'
  subtext?: string
  loading?: boolean
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = 'default', 
  subtext, 
  loading = false 
}: StatCardProps) {
  const variantStyles = {
    default: {
      card: "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
      iconBg: "bg-gradient-to-br from-brand-navy-100 to-brand-navy-50 dark:from-brand-navy-700 dark:to-brand-navy-800",
      iconColor: "text-brand-navy-600 dark:text-brand-navy-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: "text-brand-navy-900 dark:text-brand-navy-50"
    },
    success: {
      card: "border-emerald-200 dark:border-emerald-700 bg-white dark:bg-brand-navy-800",
      iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: "text-emerald-700 dark:text-emerald-300"
    },
    info: {
      card: "border-blue-200 dark:border-blue-700 bg-white dark:bg-brand-navy-800",
      iconBg: "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: "text-blue-700 dark:text-blue-300"
    },
    warning: {
      card: "border-amber-200 dark:border-amber-700 bg-white dark:bg-brand-navy-800",
      iconBg: "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: "text-amber-700 dark:text-amber-300"
    }
  }

  const styles = variantStyles[variant]

  if (loading) {
    return (
      <Card className={cn(
        "rounded-xl border backdrop-blur-[2px] transition-all duration-200",
        styles.card
      )}>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-12" />
              {subtext && <Skeleton className="h-3 w-20" />}
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "rounded-xl border backdrop-blur-[2px] transition-all duration-200",
      "hover:translate-y-[-1px] hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
      "group cursor-default",
      styles.card
    )}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className={cn(
              "text-sm font-medium tracking-tight",
              styles.title
            )}>
              {title}
            </p>
            <div className={cn(
              "text-3xl md:text-4xl font-extrabold tracking-tight",
              styles.value
            )}>
              {value}
            </div>
            {subtext && (
              <p className="text-xs text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                {subtext}
              </p>
            )}
          </div>
          <div className={cn(
            "p-2.5 rounded-lg transition-transform duration-200 group-hover:scale-105",
            styles.iconBg
          )}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
