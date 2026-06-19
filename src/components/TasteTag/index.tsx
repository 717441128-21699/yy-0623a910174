import { cn } from '@/lib/utils';

type TagVariant = 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'mystic';

interface TasteTagProps {
  label: string;
  variant?: TagVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<TagVariant, string> = {
  default: 'bg-midnight-700/50 text-midnight-300 border-midnight-600',
  gold: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  success: 'bg-mystic-500/20 text-mystic-400 border-mystic-500/50',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  danger: 'bg-crimson-500/20 text-crimson-400 border-crimson-500/50',
  mystic: 'bg-mystic-500/20 text-mystic-400 border-mystic-500/50',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export default function TasteTag({
  label,
  variant = 'default',
  size = 'md',
  className = '',
  style,
}: TasteTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full font-medium',
        'transition-all duration-200 hover:scale-105',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={style}
    >
      {label}
    </span>
  );
}
