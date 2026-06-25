import { Card } from './ui';
import type { ExplorerData } from '../types';

const COUNTER_LABEL: Record<string, string> = {
    use_cases_walked: 'Use Case',
    succeeded: 'Berhasil',
    ui_bug: 'Bug UI',
    incomplete: 'Tidak Tuntas',
    skipped: 'Dilewati',
};

export const ModuleOverview = ({ explorer }: { explorer: ExplorerData }) => {
    const entries = Object.entries(explorer.counters ?? {});

    return (
        <div className="flex flex-col gap-4">
            {explorer.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{explorer.description}</p>
            ) : null}

            {explorer.base_url ? (
                <a
                    href={explorer.base_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit truncate font-mono text-xs text-primary hover:underline"
                >
                    {explorer.base_url}
                </a>
            ) : null}

            {entries.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {entries.map(([key, value]) => (
                        <Card key={key} className="p-3 text-center">
                            <div className="text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{COUNTER_LABEL[key] ?? key}</div>
                        </Card>
                    ))}
                </div>
            ) : null}

            {explorer.app_observations && explorer.app_observations.length > 0 ? (
                <Card className="p-4">
                    <h4 className="text-sm font-medium tracking-tight">Observasi</h4>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
                        {explorer.app_observations.map((obs, idx) => (
                            <li key={idx}>{obs}</li>
                        ))}
                    </ul>
                </Card>
            ) : null}
        </div>
    );
};
