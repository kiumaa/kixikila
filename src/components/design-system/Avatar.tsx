import React, { useState, useCallback } from 'react';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'xxl';
  image?: string;
  online?: boolean;
  verified?: boolean;
  vip?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = React.memo(({
  name,
  size = 'md',
  image,
  online = false,
  verified = false,
  vip = false,
  className = ''
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl',
    'xxl': 'w-24 h-24 text-2xl'
  };

  const getGradient = (name: string) => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-emerald-400 to-emerald-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
      'from-rose-400 to-rose-600'
    ];
    
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative ios-button', sizeClasses[size], className)}>
      {image && !imageError ? (
        <div className="relative w-full h-full">
          {!imageLoaded && (
            <div className={cn(
              'absolute inset-0 rounded-full flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-background bg-gradient-to-br animate-pulse',
              getGradient(name)
            )}>
              {initials}
            </div>
          )}
          <img
            src={image}
            alt={name}
            loading="lazy"
            className={cn(
              "w-full h-full rounded-full object-cover ring-2 ring-background shadow-md transition-opacity duration-300",
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className={cn(
          'w-full h-full rounded-full flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-background smooth-transition bg-gradient-to-br',
          getGradient(name)
        )}>
          {initials}
        </div>
      )}
      
      {/* Online indicator */}
      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full ring-2 ring-background animate-pulse" />
      )}
      
      {/* VIP crown - priority over verified */}
      {vip && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full ring-2 ring-background flex items-center justify-center animate-bounce-in">
          <Crown className="w-3 h-3 text-warning-foreground" />
        </div>
      )}
      
      {/* Verification badge */}
      {verified && !vip && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full ring-2 ring-background flex items-center justify-center animate-scale-in">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </div>
  );
});