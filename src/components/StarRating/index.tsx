import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
  className = '',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  const handleClick = (index: number) => {
    if (readOnly) return;
    onChange?.(index + 1);
  };

  return (
    <div className={cn('flex gap-1', className)}>
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < displayValue;
        const isPartial = !isFilled && index < Math.ceil(displayValue) && displayValue % 1 !== 0;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readOnly && setHoverValue(index + 1)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            disabled={readOnly}
            className={cn(
              'relative transition-transform duration-150',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default'
            )}
          >
            <Star
              size={size}
              className={cn(
                'transition-all duration-200',
                isFilled
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                  : 'text-midnight-600'
              )}
            />
            {isPartial && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${(displayValue % 1) * 100}%` }}
              >
                <Star
                  size={size}
                  className="text-amber-400 fill-amber-400"
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
