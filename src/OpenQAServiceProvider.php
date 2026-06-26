<?php

declare(strict_types=1);

namespace Abdasis\OpenQA;

use Abdasis\OpenQA\Console\InstallSkillsCommand;
use Illuminate\Support\ServiceProvider;

class OpenQAServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/openqa.php', 'openqa');

        $this->app->singleton(OpenQAReader::class, function (): OpenQAReader {
            $candidates = config('openqa.sources');

            return new OpenQAReader(is_array($candidates) && $candidates !== [] ? $candidates : null);
        });
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'openqa');

        $this->publishes([
            __DIR__.'/../config/openqa.php' => config_path('openqa.php'),
        ], 'openqa-config');

        if ($this->app->runningInConsole()) {
            $this->commands([InstallSkillsCommand::class]);

            $this->syncSkills();
        }
    }

    /**
     * Auto-sync skill QA bundled ke .claude/skills/ saat console boot.
     * Hanya menulis bila ada perubahan (idempoten) — reusable lintas project
     * cukup dengan composer require, tanpa command tambahan.
     */
    private function syncSkills(): void
    {
        if (config('openqa.install_skills', true) !== true) {
            return;
        }

        $installer = SkillInstaller::make($this->app->basePath());

        if ($installer->needsSync()) {
            $installer->sync();
        }
    }
}
