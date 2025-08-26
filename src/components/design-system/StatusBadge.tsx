import React from 'react';
import { Check, Clock, AlertTriangle, Crown, Zap } from 'lucide-react';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'warning' | 'error' | 'info' | 'vip' | 'premium';
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
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
      icon: Clock
    },
    vip: {
      className: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border border-orange-200',
      icon: Crown
    },
    premium: {
      className: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-800 border border-indigo-200',
      icon: Zap
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${sizeClasses[size]} ${config.className} ${className}
    `}>
      {showIcon && <IconComponent className="w-3 h-3" />}
      {children}
    </span>
  );
};