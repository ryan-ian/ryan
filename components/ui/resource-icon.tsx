import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"

interface ResourceIconProps {
  type: string
  name: string
  image?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  quantity?: number
}

export function ResourceIcon({ type, name, image, size = 'md', showLabel = false, quantity }: ResourceIconProps) {
  // Map resource types to emojis
  const getEmoji = (type: string): string => {
    const typeToEmoji: Record<string, string> = {
      'projector': '📽️',
      'whiteboard': '🖌️',
      'screen': '🖥️',
      'tv': '📺',
      'microphone': '🎤',
      'speaker': '🔊',
      'camera': '📹',
      'videoconference': '📱',
      'wifi': '📶',
      'phone': '☎️',
      'table': '🪑',
      'refreshment': '☕',
      'catering': '🍽️',
      'ac': '❄️',
      'heating': '🔥',
      'lighting': '💡',
      'power': '🔌',
      'adapter': '🔄',
      'computer': '💻',
      'printer': '🖨️',
      'scanner': '📠',
    }
    
    // Default emoji for unknown types
    return typeToEmoji[type.toLowerCase()] || '📦'
  }
  
  const sizeClass = {
    sm: 'text-sm h-5 w-5',
    md: 'text-base h-6 w-6',
    lg: 'text-xl h-8 w-8'
  }
  
  const emoji = getEmoji(type)
  
  const renderIcon = () => {
    if (image) {
      return (
        <div className={`relative ${sizeClass[size]} rounded-full overflow-hidden bg-muted`}>
          <Image 
            src={image} 
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      )
    }
    
    return <span className={`${sizeClass[size]}`}>{emoji}</span>
  }
  
  const renderContent = () => {
    return (
      <div className="flex items-center gap-1">
        {renderIcon()}
        {showLabel && <span className="text-xs">{name}</span>}
        {quantity && quantity > 1 && <span className="text-xs text-muted-foreground">×{quantity}</span>}
      </div>
    )
  }
  
  if (showLabel) {
    return renderContent()
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {renderContent()}
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}{quantity && quantity > 1 ? ` (×${quantity})` : ''}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 