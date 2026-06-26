import * as React from 'react';
import { Link } from '@inertiajs/react';
import { FlaskConical, Search } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { ModuleSummary } from '@/pages/e2e/types';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    modules: ModuleSummary[];
    activeSlug: string | null;
}

const statusDot = (status: string | null): string => {
    if (status === 'done') return 'bg-emerald-500';
    if (status === 'incomplete' || status === 'partial') return 'bg-amber-500';
    return 'bg-zinc-400/60';
};

export const AppSidebar = ({ modules, activeSlug, ...props }: AppSidebarProps) => {
    const [query, setQuery] = React.useState('');

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return modules;
        return modules.filter(
            (mod) =>
                mod.module.toLowerCase().includes(q) ||
                (mod.feature ?? '').toLowerCase().includes(q),
        );
    }, [modules, query]);

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" component="div">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <FlaskConical className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">OpenQA</span>
                                    <span className="truncate text-xs text-sidebar-foreground/70">
                                        Laporan Eksplorasi QA
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                <div className="relative px-1 group-data-[collapsible=icon]:hidden">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <SidebarInput
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari modul..."
                        className="pl-8"
                        aria-label="Cari modul QA"
                    />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Modul ({filtered.length})</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filtered.map((mod) => {
                                const critical = mod.summary?.critical ?? 0;
                                return (
                                    <SidebarMenuItem key={mod.slug}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={mod.slug === activeSlug}
                                            tooltip={mod.feature ?? mod.module}
                                        >
                                            <Link
                                                href={`?module=${encodeURIComponent(mod.slug)}`}
                                                preserveScroll
                                            >
                                                <span
                                                    className={cn(
                                                        'size-2 shrink-0 rounded-full',
                                                        statusDot(mod.status),
                                                    )}
                                                />
                                                <span className="truncate">
                                                    {mod.feature ?? mod.module}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {critical > 0 ? (
                                            <SidebarMenuBadge className="text-red-600 dark:text-red-400">
                                                {critical}
                                            </SidebarMenuBadge>
                                        ) : null}
                                    </SidebarMenuItem>
                                );
                            })}

                            {filtered.length === 0 ? (
                                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                                    Tidak ada modul yang cocok.
                                </p>
                            ) : null}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <p className="px-2 py-1 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                    {modules.length} modul terindeks
                </p>
            </SidebarFooter>
        </Sidebar>
    );
};
