import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
    value: string;
    label: string;
    content: ReactNode;
}

export const Tabs = ({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) => {
    const [active, setActive] = useState(defaultValue ?? items[0]?.value);
    const current = items.find((item) => item.value === active) ?? items[0];

    return (
        <div>
            <div className="inline-flex gap-1 rounded-lg border border-border/60 bg-muted/50 p-1">
                {items.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setActive(item.value)}
                        className={cn(
                            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            item.value === active
                                ? 'bg-background text-foreground shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            <div className="mt-4">{current?.content}</div>
        </div>
    );
};
