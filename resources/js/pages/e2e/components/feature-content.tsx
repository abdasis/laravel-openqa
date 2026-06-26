import { usePage } from '@inertiajs/react';
import { ModuleOverview } from './module-overview';
import { Tabs } from './tabs';
import { FindingsSection } from './findings-section';
import { UseCasesSection } from './use-cases-section';
import { PagesVisitedSection } from './pages-visited-section';
import { RetestPrompt } from './retest-prompt';
import { ReExplorePrompt } from './re-explore-prompt';
import type { E2ePageProps, FeatureData } from '../types';

/**
 * Hitung counter dari summary use_cases bila file fitur tidak menyediakan
 * counters eksplisit (skema sub-fitur menyimpan summary di key terpisah).
 */
const deriveCounters = (feature: FeatureData): Record<string, number> => {
    if (feature.counters && Object.keys(feature.counters).length > 0) {
        return feature.counters;
    }

    const useCases = feature.use_cases ?? [];
    if (useCases.length === 0) {
        return {};
    }

    const tally: Record<string, number> = { use_cases_walked: useCases.length };
    for (const uc of useCases) {
        const key = uc.outcome === 'succeeded' ? 'succeeded' : (uc.outcome ?? 'unknown');
        tally[key] = (tally[key] ?? 0) + 1;
    }

    return tally;
};

export const FeatureContent = ({
    feature,
    moduleSlug,
    featureSlug,
}: {
    feature: FeatureData;
    moduleSlug: string;
    featureSlug?: string;
}) => {
    const { storageBase } = usePage<E2ePageProps>().props;
    const overview = { ...feature, counters: deriveCounters(feature) };

    return (
        <div className="flex flex-col gap-6">
            <ModuleOverview explorer={overview} />

            <ReExplorePrompt
                module={moduleSlug || (feature.module ?? '')}
                featureSlug={featureSlug}
                featureName={feature.feature ?? feature.page ?? undefined}
                baseUrl={feature.base_url ?? undefined}
            />

            <RetestPrompt module={moduleSlug || (feature.module ?? '')} findings={feature.findings ?? []} />

            <Tabs
                defaultValue="findings"
                items={[
                    {
                        value: 'findings',
                        label: 'Temuan',
                        count: feature.findings?.length ?? 0,
                        content: <FindingsSection findings={feature.findings ?? []} retest={feature.retest} />,
                    },
                    {
                        value: 'use-cases',
                        label: 'Use Case',
                        count: feature.use_cases?.length ?? 0,
                        content: (
                            <UseCasesSection
                                useCases={feature.use_cases ?? []}
                                storageBase={storageBase}
                                moduleSlug={moduleSlug}
                                folderSlug={featureSlug}
                            />
                        ),
                    },
                    {
                        value: 'pages',
                        label: 'Halaman',
                        count: feature.pages_visited?.length ?? 0,
                        content: <PagesVisitedSection pages={feature.pages_visited ?? []} />,
                    },
                ]}
            />
        </div>
    );
};
