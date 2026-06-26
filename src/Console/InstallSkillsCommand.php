<?php

declare(strict_types=1);

namespace Abdasis\OpenQA\Console;

use Abdasis\OpenQA\SkillInstaller;
use Illuminate\Console\Command;

class InstallSkillsCommand extends Command
{
    protected $signature = 'openqa:install-skills';

    protected $description = 'Sinkron skill QA bundled (qa-explorer, qa-issues-fixer) ke .claude/skills/';

    public function handle(): int
    {
        $skills = SkillInstaller::make($this->laravel->basePath())->sync();

        if ($skills === []) {
            $this->warn('Tidak ada skill bundled untuk disinkron.');

            return self::SUCCESS;
        }

        $this->info('Skill QA tersinkron ke .claude/skills/: '.implode(', ', $skills));

        return self::SUCCESS;
    }
}
