<?php

declare(strict_types=1);

namespace Abdasis\OpenQA;

use DirectoryIterator;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Sinkron skill QA bundled (qa-explorer, qa-issues-fixer) ke <project>/.claude/skills/.
 *
 * Dipanggil dari service provider saat console boot. Idempoten: hanya menulis
 * file yang isinya berbeda (hash compare), jadi aman dijalankan tiap boot tanpa
 * I/O berlebih. Reusable lintas project — cukup composer require package ini.
 */
class SkillInstaller
{
    public function __construct(
        private readonly string $skillsSource,
        private readonly string $skillsTarget,
    ) {}

    /**
     * Buat installer dengan path default: skill bundled di package → .claude/skills app.
     */
    public static function make(string $basePath): self
    {
        return new self(
            skillsSource: \dirname(__DIR__).'/skills',
            skillsTarget: $basePath.'/.claude/skills',
        );
    }

    /**
     * Sinkron semua skill bundled. Return daftar nama skill yang diproses.
     *
     * @return array<int, string>
     */
    public function sync(): array
    {
        if (! is_dir($this->skillsSource)) {
            return [];
        }

        if (! is_dir($this->skillsTarget) && ! @mkdir($this->skillsTarget, 0o775, true) && ! is_dir($this->skillsTarget)) {
            return [];
        }

        $synced = [];

        foreach (new DirectoryIterator($this->skillsSource) as $entry) {
            if ($entry->isDot() || ! $entry->isDir()) {
                continue;
            }

            $name = $entry->getFilename();
            $this->copyTree($entry->getPathname(), $this->skillsTarget.'/'.$name);
            $synced[] = $name;
        }

        return $synced;
    }

    /**
     * Cek apakah ada skill bundled yang perlu disinkron (target hilang/berbeda).
     * Murah dipanggil tiap boot untuk hindari traversal penuh bila sudah sinkron.
     */
    public function needsSync(): bool
    {
        if (! is_dir($this->skillsSource)) {
            return false;
        }

        foreach (new DirectoryIterator($this->skillsSource) as $entry) {
            if ($entry->isDot() || ! $entry->isDir()) {
                continue;
            }

            $name = $entry->getFilename();
            $marker = $this->skillsTarget.'/'.$name.'/SKILL.md';
            $source = $entry->getPathname().'/SKILL.md';

            if (! is_file($marker)) {
                return true;
            }

            if (is_file($source) && md5_file($source) !== md5_file($marker)) {
                return true;
            }
        }

        return false;
    }

    private function copyTree(string $source, string $target): void
    {
        if (! is_dir($target) && ! @mkdir($target, 0o775, true) && ! is_dir($target)) {
            return;
        }

        $items = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($items as $item) {
            $relative = substr($item->getPathname(), \strlen($source) + 1);
            $dest = $target.'/'.$relative;

            if ($item->isDir()) {
                if (! is_dir($dest)) {
                    @mkdir($dest, 0o775, true);
                }

                continue;
            }

            $sourceHash = md5_file($item->getPathname());
            $destHash = is_file($dest) ? md5_file($dest) : null;

            if ($sourceHash !== $destHash) {
                @copy($item->getPathname(), $dest);
            }
        }
    }
}
