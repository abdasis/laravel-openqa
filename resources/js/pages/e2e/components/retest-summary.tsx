import { HugeiconsIcon } from '@hugeicons/react';
import {
    CheckmarkCircle02Icon,
    CancelCircleIcon,
    ArrowReloadHorizontalIcon,
    Clock01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import type { RetestSummary as RetestSummaryData } from '../types';

const ITEMS: { key: keyof Pick<RetestSummaryData, 'fixed' | 'still_failing' | 'regressed' | 'open'>; label: string; tint: string; ring: string; icon: typeof CheckmarkCircle02Icon }[] = [
    {
        key: 'fixed',
        label: 'Diperbaiki',
        tint: 'text-emerald-600 dark:text-emerald-400',
        ring: 'bg-emerald-500/10',
        icon: CheckmarkCircle02Icon,
    },
    {
        key: 'still_failing',
        label: 'Masih Gagal',
        tint: 'text-red-600 dark:text-red-400',
        ring: 'bg-red-500/10',
        icon: CancelCircleIcon,
    },
    {
        key: 'regressed',
        label: 'Regresi',
        tint: 'text-orange-600 dark:text-orange-400',
        ring: 'bg-orange-500/10',
        icon: ArrowReloadHorizontalIcon,
    },
    {
        key: 'open',
        label: 'Belum Diretest',
        tint: 'text-muted-foreground',
        ring: 'bg-muted-foreground/10',
        icon: Clock01Icon,
    },
];

const formatDate = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
};

export const RetestSummary = ({ retest }: { retest: RetestSummaryData }) => {
    const date = formatDate(retest.retested_at);

    return (
        <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Hasil Retest</span>
                    <span className="text-xs text-muted-foreground">
                        {retest.findings_tested}/{retest.findings_total} temuan diuji
                    </span>
                </div>
                {date ? <span className="text-xs text-muted-foreground">{date}</span> : null}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {ITEMS.map((item) => {
                    const value = retest[item.key];

                    return (
                        <div
                            key={item.key}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1',
                                value === 0 && 'opacity-50',
                            )}
                        >
                            <span className={cn('flex h-5 w-5 items-center justify-center rounded-md', item.ring)}>
                                <HugeiconsIcon icon={item.icon} size={12} className={item.tint} strokeWidth={2} />
                            </span>
                            <span className="text-sm font-semibold tabular-nums">{value}</span>
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
