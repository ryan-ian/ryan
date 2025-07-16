"use client"

import { Projector, Wifi, Coffee, Users, Thermometer, Maximize2, Tv, Mic, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { cn } from "@/lib/utils"
import type { Resource } from "@/types"

interface RoomFeaturesDisplayProps {
  features: string[]
  resources?: Resource[]
  className?: string
  compact?: boolean
}

export function RoomFeaturesDisplay({
  features,
  resources,
  className,
  compact = false
}: RoomFeaturesDisplayProps) {
  // Map common feature names to icons
  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase()
    
    if (lowerFeature.includes("projector")) return <Projector className="h-5 w-5" />
    if (lowerFeature.includes("wifi") || lowerFeature.includes("wireless")) return <Wifi className="h-5 w-5" />
    if (lowerFeature.includes("coffee") || lowerFeature.includes("refreshment")) return <Coffee className="h-5 w-5" />
    if (lowerFeature.includes("video") || lowerFeature.includes("conferencing")) return <Video className="h-5 w-5" />
    if (lowerFeature.includes("audio") || lowerFeature.includes("sound")) return <Mic className="h-5 w-5" />
    if (lowerFeature.includes("tv") || lowerFeature.includes("screen")) return <Tv className="h-5 w-5" />
    if (lowerFeature.includes("climate") || lowerFeature.includes("temperature")) return <Thermometer className="h-5 w-5" />
    if (lowerFeature.includes("capacity") || lowerFeature.includes("seating")) return <Users className="h-5 w-5" />
    if (lowerFeature.includes("space") || lowerFeature.includes("large")) return <Maximize2 className="h-5 w-5" />
    
    // Default icon for unknown features
    return <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
      <span className="text-xs font-medium text-primary">{feature.charAt(0)}</span>
    </div>
  }
  
  // Combine features and resources for display
  const allFeatures = [
    ...features.map(feature => ({ 
      name: feature,
      icon: getFeatureIcon(feature),
      type: "feature"
    })),
    ...(resources || []).map(resource => ({
      name: resource.name,
      icon: <ResourceIcon type={resource.type} name={resource.name} size="sm" />,
      type: "resource",
      status: resource.status
    }))
  ]
  
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {allFeatures.map((item, index) => (
          <div 
            key={`${item.type}-${index}`}
            className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md text-xs"
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <Card className={cn("bg-muted/30", className)}>
      <CardContent className="p-4">
        <h3 className="font-medium mb-3">Room Features & Resources</h3>
        <div className="grid grid-cols-2 gap-3">
          {allFeatures.map((item, index) => (
            <div 
              key={`${item.type}-${index}`}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md",
                item.type === "resource" && item.status === "maintenance" 
                  ? "bg-yellow-100 dark:bg-yellow-950/30" 
                  : "bg-background"
              )}
            >
              {item.icon}
              <span className="text-sm">{item.name}</span>
              {item.type === "resource" && item.status === "maintenance" && (
                <span className="text-xs ml-auto text-yellow-700 dark:text-yellow-500">
                  Maintenance
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 