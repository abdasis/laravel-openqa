<?php

declare(strict_types=1);

namespace Abdasis\OpenQA;

use RuntimeException;

/**
 * Resolusi asset hasil build Vite milik package (independen dari build app utama).
 *
 * Manifest dibaca dari dist/.vite/manifest.json (Vite 5+) atau dist/manifest.json.
 */
class OpenQAAssets
{
    private const ENTRY = 'resources/js/app.tsx';

    public function __construct(private string $distPath) {}

    public static function make(): self
    {
        return new self(dirname(__DIR__).'/dist');
    }

    /**
     * Tag <script>/<link> untuk entry utama, beserta CSS-nya.
     */
    public function tags(string $baseUrl): string
    {
        $manifest = $this->manifest();
        $entry = $manifest[self::ENTRY] ?? null;

        if ($entry === null) {
            throw new RuntimeException(
                'OpenQA: entry "'.self::ENTRY.'" tidak ada di manifest. Jalankan build di packages/openqa (lihat README).'
            );
        }

        $tags = '';

        foreach ($entry['css'] ?? [] as $css) {
            $tags .= '<link rel="stylesheet" href="'.$baseUrl.'/'.$css.'">';
        }

        $tags .= '<script type="module" src="'.$baseUrl.'/'.$entry['file'].'"></script>';

        return $tags;
    }

    public function isBuilt(): bool
    {
        return $this->manifestPath() !== null;
    }

    /**
     * @return array<string, array{file: string, css?: list<string>}>
     */
    private function manifest(): array
    {
        $path = $this->manifestPath();

        if ($path === null) {
            throw new RuntimeException('OpenQA: manifest Vite tidak ditemukan di '.$this->distPath.'. Jalankan build dulu.');
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    private function manifestPath(): ?string
    {
        foreach ([$this->distPath.'/.vite/manifest.json', $this->distPath.'/manifest.json'] as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }
}
