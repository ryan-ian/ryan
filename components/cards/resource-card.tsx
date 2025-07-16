"use client"

import Link from "next/link"
import { Package, Edit, Trash2, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { cn } from "@/lib/utils"
import type { Resource } from "@/types"

export interface ResourceCardProps {
  resource: Resource
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
  compact?: boolean
  showActions?: boolean
  variant?: "default" | "minimal" | "dashboard"
  isAdmin?: boolean
}

export function ResourceCard({
  resource,
  onView,
  onEdit,
  onDelete,
  className,
  compact = false,
  showActions = true,
  variant = "default",
  isAdmin = false,
}: ResourceCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "in-use":
        return "secondary"
      case "maintenance":
        return "outline"
      case "unavailable":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20"
      case "in-use":
        return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/20"
      case "maintenance":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20"
      case "unavailable":
        return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20"
      default:
        return ""
    }
  }

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <ResourceIcon type={resource.type} name={resource.name} size="sm" />
        <span className="text-sm">{resource.name}</span>
        <Badge variant={getStatusBadgeVariant(resource.status)} className={cn("ml-auto text-xs", getStatusBadgeClass(resource.status))}>
          {resource.status}
        </Badge>
      </div>
    )
  }

  if (variant === "dashboard") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <div className="h-1.5 bg-blue-500 w-full" />
        <CardContent className={cn(compact ? "p-4" : "p-6")}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <ResourceIcon type={resource.type} name={resource.name} size="sm" />
            </div>
            <div>
              <h3 className="font-semibold">{resource.name}</h3>
              <p className="text-xs text-muted-foreground">{resource.type}</p>
            </div>
            <Badge variant={getStatusBadgeVariant(resource.status)} className={cn("ml-auto capitalize", getStatusBadgeClass(resource.status))}>
              {resource.status}
            </Badge>
          </div>
          
          {resource.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resource.description}</p>
          )}
          
          {showActions && (
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onView}
                asChild={!onView}
              >
                {onView ? (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </>
                ) : (
                  <Link href={isAdmin ? `/admin/conference/resources/${resource.id}` : `#`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1.5 bg-blue-500 w-full" />
      <CardHeader className={cn(compact ? "p-4" : "p-6", "pb-2")}>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{resource.name}</CardTitle>
          <Badge variant={getStatusBadgeVariant(resource.status)} className={cn("capitalize", getStatusBadgeClass(resource.status))}>
            {resource.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <ResourceIcon type={resource.type} name={resource.name} size="sm" />
          {resource.type}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={cn(compact ? "px-4 pb-4" : "px-6 pb-6", "pt-0")}>
        {resource.description ? (
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">No description</p>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className={cn(compact ? "p-4 pt-0" : "p-6 pt-0", "flex justify-between")}>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={isAdmin ? `/admin/conference/resources/${resource.id}` : `#`}>
              View Details
            </Link>
          </Button>
          {isAdmin && (
            <div className="flex gap-2 ml-2">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href={`/admin/conference/resources/${resource.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
} 