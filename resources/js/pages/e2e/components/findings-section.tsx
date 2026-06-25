import { Card } from './ui';
import { SeverityBadge } from './qa-badges';
import type { Finding } from '../types';

export const FindingsSection = ({ findings }: { findings: Finding[] }) => {
    if (findings.length === 0) {
        return (
            <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Tidak ada temuan untuk modul ini.
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {findings.map((finding, idx) => (
                <Card key={idx} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h4 className="font-medium leading-snug">{finding.title}</h4>
                        <SeverityBadge severity={finding.severity} />
                    </div>
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                        {finding.actual ? (
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Aktual</dt>
                                <dd className="mt-1 text-sm">{finding.actual}</dd>
                            </div>
                        ) : null}
                        {finding.expected ? (
                            <div>
                                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Diharapkan</dt>
                                <dd className="mt-1 text-sm">{finding.expected}</dd>
                            </div>
                        ) : null}
                    </dl>
                    {finding.recommendation ? (
                        <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800/60">
                            <span className="font-medium">Saran: </span>
                            {finding.recommendation}
                        </div>
                    ) : null}
                </Card>
            ))}
        </div>
    );
};
