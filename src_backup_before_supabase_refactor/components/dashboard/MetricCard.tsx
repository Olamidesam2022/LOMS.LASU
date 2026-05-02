import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'warning' | 'success';
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: MetricCardProps) {
  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    accent: 'bg-accent/20 text-accent-foreground',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className={cn("metric-card animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <span className={cn(
                "text-xs sm:text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg sm:rounded-xl p-2 sm:p-3 flex-shrink-0", iconStyles[variant])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
