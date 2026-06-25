import { MagicWand01Icon } from '@hugeicons/core-free-icons';
import { CopyPromptBox } from './copy-prompt-box';

export const FixPrompt = ({ prompt }: { prompt: string }) => (
    <div className="mt-3">
        <CopyPromptBox prompt={prompt} title="Prompt perbaikan (AI)" icon={MagicWand01Icon} tone="violet" />
    </div>
);
