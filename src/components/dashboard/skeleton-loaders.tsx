'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function WalletSkeleton() {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-0">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 bg-white/20" />
            <Skeleton className="w-32 h-4 bg-white/20" />
          </div>
          <Skeleton className="w-5 h-5 bg-white/20" />
        </div>
        
        <Skeleton className="w-48 h-10 bg-white/20 mb-6" />
        
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-10 bg-white/20" />
          <Skeleton className="flex-1 h-10 bg-white/20" />
          <Skeleton className="flex-1 h-10 bg-white/20" />
        </div>
      </div>
    </Card>
  )
}

export function GroupCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-16 h-5" />
          </div>
          <Skeleton className="w-full h-4 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-4" />
            <Skeleton className="w-24 h-4" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="w-20 h-8 mb-1" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-8 h-3" />
        </div>
        <Skeleton className="w-full h-2" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-28 h-3" />
        </div>
        <Skeleton className="w-4 h-4" />
      </div>
    </Card>
  )
}

export function StatCardSkeleton() {
  return (
    <Card className="p-4 text-center">
      <Skeleton className="w-12 h-8 mx-auto mb-2" />
      <Skeleton className="w-20 h-3 mx-auto" />
    </Card>
  )
}