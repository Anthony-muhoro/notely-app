
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function NoteDetailsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-end mb-8">
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>

      <Card className="shadow-lg border-0">
        <CardContent className="p-8">
          <div className="mb-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            
            <div className="flex items-center space-x-2 mb-4">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            
            <div className="text-sm border-b pb-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
