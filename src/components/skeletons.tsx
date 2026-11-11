'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ============== Skeletons compostos reutilizáveis ============== */

export function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="w-8 h-8 rounded-lg mb-2.5" />
      <Skeleton className="w-16 h-7 mb-1.5" />
      <Skeleton className="w-12 h-3" />
    </div>
  )
}

export function AreaCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-3 mb-1" />
      <Skeleton className="w-2/3 h-3 mb-3" />
      <div className="flex gap-3 pt-3 border-t border-border">
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-12 h-3" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="w-48 h-8 mb-2" />
        <Skeleton className="w-96 h-4" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <Skeleton className="w-40 h-5 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="w-full h-32 rounded-lg" />
          <Skeleton className="w-full h-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-1/2 h-3" />
              <Skeleton className="w-2/3 h-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-64 h-7" />
          <Skeleton className="w-96 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Skeleton className="w-full h-20 rounded-lg" />
        <Skeleton className="w-full h-20 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="w-48 h-5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-28 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GridSkeleton({ cols = 4, count = 8 }: { cols?: number; count?: number }) {
  const colClass = cols === 4 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : `grid-cols-${cols}`
  return (
    <div className={cn("grid gap-3", colClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="w-10 h-10 rounded-lg mb-3" />
          <Skeleton className="w-3/4 h-4 mb-1" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      ))}
    </div>
  )
}
