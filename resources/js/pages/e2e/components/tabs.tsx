import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
    value: string;
    label: string;
    count?: number;
    content: ReactNode;
}

export const Tabs = ({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) => {
    const [active, setActive] = useState(defaultValue ?? items[0]?.value);
    const current = items.find((item) => item.value === active) ?? items[0];

    return (
        <div>
            <div className="inline-flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-1">
                {items.map((item) => {
                    const isActive = item.value === active;

                    return (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => setActive(item.value)}
                            className={cn(
                                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                                isActive
                                    ? 'bg-background text-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.06)]'
                                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                            )}
                        >
                            {item.label}
                            {typeof item.count === 'number' ? (
                                <span
                                    className={cn(
                                        'inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums transition-colors',
                                        isActive
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted-foreground/10 text-muted-foreground',
                                    )}
                                >
                                    {item.count}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
            <div className="mt-5">{current?.content}</div>
        </div>
    );
};
