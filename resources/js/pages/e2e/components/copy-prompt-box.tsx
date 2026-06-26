import { useCallback, useState, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/cn';

interface CopyPromptBoxProps {
    prompt: string;
    title: string;
    icon: typeof Copy01Icon;
    /** Konten body kustom; default menampilkan teks prompt apa adanya. */
    children?: ReactNode;
    /** Tone warna aksen. */
    tone?: 'violet' | 'sky';
}

const TONE = {
    violet: {
        border: 'border-violet-500/20',
        bg: 'bg-violet-500/5',
        headBorder: 'border-violet-500/15',
        icon: 'text-violet-600 dark:text-violet-400',
        label: 'text-violet-700 dark:text-violet-300',
    },
    sky: {
        border: 'border-sky-500/20',
        bg: 'bg-sky-500/5',
        headBorder: 'border-sky-500/15',
        icon: 'text-sky-600 dark:text-sky-400',
        label: 'text-sky-700 dark:text-sky-300',
    },
} as const;

export const CopyPromptBox = ({ prompt, title, icon, children, tone = 'violet' }: CopyPromptBoxProps) => {
    const [copied, setCopied] = useState(false);
    const t = TONE[tone];

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
        <div className={cn('rounded-lg border', t.border, t.bg)}>
            <div className={cn('flex items-center justify-between gap-2 border-b px-3 py-2', t.headBorder)}>
                <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={icon} size={15} className={t.icon} strokeWidth={2} />
                    <span className={cn('text-xs font-semibold', t.label)}>{title}</span>
                </div>
                <button
                    type="button"
                    onClick={handleCopy}
                    title="Salin prompt ke clipboard"
                    aria-label={`Salin prompt: ${title}`}
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
            {children ?? <p className="px-3 py-2.5 text-sm leading-relaxed text-foreground/90">{prompt}</p>}
        </div>
    );
};
