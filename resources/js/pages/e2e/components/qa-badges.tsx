import { HugeiconsIcon } from '@hugeicons/react';
import {
    CheckmarkCircle02Icon,
    CancelCircleIcon,
    ArrowReloadHorizontalIcon,
    Clock01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import type { Severity, UseCaseOutcome, RetestStatus } from '../types';

const BADGE_BASE =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium';

const SEVERITY: Record<Severity, { cls: string; label: string }> = {
    critical: { cls: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400', label: 'Kritis' },
    warning: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'Peringatan' },
    info: { cls: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400', label: 'Info' },
};

export const SeverityBadge = ({ severity }: { severity: Severity }) => {
    const item = SEVERITY[severity] ?? SEVERITY.info;
    return <span className={cn(BADGE_BASE, item.cls)}>{item.label}</span>;
};

const RETEST: Record<RetestStatus, { cls: string; label: string; icon: typeof CheckmarkCircle02Icon }> = {
    fixed: {
        cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        label: 'Sudah Diperbaiki',
        icon: CheckmarkCircle02Icon,
    },
    still_failing: {
        cls: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
        label: 'Masih Gagal',
        icon: CancelCircleIcon,
    },
    regressed: {
        cls: 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400',
        label: 'Regresi',
        icon: ArrowReloadHorizontalIcon,
    },
    open: {
        cls: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400',
        label: 'Belum Diretest',
        icon: Clock01Icon,
    },
};

export const RetestStatusBadge = ({ status }: { status: RetestStatus }) => {
    const item = RETEST[status] ?? RETEST.open;
    return (
        <span className={cn(BADGE_BASE, 'gap-1', item.cls)}>
            <HugeiconsIcon icon={item.icon} size={12} strokeWidth={2} />
            {item.label}
        </span>
    );
};

const OUTCOME: Record<string, { cls: string; label: string }> = {
    success: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', label: 'Berhasil' },
    succeeded: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', label: 'Berhasil' },
    ui_bug: { cls: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400', label: 'Bug UI' },
    incomplete: { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'Tidak Tuntas' },
    skipped: { cls: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400', label: 'Dilewati' },
};

export const OutcomeBadge = ({ outcome }: { outcome?: UseCaseOutcome }) => {
    const item = OUTCOME[outcome ?? ''] ?? {
        cls: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400',
        label: outcome ?? 'tidak diketahui',
    };
    return <span className={cn(BADGE_BASE, item.cls)}>{item.label}</span>;
};
