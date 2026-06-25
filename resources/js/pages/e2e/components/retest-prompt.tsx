import { TestTube01Icon } from '@hugeicons/core-free-icons';
import { CopyPromptBox } from './copy-prompt-box';
import type { Finding } from '../types';

interface RetestPromptProps {
    /** Slug modul (mis. "bk-counseling"), dipakai sebagai target retest. */
    module: string;
    findings: Finding[];
}

const isTestable = (f: Finding): boolean => f.severity === 'critical' || f.severity === 'warning';

/**
 * Prompt siap-paste ke coding agent (Claude Code / Cursor) untuk menjalankan
 * skill qa-issues-fixer: retest tiap finding critical/warning yang punya
 * fix_prompt, tandai status fixed/still_failing/regressed, lalu tutup issue.
 */
const buildPrompt = (module: string, total: number): string =>
    `Jalankan skill qa-issues-fixer untuk modul "${module}". ` +
    `Retest ${total} temuan critical/warning di .openqa/${module}/ (verifikasi tiap fix_prompt sudah dikerjakan): ` +
    `jalankan ulang E2E Playwright dari .openqa/${module}/e2e/ (fallback browser-use bila app tak reachable), ` +
    `tandai status tiap finding (fixed/still_failing/regressed) ke JSON, tampilkan hasil retest di web openqa, ` +
    `lalu komentari & tutup GitHub Issue yang sudah fixed; biarkan yang belum lulus tetap open dengan komentar status.`;

export const RetestPrompt = ({ module, findings }: RetestPromptProps) => {
    const total = findings.filter(isTestable).length;

    if (!module || total === 0) {
        return null;
    }

    return (
        <CopyPromptBox
            prompt={buildPrompt(module, total)}
            title="Prompt retest (qa-issues-fixer)"
            icon={TestTube01Icon}
            tone="sky"
        >
            <div className="px-3 py-2.5">
                <p className="text-sm leading-relaxed text-foreground/90">
                    Salin prompt ini ke coding agent untuk menjalankan retest otomatis: verifikasi {total} temuan
                    critical/warning sudah diperbaiki, tandai statusnya, lalu tutup GitHub Issue yang sudah fixed.
                </p>
            </div>
        </CopyPromptBox>
    );
};
