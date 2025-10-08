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
  clickable?: boolean
  active?: boolean
  onClick?: () => void
  filterKey?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtext,
  loading = false,
  clickable = false,
  active = false,
  onClick,
  filterKey
}: StatCardProps) {
  const variantStyles = {
    default: {
      card: active
        ? "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
      iconBg: active
        ? "bg-gray-200 dark:bg-gray-600"
        : "bg-gray-100 dark:bg-gray-700",
      iconColor: active
        ? "text-gray-700 dark:text-gray-300"
        : "text-gray-600 dark:text-gray-400",
      title: "text-gray-700 dark:text-gray-300",
      value: active
        ? "text-gray-900 dark:text-gray-100"
        : "text-gray-900 dark:text-gray-100"
    },
    success: {
      card: active
        ? "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-700"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
      iconBg: active
        ? "bg-green-200 dark:bg-green-800"
        : "bg-green-100 dark:bg-green-900/30",
      iconColor: active
        ? "text-green-700 dark:text-green-300"
        : "text-green-600 dark:text-green-400",
      title: "text-gray-700 dark:text-gray-300",
      value: active
        ? "text-green-800 dark:text-green-200"
        : "text-green-700 dark:text-green-300"
    },
    info: {
      card: active
        ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
      iconBg: active
        ? "bg-blue-200 dark:bg-blue-800"
        : "bg-blue-100 dark:bg-blue-900/30",
      iconColor: active
        ? "text-blue-700 dark:text-blue-300"
        : "text-blue-600 dark:text-blue-400",
      title: "text-gray-700 dark:text-gray-300",
      value: active
        ? "text-blue-800 dark:text-blue-200"
        : "text-blue-700 dark:text-blue-300"
    },
    warning: {
      card: active
        ? "border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 ring-2 ring-yellow-200 dark:ring-yellow-700"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
      iconBg: active
        ? "bg-yellow-200 dark:bg-yellow-800"
        : "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: active
        ? "text-yellow-700 dark:text-yellow-300"
        : "text-yellow-600 dark:text-yellow-400",
      title: "text-gray-700 dark:text-gray-300",
      value: active
        ? "text-yellow-800 dark:text-yellow-200"
        : "text-yellow-700 dark:text-yellow-300"
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

  const handleClick = () => {
    if (clickable && onClick) {
      onClick()
    }
  }

  const CardComponent = clickable ? 'button' : 'div'

  return (
    <Card
      onClick={handleClick}
      className={cn(
        "rounded-lg border shadow-sm transition-all duration-200",
        clickable && "hover:shadow-md cursor-pointer",
        styles.card
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? active : undefined}
      aria-label={clickable ? `Filter by ${title.toLowerCase()}` : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className={cn(
              "text-sm font-medium",
              styles.title
            )}>
              {title}
            </p>
            <div className={cn(
              "text-2xl font-bold",
              styles.value
            )}>
              {value}
            </div>
            {subtext && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtext}
              </p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            styles.iconBg
          )}>
            <Icon className={cn("h-4 w-4", styles.iconColor)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
