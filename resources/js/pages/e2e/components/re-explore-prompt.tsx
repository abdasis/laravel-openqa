import { Search01Icon } from '@hugeicons/core-free-icons';
import { CopyPromptBox } from './copy-prompt-box';

interface ReExplorePromptProps {
    /** Slug modul (mis. "bk-counseling"), jadi folder target .openqa/<module>/. */
    module: string;
    /** Slug sub-fitur (mis. "categories"), opsional. */
    featureSlug?: string;
    /** Nama fitur yang ditampilkan (untuk kalimat prompt). */
    featureName?: string;
    /** Base URL aplikasi bila tersedia di explorer/meta. */
    baseUrl?: string;
}

/**
 * Susun prompt re-explore dengan context fresh: minta qa-explorer menjelajah
 * ulang satu sub-fitur secara komprehensif (fungsional, UI/UX, verdict, bug,
 * teknik E2E) tanpa terbawa hasil eksplorasi sebelumnya, lalu menggabungkan
 * temuan baru ke .openqa/<module>/.
 */
const buildPrompt = (module: string, featureSlug: string | undefined, featureName: string | undefined, baseUrl: string | undefined): string => {
    const target = featureName ? `fitur "${featureName}"` : `modul "${module}"`;
    const scopeFile = featureSlug ? ` (file scoped: .openqa/${module}/${featureSlug}.json)` : '';
    const urlHint = baseUrl ? ` Base URL: ${baseUrl}.` : '';

    return (
        `Jalankan skill qa-explorer untuk RE-EXPLORE ${target} pada modul "${module}"${scopeFile} dengan context FRESH ` +
        `(abaikan asumsi dari eksplorasi sebelumnya, jelajahi ulang dari nol).${urlHint} ` +
        `Tujuan: hasil lebih komprehensif dari sesi lalu. Jelajahi via browser-use (headless) dan gali secara mendalam:\n` +
        `1. FUNGSIONAL: temukan use-case baru yang belum tercakup (happy path, edge case, validasi, error state, permission/role, data kosong, pagination, filter, sort, bulk action).\n` +
        `2. UI/UX: konsistensi layout, responsivitas mobile, dark mode, state loading/empty/error, aksesibilitas (focus, aria, kontras), micro-interaction, breadcrumb.\n` +
        `3. VERDICT: untuk tiap use-case tetapkan outcome (succeeded/ui_bug/incomplete/skipped) dengan success_signal/defect_summary yang jelas.\n` +
        `4. BUG: catat tiap defect sebagai finding (severity + actual/expected + recommendation + fix_prompt yang actionable).\n` +
        `5. E2E: regenerate Playwright spec + Page Object per sub-fitur yang lebih lengkap (cover use-case baru, assertion kuat, selector stabil).\n` +
        `WAJIB perbarui (overwrite/merge) file JSON laporan fitur ini sebagai hasil akhir: ` +
        `${featureSlug ? `.openqa/${module}/${featureSlug}.json (sub-fitur), serta ` : ''}` +
        `.openqa/${module}/index.json dan .openqa/${module}/explorer.json — tulis use_cases, findings, recommendations, summary/counters yang baru ` +
        `(jangan hapus evidence lama yang masih valid). Simpan screenshot per step ke storage/, ` +
        `lalu buka/dedup GitHub Issue untuk tiap temuan critical/warning baru.`
    );
};

export const ReExplorePrompt = ({ module, featureSlug, featureName, baseUrl }: ReExplorePromptProps) => {
    if (!module) {
        return null;
    }

    return (
        <CopyPromptBox
            prompt={buildPrompt(module, featureSlug, featureName, baseUrl)}
            title="Prompt re-explore (qa-explorer)"
            icon={Search01Icon}
            tone="violet"
        >
            <div className="px-3 py-2.5">
                <p className="text-sm leading-relaxed text-foreground/90">
                    Konteks besar kadang bikin use-case & temuan kurang komprehensif. Salin prompt ini ke coding agent
                    untuk menjelajah ulang fitur ini dengan context fresh — menggali use-case baru, verdict, bug, serta
                    teknik UI/UX dan E2E yang lebih menyeluruh, lalu menggabungkan hasilnya ke laporan openqa.
                </p>
            </div>
        </CopyPromptBox>
    );
};
