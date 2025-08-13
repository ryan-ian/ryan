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
        ? "border-brand-navy-400 dark:border-brand-navy-500 bg-brand-navy-50 dark:bg-brand-navy-700 ring-2 ring-brand-navy-200 dark:ring-brand-navy-600"
        : "border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800",
      iconBg: active
        ? "bg-gradient-to-br from-brand-navy-200 to-brand-navy-100 dark:from-brand-navy-600 dark:to-brand-navy-700"
        : "bg-gradient-to-br from-brand-navy-100 to-brand-navy-50 dark:from-brand-navy-700 dark:to-brand-navy-800",
      iconColor: active
        ? "text-brand-navy-700 dark:text-brand-navy-300"
        : "text-brand-navy-600 dark:text-brand-navy-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: active
        ? "text-brand-navy-800 dark:text-brand-navy-100"
        : "text-brand-navy-900 dark:text-brand-navy-50"
    },
    success: {
      card: active
        ? "border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-200 dark:ring-emerald-700"
        : "border-emerald-200 dark:border-emerald-700 bg-white dark:bg-brand-navy-800",
      iconBg: active
        ? "bg-gradient-to-br from-emerald-200 to-emerald-100 dark:from-emerald-800/50 dark:to-emerald-900/50"
        : "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30",
      iconColor: active
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-emerald-600 dark:text-emerald-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: active
        ? "text-emerald-800 dark:text-emerald-200"
        : "text-emerald-700 dark:text-emerald-300"
    },
    info: {
      card: active
        ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700"
        : "border-blue-200 dark:border-blue-700 bg-white dark:bg-brand-navy-800",
      iconBg: active
        ? "bg-gradient-to-br from-blue-200 to-blue-100 dark:from-blue-800/50 dark:to-blue-900/50"
        : "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30",
      iconColor: active
        ? "text-blue-700 dark:text-blue-300"
        : "text-blue-600 dark:text-blue-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: active
        ? "text-blue-800 dark:text-blue-200"
        : "text-blue-700 dark:text-blue-300"
    },
    warning: {
      card: active
        ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-700"
        : "border-amber-200 dark:border-amber-700 bg-white dark:bg-brand-navy-800",
      iconBg: active
        ? "bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-800/50 dark:to-amber-900/50"
        : "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/30",
      iconColor: active
        ? "text-amber-700 dark:text-amber-300"
        : "text-amber-600 dark:text-amber-400",
      title: "text-brand-navy-700 dark:text-brand-navy-300",
      value: active
        ? "text-amber-800 dark:text-amber-200"
        : "text-amber-700 dark:text-amber-300"
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
      as={CardComponent}
      onClick={handleClick}
      className={cn(
        "rounded-xl border backdrop-blur-[2px] transition-all duration-200",
        clickable && "hover:translate-y-[-1px] hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
        clickable ? "group cursor-pointer" : "group cursor-default",
        clickable && active && "transform translate-y-[-1px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
        styles.card
      )}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? active : undefined}
      aria-label={clickable ? `Filter by ${title.toLowerCase()}` : undefined}
    >
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
            "p-2.5 rounded-lg transition-transform duration-200",
            clickable && "group-hover:scale-105",
            active && "scale-105",
            styles.iconBg
          )}>
            <Icon className={cn("h-5 w-5", styles.iconColor)} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
