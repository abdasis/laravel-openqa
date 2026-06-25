import { cn } from '@/lib/cn';
import type { TraceStep } from '../types';

const WaitNode = ({ note }: { note?: string }) => (
    <li className="relative flex gap-3 pl-1">
        <span className="relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center">
            <span className="size-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </span>
        <span className="text-xs italic text-zinc-500 dark:text-zinc-400">
            tunggu &middot; {note ?? 'Menunggu'}
        </span>
    </li>
);

const ActionNode = ({ step }: { step: TraceStep }) => (
    <li className="relative flex gap-3">
        <span
            className={cn(
                'relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center',
                'rounded-full border border-zinc-300 bg-white font-mono text-[10px] font-medium text-zinc-500',
                'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
            )}
        >
            {step.step_number ?? ''}
        </span>
        <span className="min-w-0 pb-1">
            <span className="block text-sm font-medium leading-5">{step.action ?? '-'}</span>
            {step.result ? (
                <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                    &rarr; {step.result}
                </span>
            ) : null}
        </span>
    </li>
);

/**
 * Timeline TRACE ala TestSprite: node bernomor dihubungkan garis vertikal,
 * hasil tiap aksi ditandai panah, node wait tampil sebagai titik abu italic.
 */
export const WalkTrace = ({ trace }: { trace: TraceStep[] }) => {
    if (trace.length === 0) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Tidak ada jejak langkah untuk use case ini.
            </p>
        );
    }

    return (
        <div>
            <h5 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Trace
            </h5>
            <ol className="relative flex flex-col gap-3 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                {trace.map((step, idx) =>
                    step.step_type === 'wait' ? (
                        <WaitNode key={idx} note={step.wait_note} />
                    ) : (
                        <ActionNode key={idx} step={step} />
                    ),
                )}
            </ol>
        </div>
    );
};
