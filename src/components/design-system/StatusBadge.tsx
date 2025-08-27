import React from 'react';
import { Check, Clock, AlertTriangle, Crown, Zap, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'warning' | 'error' | 'info' | 'vip' | 'verified' | 'premium' | 'paid' | 'winner';
  children?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  size = 'md',
  showIcon = true,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const statusConfig = {
    success: {
      className: 'bg-success-subtle text-success border border-success/20',
      icon: Check
    },
    pending: {
      className: 'bg-warning-subtle text-warning border border-warning/20',
      icon: Clock
    },
    warning: {
      className: 'bg-warning-subtle text-warning border border-warning/20',
      icon: AlertTriangle
    },
    error: {
      className: 'bg-destructive-subtle text-destructive border border-destructive/20',
      icon: AlertTriangle
    },
    info: {
      className: 'bg-primary-subtle text-primary border border-primary/20',
      icon: Star
    },
    verified: {
      className: 'bg-primary-subtle text-primary border border-primary/20',
      icon: Shield
    },
    vip: {
      className: 'bg-gradient-to-r from-warning-subtle to-warning text-warning border border-warning/20',
      icon: Crown
    },
    premium: {
      className: 'bg-gradient-to-r from-primary-subtle to-primary text-primary border border-primary/20',
      icon: Zap
    },
    paid: {
      className: 'bg-success-subtle text-success border border-success/20',
      icon: Check
    },
    winner: {
      className: 'bg-gradient-to-r from-warning-subtle to-warning text-warning border border-warning/20',
      icon: Crown
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium smooth-transition',
      sizeClasses[size],
      config.className,
      className
    )}>
      {showIcon && <IconComponent className="w-3 h-3" />}
      {children}
    </span>
  );
};