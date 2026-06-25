<?php

declare(strict_types=1);

namespace Abdasis\OpenQA\Http;

use Abdasis\OpenQA\OpenQAAssets;
use Abdasis\OpenQA\OpenQAReader;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;

class OpenQAController
{
    public function __construct(private OpenQAReader $reader) {}

    public function index(Request $request): Response
    {
        $modules = $this->reader->modules();
        $activeSlug = $request->string('module')->toString() ?: ($modules[0]['slug'] ?? null);
        $active = $activeSlug !== null && $activeSlug !== '' ? $this->reader->module($activeSlug) : null;

        $features = $active['features'] ?? [];
        $featureSlug = $request->string('feature')->toString() ?: ($features[0]['slug'] ?? null);
        $activeFeature = $active !== null && $featureSlug !== null && $featureSlug !== ''
            ? $this->reader->feature($active['slug'], $featureSlug)
            : null;

        return Inertia::render('e2e/index', [
            'root' => $this->reader->resolveRoot(),
            'modules' => $modules,
            'active' => $active,
            'activeFeatureSlug' => $activeFeature !== null ? $featureSlug : null,
            'activeFeature' => $activeFeature,
        ])->rootView('openqa::app');
    }

    /**
     * Sajikan file dari dist/assets package. Path di-resolve relatif terhadap
     * dist/assets dan dijaga agar tidak keluar direktori (path traversal).
     */
    public function asset(string $file): BinaryFileResponse
    {
        $base = realpath(dirname(__DIR__, 2).'/dist/assets');
        $full = $base !== false ? realpath($base.'/'.$file) : false;

        abort_if($base === false || $full === false || ! str_starts_with($full, $base.DIRECTORY_SEPARATOR), 404);

        $headers = ['Cache-Control' => 'public, max-age=31536000, immutable'];

        // response()->file menebak mime dari isi; paksa untuk tipe asset web yang umum.
        $mime = match (pathinfo($full, PATHINFO_EXTENSION)) {
            'css' => 'text/css',
            'js' => 'application/javascript',
            'map' => 'application/json',
            default => null,
        };

        if ($mime !== null) {
            $headers['Content-Type'] = $mime;
        }

        return response()->file($full, $headers);
    }
}
