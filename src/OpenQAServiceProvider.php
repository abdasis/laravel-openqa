<?php

declare(strict_types=1);

namespace Abdasis\OpenQA;

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
    }
}
