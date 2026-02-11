import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Voting Cards */}
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>

        {[1, 2].map((i) => (
          <Card key={i} className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gray-200 p-5">
              <Skeleton className="h-6 w-3/4 mb-2 bg-gray-300" />
              <Skeleton className="h-4 w-1/2 bg-gray-300" />
            </div>
            <CardContent className="p-5">
              <Skeleton className="h-2 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
