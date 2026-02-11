import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Welcome Banner */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-2xl p-6">
          <Skeleton className="h-4 w-32 mb-2 bg-white/20" />
          <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
          <Skeleton className="h-4 w-64 bg-white/20" />
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-4 mb-4">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-12 w-32 mb-4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes */}
      <div className="px-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-14 h-14 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
