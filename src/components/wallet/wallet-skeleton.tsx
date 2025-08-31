'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function WalletSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Balance Card Skeleton */}
        <Card className="bg-white/10 backdrop-blur-md border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-4 w-24 mb-2 bg-white/20" />
                <Skeleton className="h-10 w-40 bg-white/20" />
              </div>
              <Skeleton className="w-6 h-6 bg-white/20" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-3 w-16 mx-auto mb-1 bg-white/20" />
                  <Skeleton className="h-4 w-12 mx-auto bg-white/20" />
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-10 bg-white/20" />
              <Skeleton className="flex-1 h-10 bg-white/20" />
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions Skeleton */}
      <div className="px-6 -mt-16">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          {/* Filter Tabs Skeleton */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-20 flex-shrink-0" />
            ))}
          </div>
          
          {/* Transaction List Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  )
}