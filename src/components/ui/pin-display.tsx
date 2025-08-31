import React from 'react';
import { cn } from '@/lib/utils';

interface PinDisplayProps {
  value: string;
  length?: number;
  className?: string;
  showValues?: boolean;
}

export const PinDisplay: React.FC<PinDisplayProps> = ({
  value,
  length = 4,
  className,
  showValues = false,
}) => {
  return (
    <div className={cn("flex justify-center gap-4", className)}>
      {Array.from({ length }).map((_, index) => {
        const hasValue = value[index] !== undefined && value[index] !== '';
        const displayValue = showValues ? value[index] : (hasValue ? '•' : '');
        
        return (
          <div
            key={index}
            className={cn(
              "w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200",
              hasValue
                ? "border-primary bg-primary/10 text-foreground scale-110"
                : "border-border bg-muted/30 text-muted-foreground"
            )}
          >
            {displayValue}
          </div>
        );
      })}
    </div>
  );
};