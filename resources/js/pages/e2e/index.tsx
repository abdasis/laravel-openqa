import { Head, Link } from '@inertiajs/react';
import { AppSidebar } from '@/components/app-sidebar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Card } from './components/ui';
import { Tabs } from './components/tabs';
import { ModuleOverview } from './components/module-overview';
import { FindingsSection } from './components/findings-section';
import { UseCasesSection } from './components/use-cases-section';
import { PagesVisitedSection } from './components/pages-visited-section';
import { FeatureSidebar } from './components/feature-sidebar';
import { FeatureContent } from './components/feature-content';
import type { E2ePageProps, FeatureData } from './types';

const EmptyState = ({ root }: { root: string | null }) => (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
        <Card className="max-w-md p-8 text-center">
            <h2 className="text-base font-semibold tracking-tight">Belum ada hasil QA</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {root
                    ? `Direktori ${root} kosong. Jalankan exploration qa-explorer untuk menghasilkan data.`
                    : 'Direktori .openqa/ (atau openqa/) belum ditemukan. Jalankan exploration qa-explorer terlebih dahulu.'}
            </p>
        </Card>
    </div>
);

const E2eIndex = ({
    root,
    modules = [],
    active = null,
    activeFeatureSlug = null,
    activeFeature = null,
}: E2ePageProps) => {
    const explorer = active?.explorer ?? null;
    const index = active?.index ?? null;
    const features = active?.features ?? [];
    const hasFeatures = features.length > 0;

    const title =
        (activeFeature?.feature as string | undefined) ??
        explorer?.feature ??
        explorer?.module ??
        active?.slug ??
        'QA Report';

    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <Head title={active ? `QA - ${title}` : 'QA Report'} />
            <AppSidebar modules={modules} activeSlug={active?.slug ?? null} />
            <SidebarInset className="min-h-0 overflow-hidden">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-medium">OpenQA</BreadcrumbPage>
                            </BreadcrumbItem>
                            {active ? (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        {activeFeature ? (
                                            <BreadcrumbLink asChild>
                                                <Link
                                                    href={`?module=${encodeURIComponent(active.slug)}`}
                                                    className="capitalize"
                                                >
                                                    {explorer?.module ?? active.slug}
                                                </Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage className="capitalize">
                                                {title}
                                            </BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {activeFeature ? (
                                        <>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="capitalize">
                                                    {title}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    ) : null}
                                </>
                            ) : null}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {hasFeatures && active ? (
                        <FeatureSidebar
                            moduleSlug={active.slug}
                            features={features}
                            activeFeatureSlug={activeFeatureSlug}
                        />
                    ) : null}

                    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
                        {modules.length === 0 || !active ? (
                            <EmptyState root={root} />
                        ) : hasFeatures ? (
                            <>
                                <header>
                                    <h1 className="text-2xl font-semibold capitalize tracking-tight">{title}</h1>
                                    {activeFeature?.page ? (
                                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                                            {activeFeature.page}
                                        </p>
                                    ) : null}
                                </header>

                                {activeFeature ? (
                                    <FeatureContent feature={activeFeature as FeatureData} />
                                ) : (
                                    <Card className="p-8 text-center text-sm text-muted-foreground">
                                        Pilih fitur dari daftar untuk melihat detail.
                                    </Card>
                                )}
                            </>
                        ) : (
                            <>
                                <header>
                                    <h1 className="text-2xl font-semibold capitalize tracking-tight">{title}</h1>
                                </header>

                                {explorer ? <ModuleOverview explorer={explorer} /> : null}

                                <Tabs
                                    defaultValue="findings"
                                    items={[
                                        {
                                            value: 'findings',
                                            label: `Temuan (${index?.findings?.length ?? 0})`,
                                            content: (
                                                <FindingsSection findings={index?.findings ?? []} />
                                            ),
                                        },
                                        {
                                            value: 'use-cases',
                                            label: `Use Case (${explorer?.use_cases?.length ?? 0})`,
                                            content: (
                                                <UseCasesSection
                                                    useCases={explorer?.use_cases ?? []}
                                                />
                                            ),
                                        },
                                        {
                                            value: 'pages',
                                            label: `Halaman (${explorer?.pages_visited?.length ?? 0})`,
                                            content: (
                                                <PagesVisitedSection
                                                    pages={explorer?.pages_visited ?? []}
                                                />
                                            ),
                                        },
                                    ]}
                                />
                            </>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default E2eIndex;
