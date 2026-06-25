import './app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';

// Bootstrap Inertia mandiri untuk package OpenQA. Hanya resolve page di folder pages/.
const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx', {
    eager: false,
});

void createInertiaApp({
    progress: { color: '#6366f1' },
    resolve: (name) => {
        const importer =
            pages[`./pages/${name}.tsx`] ?? pages[`./pages/${name}/index.tsx`];

        if (!importer) {
            throw new Error(`OpenQA page tidak ditemukan: ${name}`);
        }

        return importer();
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
