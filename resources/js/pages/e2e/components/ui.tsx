import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const CARD_BASE =
    'rounded-xl border border-border/60 bg-card text-card-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] transition-shadow';

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
    <div className={cn(CARD_BASE, className)}>{children}</div>
);
