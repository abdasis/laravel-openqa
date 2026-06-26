import { HugeiconsIcon } from '@hugeicons/react';
import {
    AlertDiamondIcon,
    AlertCircleIcon,
    CheckmarkCircle02Icon,
    Idea01Icon,
    InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';
import { Card } from './ui';
import { SeverityBadge, RetestStatusBadge } from './qa-badges';
import { FixPrompt } from './fix-prompt';
import { RetestSummary } from './retest-summary';
import type { Finding, Severity, RetestSummary as RetestSummaryData } from '../types';

const SEVERITY_STYLE: Record<Severity, { icon: typeof AlertDiamondIcon; tint: string; ring: string }> = {
    critical: {
        icon: AlertDiamondIcon,
        tint: 'text-red-600 dark:text-red-400',
        ring: 'bg-red-500/10',
    },
    warning: {
        icon: AlertCircleIcon,
        tint: 'text-amber-600 dark:text-amber-400',
        ring: 'bg-amber-500/10',
    },
    info: {
        icon: InformationCircleIcon,
        tint: 'text-sky-600 dark:text-sky-400',
        ring: 'bg-sky-500/10',
    },
};

const SUMMARY_ORDER: { key: Severity; label: string }[] = [
    { key: 'critical', label: 'Kritis' },
    { key: 'warning', label: 'Peringatan' },
    { key: 'info', label: 'Info' },
];

const SeveritySummary = ({ findings }: { findings: Finding[] }) => {
    const counts = findings.reduce<Record<string, number>>((acc, finding) => {
        acc[finding.severity] = (acc[finding.severity] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flex flex-wrap items-center gap-2">
            {SUMMARY_ORDER.map(({ key, label }) => {
                const style = SEVERITY_STYLE[key];
                const value = counts[key] ?? 0;

                return (
                    <div
                        key={key}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5',
                            value === 0 && 'opacity-50',
                        )}
                    >
                        <span className={cn('flex h-6 w-6 items-center justify-center rounded-md', style.ring)}>
                            <HugeiconsIcon icon={style.icon} size={14} className={style.tint} strokeWidth={2} />
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{value}</span>
                        <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export const FindingsSection = ({
    findings,
    retest,
}: {
    findings: Finding[];
    retest?: RetestSummaryData;
}) => {
    if (findings.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                    <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={22}
                        className="text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2}
                    />
                </span>
                <div>
                    <p className="text-sm font-medium">Tidak ada temuan</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Modul ini bersih, tidak ada isu tercatat.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {retest && retest.findings_tested > 0 ? <RetestSummary retest={retest} /> : null}

            <SeveritySummary findings={findings} />

            <div className="flex flex-col gap-3">
                {findings.map((finding, idx) => {
                    const style = SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE.info;

                    return (
                        <Card key={idx} className="p-4 transition-colors hover:bg-muted/30">
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                                        style.ring,
                                    )}
                                >
                                    <HugeiconsIcon icon={style.icon} size={16} className={style.tint} strokeWidth={2} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="font-medium leading-snug">{finding.title}</h4>
                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                                            {finding.status ? (
                                                <RetestStatusBadge status={finding.status} />
                                            ) : null}
                                            <SeverityBadge severity={finding.severity} />
                                        </div>
                                    </div>

                                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {finding.actual ? (
                                            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
                                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Aktual
                                                </dt>
                                                <dd className="mt-1 text-sm leading-relaxed">{finding.actual}</dd>
                                            </div>
                                        ) : null}
                                        {finding.expected ? (
                                            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
                                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Diharapkan
                                                </dt>
                                                <dd className="mt-1 text-sm leading-relaxed">{finding.expected}</dd>
                                            </div>
                                        ) : null}
                                    </dl>

                                    {finding.recommendation ? (
                                        <div className="mt-3 flex gap-2.5 rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm">
                                            <HugeiconsIcon
                                                icon={Idea01Icon}
                                                size={16}
                                                className="mt-0.5 shrink-0 text-primary"
                                                strokeWidth={2}
                                            />
                                            <p className="leading-relaxed">
                                                <span className="font-medium">Saran: </span>
                                                {finding.recommendation}
                                            </p>
                                        </div>
                                    ) : null}

                                    {finding.fix_prompt ? <FixPrompt prompt={finding.fix_prompt} /> : null}

                                    {finding.retest_note ? (
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                            <span className="font-medium">Hasil retest</span>
                                            {finding.retest_method ? ` (${finding.retest_method})` : ''}: {finding.retest_note}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
