import React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onDelete,
  disabled = false,
  className,
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete']
  ];

  const handleKeyClick = (key: string) => {
    if (disabled) return;
    
    if (key === 'delete') {
      onDelete();
    } else if (key !== '') {
      onKeyPress(key);
    }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-4 max-w-xs mx-auto", className)}>
      {keys.flat().map((key, index) => {
        if (key === '') {
          return <div key={index} />; // Empty space
        }

        return (
          <button
            key={index}
            onClick={() => handleKeyClick(key)}
            disabled={disabled}
            className={cn(
              "h-16 w-16 rounded-2xl font-semibold text-xl transition-all duration-200 active:scale-95",
              "bg-card hover:bg-muted border border-border",
              "flex items-center justify-center",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              key === 'delete' 
                ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                : "text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            )}
          >
            {key === 'delete' ? (
              <Delete className="w-5 h-5" />
            ) : (
              key
            )}
          </button>
        );
      })}
    </div>
  );
};