'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  isIndeterminate?: boolean;
  value?: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  isIndeterminate = false,
  value = 0,
  max = 100,
  className,
  showPercentage = false,
  animated = true
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isIndeterminate) {
      setProgress((value / max) * 100);
    }
  }, [value, max, isIndeterminate]);

  return (
    <div className={cn("w-full", className)}>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        {isIndeterminate ? (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-purple-600 to-transparent",
              "animate-shimmer"
            )}
            style={{
              backgroundSize: '200% 100%'
            }}
          />
        ) : (
          <div
            className={cn(
              "h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full",
              animated && "transition-all duration-500 ease-out"
            )}
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
      {showPercentage && !isIndeterminate && (
        <div className="mt-1 text-sm text-gray-600 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};