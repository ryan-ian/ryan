"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  children?: ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
  iconClassName?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  action,
  className,
  iconClassName,
  compact = false,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12"
      )}>
        {Icon && (
          <div className={cn(
            "rounded-full bg-muted p-3 mb-4",
            compact ? "p-2 mb-3" : "p-3 mb-4",
            iconClassName
          )}>
            <Icon className={cn(
              "text-muted-foreground",
              compact ? "h-6 w-6" : "h-8 w-8"
            )} />
          </div>
        )}
        <h3 className={cn(
          "font-semibold",
          compact ? "text-base" : "text-lg"
        )}>
          {title}
        </h3>
        {description && (
          <p className={cn(
            "text-muted-foreground max-w-sm mx-auto",
            compact ? "text-sm mt-1 mb-3" : "mt-2 mb-4"
          )}>
            {description}
          </p>
        )}
        {children}
        {action && (
          <div className="mt-4">
            {action.href ? (
              <Button asChild>
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 