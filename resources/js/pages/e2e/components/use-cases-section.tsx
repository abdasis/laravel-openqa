import { useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MinusCircle,
    Clock,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from './ui';
import { OutcomeBadge } from './qa-badges';
import { WalkTrace } from './walk-trace';
import { WalkSignals } from './walk-signals';
import type { UseCase, UseCaseOutcome } from '../types';

const OUTCOME_ICON: Record<string, { Icon: typeof CheckCircle2; cls: string }> = {
    success: { Icon: CheckCircle2, cls: 'text-emerald-500' },
    succeeded: { Icon: CheckCircle2, cls: 'text-emerald-500' },
    ui_bug: { Icon: XCircle, cls: 'text-red-500' },
    incomplete: { Icon: AlertTriangle, cls: 'text-amber-500' },
    skipped: { Icon: MinusCircle, cls: 'text-zinc-400' },
};

const OutcomeIcon = ({ outcome }: { outcome?: UseCaseOutcome }) => {
    const item = OUTCOME_ICON[outcome ?? ''] ?? { Icon: Clock, cls: 'text-zinc-400' };
    const { Icon, cls } = item;
    return <Icon className={cn('size-4 shrink-0', cls)} />;
};

const stepCount = (uc: UseCase): number =>
    (uc.trace ?? []).filter((s) => s.step_type !== 'wait').length;

const UseCaseRow = ({
    useCase,
    index,
    open,
    onToggle,
}: {
    useCase: UseCase;
    index: number;
    open: boolean;
    onToggle: () => void;
}) => {
    const steps = stepCount(useCase);

    return (
        <Card className="overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                    open && 'bg-zinc-50 dark:bg-zinc-800/50',
                )}
            >
                <ChevronRight
                    className={cn(
                        'size-4 shrink-0 text-zinc-400 transition-transform',
                        open && 'rotate-90',
                    )}
                />
                <OutcomeIcon outcome={useCase.outcome} />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{useCase.name}</span>
                    {steps > 0 ? (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {steps} langkah
                        </span>
                    ) : null}
                </span>
                <OutcomeBadge outcome={useCase.outcome} />
            </button>

            {open ? (
                <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
                    <WalkTrace trace={useCase.trace ?? []} />
                    <WalkSignals useCase={useCase} />
                </div>
            ) : null}
        </Card>
    );
};

export const UseCasesSection = ({ useCases }: { useCases: UseCase[] }) => {
    const firstOpen = useCases.findIndex(
        (uc) => uc.outcome === 'ui_bug' || uc.outcome === 'incomplete',
    );
    const [openIndex, setOpenIndex] = useState<number>(firstOpen >= 0 ? firstOpen : 0);

    if (useCases.length === 0) {
        return (
            <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Belum ada use case yang dijelajahi.
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {useCases.map((uc, idx) => (
                <UseCaseRow
                    key={idx}
                    useCase={uc}
                    index={idx}
                    open={openIndex === idx}
                    onToggle={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                />
            ))}
        </div>
    );
};
