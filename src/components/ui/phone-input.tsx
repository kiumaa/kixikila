import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onChange?: (value: string, formatted: string, isValid: boolean) => void;
  value?: string;
}

// Regex para validar número português: 9 dígitos começando com 91, 92, 93, 96
const PORTUGUESE_PHONE_REGEX = /^(91|92|93|96)\d{7}$/;

const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  
  // Limita a 9 dígitos
  const limited = digits.slice(0, 9);
  
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
  return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
};

const validatePortuguesePhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return PORTUGUESE_PHONE_REGEX.test(digits);
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, value = '', ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() => formatPhoneNumber(value));
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
      const formatted = formatPhoneNumber(value);
      setDisplayValue(formatted);
      const valid = validatePortuguesePhone(formatted);
      setIsValid(valid);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatPhoneNumber(inputValue);
      const rawValue = inputValue.replace(/\D/g, '');
      const valid = validatePortuguesePhone(formatted);
      
      setDisplayValue(formatted);
      setIsValid(valid);
      
      if (onChange) {
        onChange(rawValue, formatted, valid);
      }
    };

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium text-sm">
          +351
        </div>
        <Input
          ref={ref}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "pl-12",
            isValid && displayValue ? "ring-2 ring-green-500/20 border-green-500/50" : "",
            !isValid && displayValue && displayValue.length >= 2 ? "ring-2 ring-red-500/20 border-red-500/50" : "",
            className
          )}
          placeholder="91 234 567"
          {...props}
        />
        {displayValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-1 bg-white rounded-sm transform rotate-45 origin-left"></div>
              </div>
            ) : displayValue.length >= 2 ? (
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <div className="w-2 h-0.5 bg-white"></div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { validatePortuguesePhone, formatPhoneNumber };