import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface LabeledInputProps extends React.ComponentProps<"input"> {
  label?: string;
  icon?: React.ReactNode;
  helper?: string;
  error?: string;
}

const LabeledInput = React.forwardRef<HTMLInputElement, LabeledInputProps>(
  ({ className, label, icon, helper, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <Input
            className={cn(
              icon ? "pl-10" : "",
              error ? "border-destructive" : "",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helper && !error && (
          <p className="text-sm text-muted-foreground">{helper}</p>
        )}
      </div>
    );
  }
);

LabeledInput.displayName = "LabeledInput";

export { LabeledInput };