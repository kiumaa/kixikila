import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  showProgress?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  showProgress = true, 
  showActions = false 
}) => {
  return (
    <Card className="ios-card">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        )}
        
        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};