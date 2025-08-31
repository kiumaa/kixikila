import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  regex: RegExp;
  format: (phone: string) => string;
}

const countries: Country[] = [
  {
    code: 'PT',
    name: 'Portugal',
    dialCode: '+351',
    flag: '🇵🇹',
    regex: /^(91|92|93|96)\d{7}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
  },
  {
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flag: '🇧🇷',
    regex: /^[1-9]{2}9\d{8}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flag: '🇺🇸',
    regex: /^[2-9]\d{2}[2-9]\d{2}\d{4}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 3) return `(${digits}`;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  },
  {
    code: 'GB',
    name: 'Reino Unido',
    dialCode: '+44',
    flag: '🇬🇧',
    regex: /^7\d{9}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  },
  {
    code: 'ES',
    name: 'Espanha',
    dialCode: '+34',
    flag: '🇪🇸',
    regex: /^[67]\d{8}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
  },
  {
    code: 'FR',
    name: 'França',
    dialCode: '+33',
    flag: '🇫🇷',
    regex: /^[67]\d{8}$/,
    format: (phone: string) => {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4)}`;
      if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
    }
  }
];

interface InternationalPhoneInputProps extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  onChange?: (fullPhone: string, formattedPhone: string, country: Country, isValid: boolean) => void;
  value?: string;
  defaultCountry?: string;
}

export const InternationalPhoneInput = forwardRef<HTMLInputElement, InternationalPhoneInputProps>(
  ({ className, onChange, value = '', defaultCountry = 'PT', ...props }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(() => 
      countries.find(c => c.code === defaultCountry) || countries[0]
    );
    const [phoneValue, setPhoneValue] = useState('');
    const [displayValue, setDisplayValue] = useState('');
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
      // Parse initial value if provided with country code
      if (value && value.startsWith('+')) {
        const country = countries.find(c => value.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country);
          const phone = value.substring(country.dialCode.length);
          setPhoneValue(phone);
          setDisplayValue(country.format(phone));
          setIsValid(country.regex.test(phone.replace(/\D/g, '')));
        }
      } else if (value) {
        setPhoneValue(value);
        setDisplayValue(selectedCountry.format(value));
        setIsValid(selectedCountry.regex.test(value.replace(/\D/g, '')));
      }
    }, [value]);

    const handleCountryChange = (countryCode: string) => {
      const country = countries.find(c => c.code === countryCode);
      if (country) {
        setSelectedCountry(country);
        // Reset phone input when country changes
        setPhoneValue('');
        setDisplayValue('');
        setIsValid(false);
        
        if (onChange) {
          onChange('', '', country, false);
        }
      }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = selectedCountry.format(inputValue);
      const rawValue = inputValue.replace(/\D/g, '');
      const valid = selectedCountry.regex.test(rawValue);
      const fullPhone = `${selectedCountry.dialCode}${rawValue}`;
      
      setPhoneValue(rawValue);
      setDisplayValue(formatted);
      setIsValid(valid);
      
      if (onChange) {
        onChange(fullPhone, formatted, selectedCountry, valid);
      }
    };

    const getPlaceholder = () => {
      switch (selectedCountry.code) {
        case 'PT': return '91 234 567';
        case 'BR': return '(11) 99876-5432';
        case 'US': return '(555) 123-4567';
        case 'GB': return '7911 123456';
        case 'ES': return '612 345 678';
        case 'FR': return '06 12 34 56 78';
        default: return 'Número de telefone';
      }
    };

    const getValidationHint = () => {
      switch (selectedCountry.code) {
        case 'PT': return 'Formato: 91/92/93/96 XXX XXX';
        case 'BR': return 'Formato: (DD) 9XXXX-XXXX';
        case 'US': return 'Formato: (XXX) XXX-XXXX';
        case 'GB': return 'Formato: 7XXX XXXXXX';
        case 'ES': return 'Formato: 6XX XXX XXX';
        case 'FR': return 'Formato: 06 XX XX XX XX';
        default: return 'Número válido do país selecionado';
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={selectedCountry.code} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-32">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span className="text-xs font-mono">{selectedCountry.dialCode}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span className="text-xs font-mono">{country.dialCode}</span>
                    <span className="text-sm">{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Input
              ref={ref}
              type="tel"
              value={displayValue}
              onChange={handlePhoneChange}
              className={cn(
                isValid && displayValue ? "ring-2 ring-green-500/20 border-green-500/50" : "",
                !isValid && displayValue && displayValue.length >= 2 ? "ring-2 ring-red-500/20 border-red-500/50" : "",
                className
              )}
              placeholder={getPlaceholder()}
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
        </div>
        
        <p className="text-xs text-muted-foreground">
          {getValidationHint()}
        </p>
        
        {phoneValue && !isValid && displayValue.length >= 2 && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            Número inválido para {selectedCountry.name}
          </p>
        )}
      </div>
    );
  }
);

InternationalPhoneInput.displayName = "InternationalPhoneInput";

export { countries };
export type { Country };