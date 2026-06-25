import { Link } from '@inertiajs/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { File01Icon, Alert02Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/cn';
import type { FeatureSummaryItem } from '../types';

interface FeatureSidebarProps {
    moduleSlug: string;
    features: FeatureSummaryItem[];
    activeFeatureSlug: string | null;
}

const buildHref = (moduleSlug: string, featureSlug: string): string =>
    `?module=${encodeURIComponent(moduleSlug)}&feature=${encodeURIComponent(featureSlug)}`;

export const FeatureSidebar = ({
    moduleSlug,
    features,
    activeFeatureSlug,
}: FeatureSidebarProps) => {
    if (features.length === 0) {
        return null;
    }

    return (
        <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-muted/30 lg:flex">
            <div className="sticky top-0 z-10 border-b border-border/60 bg-muted/40 px-3 py-2.5 backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Fitur ({features.length})
                </p>
            </div>

            <nav className="flex flex-col gap-0.5 p-2">
                {features.map((feat) => {
                    const isActive = feat.slug === activeFeatureSlug;
                    const critical = feat.summary?.critical ?? 0;

                    return (
                        <Link
                            key={feat.slug}
                            href={buildHref(moduleSlug, feat.slug)}
                            preserveScroll
                            className={cn(
                                'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                                isActive
                                    ? 'bg-background font-medium text-primary shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]'
                                    : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                            )}
                        >
                            <HugeiconsIcon
                                icon={File01Icon}
                                size={16}
                                color="currentColor"
                                className="shrink-0"
                            />
                            <span className="flex-1 truncate">{feat.feature}</span>
                            {critical > 0 ? (
                                <span className="flex items-center gap-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                    <HugeiconsIcon
                                        icon={Alert02Icon}
                                        size={12}
                                        color="currentColor"
                                    />
                                    {critical}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};
