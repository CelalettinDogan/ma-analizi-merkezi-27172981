import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Enhanced Skeleton with shimmer effect
const SkeletonBase = ({ className, ...props }: SkeletonBaseProps) => (
  <div className={cn(
    "relative overflow-hidden rounded-md bg-muted/50",
    "before:absolute before:inset-0 before:-translate-x-full",
    "before:animate-[shimmer_2s_infinite]",
    "before:bg-gradient-to-r before:from-transparent before:via-muted/30 before:to-transparent",
    className
  )} {...props} />
);

// Match Card Skeleton
export const MatchCardSkeleton = () => (
  <div className="glass-card p-4 space-y-4">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-4 w-20" />
      <SkeletonBase className="h-6 w-16 rounded-full" />
    </div>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <SkeletonBase className="w-10 h-10 rounded-full" />
        <SkeletonBase className="h-5 w-24" />
      </div>
      <SkeletonBase className="h-8 w-16" />
      <div className="flex items-center gap-3 flex-1 justify-end">
        <SkeletonBase className="h-5 w-24" />
        <SkeletonBase className="w-10 h-10 rounded-full" />
      </div>
    </div>
    <SkeletonBase className="h-3 w-32 mx-auto" />
  </div>
);

// Prediction Card Skeleton
export const PredictionCardSkeleton = () => (
  <div className="glass-card p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SkeletonBase className="w-2 h-8 rounded-full" />
        <div className="space-y-1">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-3 w-16" />
        </div>
      </div>
      <SkeletonBase className="h-8 w-20 rounded-full" />
    </div>
    <SkeletonBase className="h-3 w-full" />
    <SkeletonBase className="h-3 w-3/4" />
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex items-center gap-3">
      <SkeletonBase className="w-12 h-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-8 w-16" />
      </div>
    </div>
    <SkeletonBase className="h-2 w-full rounded-full" />
  </div>
);

// League Grid Skeleton
export const LeagueGridSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="glass-card p-4 space-y-3">
        <SkeletonBase className="w-12 h-12 rounded-xl mx-auto" />
        <SkeletonBase className="h-4 w-20 mx-auto" />
        <SkeletonBase className="h-3 w-16 mx-auto" />
      </div>
    ))}
  </div>
);

// Chart Skeleton
export const ChartSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <SkeletonBase className="h-5 w-32" />
    <div className="flex items-end justify-between gap-2 h-40">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBase 
          key={i} 
          className="flex-1" 
          style={{ height: `${Math.random() * 60 + 40}%` }}
        />
      ))}
    </div>
  </div>
);

// Hero Stats Skeleton
export const HeroStatsSkeleton = () => (
  <div className="flex items-center justify-center gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="text-center space-y-1">
        <SkeletonBase className="h-3 w-16 mx-auto" />
        <SkeletonBase className="h-6 w-12 mx-auto" />
      </div>
    ))}
  </div>
);

// Navigation Item Skeleton
export const NavItemSkeleton = () => (
  <div className="flex flex-col items-center gap-1 p-2">
    <SkeletonBase className="w-6 h-6 rounded" />
    <SkeletonBase className="h-2 w-10" />
  </div>
);

// Full Page Skeleton
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-32" />
      <SkeletonBase className="h-10 w-10 rounded-full" />
    </div>
    
    {/* Hero */}
    <div className="space-y-4 py-8">
      <SkeletonBase className="h-8 w-48 mx-auto" />
      <SkeletonBase className="h-4 w-64 mx-auto" />
      <HeroStatsSkeleton />
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MatchCardSkeleton />
      <MatchCardSkeleton />
      <MatchCardSkeleton />
      <MatchCardSkeleton />
    </div>
  </div>
);

export { SkeletonBase as Skeleton };
