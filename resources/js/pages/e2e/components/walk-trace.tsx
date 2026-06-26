import { useState } from 'react';
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

const ScreenshotThumb = ({ src, alt }: { src: string; alt: string }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 block overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
                title="Lihat screenshot"
            >
                <img
                    src={src}
                    alt={alt}
                    className="h-28 w-full object-cover object-top transition-opacity hover:opacity-90"
                    loading="lazy"
                />
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative max-h-[90vh] max-w-5xl overflow-auto rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                            &times;
                        </button>
                        <img src={src} alt={alt} className="block max-w-full rounded-lg" />
                    </div>
                </div>
            ) : null}
        </>
    );
};

const ActionNode = ({ step, screenshotUrl }: { step: TraceStep; screenshotUrl?: string }) => (
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
        <span className="min-w-0 flex-1 pb-1">
            <span className="block text-sm font-medium leading-5">{step.action ?? '-'}</span>
            {step.result ? (
                <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                    &rarr; {step.result}
                </span>
            ) : null}
            {screenshotUrl ? (
                <ScreenshotThumb src={screenshotUrl} alt={`Screenshot langkah ${step.step_number ?? ''}`} />
            ) : null}
        </span>
    </li>
);

/**
 * Timeline TRACE ala TestSprite: node bernomor dihubungkan garis vertikal,
 * hasil tiap aksi ditandai panah, node wait tampil sebagai titik abu italic.
 * screenshotUrls: array URL screenshot per step (index sesuai trace).
 */
export const WalkTrace = ({
    trace,
    screenshotUrls,
}: {
    trace: TraceStep[];
    screenshotUrls?: (string | undefined)[];
}) => {
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
                        <ActionNode
                            key={idx}
                            step={step}
                            screenshotUrl={screenshotUrls?.[idx]}
                        />
                    ),
                )}
            </ol>
        </div>
    );
};
