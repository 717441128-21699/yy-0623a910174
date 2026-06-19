import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-midnight-800/60 backdrop-blur-xl border border-amber-500/10 rounded-xl',
        'shadow-lg shadow-black/20',
        hover && 'transition-all duration-300 hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-gold',
        glow && 'shadow-gold border-amber-500/30',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
