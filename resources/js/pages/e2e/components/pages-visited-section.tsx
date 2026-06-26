import { Card } from './ui';
import type { PageVisited } from '../types';

export const PagesVisitedSection = ({ pages }: { pages: PageVisited[] }) => {
    if (pages.length === 0) {
        return (
            <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Tidak ada halaman yang tercatat.
            </Card>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {pages.map((page, idx) => (
                <Card key={idx} className="p-4">
                    <h4 className="font-medium">{page.name}</h4>
                    {page.purpose ? (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{page.purpose}</p>
                    ) : null}
                    {page.url ? (
                        <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block truncate font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            {page.url}
                        </a>
                    ) : null}
                    {page.key_ui_elements && page.key_ui_elements.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {page.key_ui_elements.map((el, eIdx) => (
                                <span key={eIdx} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                    {el}
                                </span>
                            ))}
                        </div>
                    ) : null}
                </Card>
            ))}
        </div>
    );
};
