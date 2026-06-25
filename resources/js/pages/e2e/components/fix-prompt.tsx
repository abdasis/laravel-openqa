import { useCallback, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick02Icon, MagicWand01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';

export const FixPrompt = ({ prompt }: { prompt: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }, [prompt]);

    return (
        <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center justify-between gap-2 border-b border-violet-500/15 px-3 py-2">
                <div className="flex items-center gap-2">
                    <HugeiconsIcon
                        icon={MagicWand01Icon}
                        size={15}
                        className="text-violet-600 dark:text-violet-400"
                        strokeWidth={2}
                    />
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        Prompt perbaikan (AI)
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    title="Salin prompt ke clipboard"
                    aria-label="Salin prompt perbaikan"
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        copied
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-border/60 bg-background text-muted-foreground hover:text-foreground',
                    )}
                >
                    <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} strokeWidth={2} />
                    {copied ? 'Tersalin' : 'Salin'}
                </button>
            </div>
            <p className="px-3 py-2.5 text-sm leading-relaxed text-foreground/90">{prompt}</p>
        </div>
    );
};
