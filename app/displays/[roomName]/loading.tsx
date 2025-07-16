import { Loader2 } from "lucide-react"

export default function LoadingRoomDisplay() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-semibold">Loading Room Display...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we fetch the room information.</p>
      </div>
    </div>
  )
} 