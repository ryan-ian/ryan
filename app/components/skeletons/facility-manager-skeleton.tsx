import { Skeleton } from "@/components/ui/skeleton"

export function FacilityManagerSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
