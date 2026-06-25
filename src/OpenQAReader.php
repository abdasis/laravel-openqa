<?php

declare(strict_types=1);

namespace Abdasis\OpenQA;

use Illuminate\Support\Collection;

/**
 * Membaca hasil exploration qa-explorer dari direktori .openqa/ (atau openqa/).
 *
 * Struktur yang diharapkan: <root>/<modul>/explorer.json dan <root>/<modul>/index.json.
 */
class OpenQAReader
{
    /**
     * @var list<string> Kandidat direktori sumber data, dicek berurutan.
     */
    private array $candidates;

    /**
     * @param  list<string>|null  $candidates
     */
    public function __construct(?array $candidates = null)
    {
        $this->candidates = $candidates ?? [
            base_path('.openqa'),
            base_path('openqa'),
        ];
    }

    /**
     * Direktori sumber aktif pertama yang ada, atau null bila tidak ada.
     */
    public function resolveRoot(): ?string
    {
        foreach ($this->candidates as $dir) {
            if (is_dir($dir)) {
                return $dir;
            }
        }

        return null;
    }

    /**
     * Daftar ringkas semua modul untuk sidebar/list.
     *
     * @return list<array{slug: string, module: string, feature: ?string, status: ?string, counters: array<string, mixed>, summary: array<string, mixed>}>
     */
    public function modules(): array
    {
        $root = $this->resolveRoot();

        if ($root === null) {
            return [];
        }

        return collect(glob($root.'/*', GLOB_ONLYDIR) ?: [])
            ->map(fn (string $dir): ?array => $this->summarize($dir))
            ->filter()
            ->sortBy('module')
            ->values()
            ->all();
    }

    /**
     * Nama file JSON tingkat modul yang bukan sub-fitur.
     *
     * @var list<string>
     */
    private const RESERVED_FILES = ['explorer.json', 'index.json', 'meta.json'];

    /**
     * Detail lengkap satu modul: explorer + index + daftar sub-fitur.
     *
     * @return array{slug: string, explorer: ?array<string, mixed>, index: ?array<string, mixed>, features: list<array{slug: string, feature: string, page: ?string, summary: array<string, mixed>}>}|null
     */
    public function module(string $slug): ?array
    {
        $root = $this->resolveRoot();

        if ($root === null) {
            return null;
        }

        $dir = $root.'/'.$this->sanitizeSlug($slug);

        if (! is_dir($dir)) {
            return null;
        }

        return [
            'slug' => basename($dir),
            'explorer' => $this->readJson($dir.'/explorer.json'),
            'index' => $this->readJson($dir.'/index.json'),
            'features' => $this->features($dir),
        ];
    }

    /**
     * Isi satu file sub-fitur (mis. categories.json) milik sebuah modul.
     *
     * @return array<string, mixed>|null
     */
    public function feature(string $moduleSlug, string $featureSlug): ?array
    {
        $root = $this->resolveRoot();

        if ($root === null) {
            return null;
        }

        $dir = $root.'/'.$this->sanitizeSlug($moduleSlug);
        $file = $this->sanitizeSlug($featureSlug);

        if (in_array($file.'.json', self::RESERVED_FILES, true)) {
            return null;
        }

        return $this->readJson($dir.'/'.$file.'.json');
    }

    /**
     * Daftar sub-fitur (file JSON non-reserved) di dalam direktori modul.
     *
     * @return list<array{slug: string, feature: string, page: ?string, summary: array<string, mixed>}>
     */
    private function features(string $dir): array
    {
        return collect(glob($dir.'/*.json') ?: [])
            ->reject(fn (string $file): bool => in_array(basename($file), self::RESERVED_FILES, true))
            ->map(function (string $file): ?array {
                $data = $this->readJson($file);

                if ($data === null || ! isset($data['feature'])) {
                    return null;
                }

                $slug = basename($file, '.json');

                return [
                    'slug' => $slug,
                    'feature' => (string) $data['feature'],
                    'page' => isset($data['page']) ? (string) $data['page'] : null,
                    'summary' => is_array($data['summary'] ?? null) ? $data['summary'] : [],
                ];
            })
            ->filter()
            ->sortBy('feature')
            ->values()
            ->all();
    }

    /**
     * @return array{slug: string, module: string, feature: ?string, status: ?string, counters: array<string, mixed>, summary: array<string, mixed>}|null
     */
    private function summarize(string $dir): ?array
    {
        $explorer = $this->readJson($dir.'/explorer.json');
        $index = $this->readJson($dir.'/index.json');

        if ($explorer === null && $index === null) {
            return null;
        }

        $slug = basename($dir);

        return [
            'slug' => $slug,
            'module' => $explorer['module'] ?? $index['module'] ?? $slug,
            'feature' => $explorer['feature'] ?? $index['feature'] ?? null,
            'status' => $explorer['status'] ?? null,
            'counters' => $explorer['counters'] ?? [],
            'summary' => $index['summary'] ?? [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readJson(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }

        $raw = file_get_contents($path);

        if ($raw === false || trim($raw) === '') {
            return null;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : null;
    }

    private function sanitizeSlug(string $slug): string
    {
        return basename(trim($slug, '/.'));
    }
}
