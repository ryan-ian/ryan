import { Skeleton } from "@/components/ui/skeleton"

export default function RoomDetailsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <Skeleton className="h-6 w-1/2 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 