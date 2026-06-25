import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { FormObserved, UseCase } from '../types';

const SignalBlock = ({
    label,
    tone,
    children,
}: {
    label: string;
    tone: 'success' | 'danger' | 'warning' | 'neutral';
    children: ReactNode;
}) => {
    const toneCls = {
        success: 'border-emerald-500/30 bg-emerald-500/5',
        danger: 'border-red-500/30 bg-red-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
        neutral: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40',
    }[tone];

    const labelCls = {
        success: 'text-emerald-600 dark:text-emerald-400',
        danger: 'text-red-600 dark:text-red-400',
        warning: 'text-amber-600 dark:text-amber-400',
        neutral: 'text-zinc-500 dark:text-zinc-400',
    }[tone];

    return (
        <div className={cn('rounded-lg border px-3 py-2.5', toneCls)}>
            <p className={cn('text-xs font-semibold uppercase tracking-wide', labelCls)}>
                {label}
            </p>
            <div className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{children}</div>
        </div>
    );
};

const FormBlock = ({ form }: { form: FormObserved }) => (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Form
        </p>
        {form.url ? (
            <p className="mt-1 break-all font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {form.url}
            </p>
        ) : null}
        <ul className="mt-2 flex flex-col gap-1">
            {(form.fields ?? []).map((f, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                        {f.field_name}
                        {f.is_required ? <span className="text-red-500"> *</span> : null}
                    </span>
                    {f.input_type ? (
                        <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {f.input_type}
                        </span>
                    ) : null}
                </li>
            ))}
        </ul>
        {form.submit_disabled_when ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium">Submit nonaktif saat:</span> {form.submit_disabled_when}
            </p>
        ) : null}
    </div>
);

/**
 * Blok sinyal per outcome ala TestSprite: success signal, data created,
 * why incomplete/skipped, defect, dan form yang teramati.
 */
export const WalkSignals = ({ useCase }: { useCase: UseCase }) => {
    const forms = useCase.forms_observed ?? [];
    const hasAny =
        useCase.success_signal ||
        useCase.data_created ||
        useCase.why_incomplete ||
        useCase.why_skipped ||
        useCase.defect_summary ||
        forms.length > 0;

    if (!hasAny) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-col gap-2">
            {useCase.success_signal ? (
                <SignalBlock label="Sukses Terverifikasi" tone="success">
                    {useCase.success_signal}
                </SignalBlock>
            ) : null}

            {useCase.defect_summary ? (
                <SignalBlock label="Defect" tone="danger">
                    {useCase.defect_summary}
                </SignalBlock>
            ) : null}

            {useCase.why_incomplete ? (
                <SignalBlock label="Tidak Tuntas" tone="warning">
                    {useCase.why_incomplete}
                </SignalBlock>
            ) : null}

            {useCase.why_skipped ? (
                <SignalBlock label="Dilewati" tone="neutral">
                    {useCase.why_skipped}
                    {useCase.blocked_by ? (
                        <span className="font-medium"> (diblok oleh: {useCase.blocked_by})</span>
                    ) : null}
                </SignalBlock>
            ) : null}

            {useCase.data_created ? (
                <SignalBlock label="Data Dibuat" tone="neutral">
                    {useCase.data_created}
                </SignalBlock>
            ) : null}

            {forms.map((form, idx) => (
                <FormBlock key={idx} form={form} />
            ))}
        </div>
    );
};
