<?php

declare(strict_types=1);

use Abdasis\OpenQA\OpenQAReader;

beforeEach(function (): void {
    $this->qaRoot = sys_get_temp_dir().'/openqa-'.uniqid();
    @mkdir($this->qaRoot.'/cbt', 0777, true);

    file_put_contents($this->qaRoot.'/cbt/explorer.json', json_encode([
        'module' => 'cbt',
        'feature' => 'Computer Based Test',
        'description' => 'Kelola ujian.',
        'use_cases' => [
            ['name' => 'Create exam', 'outcome' => 'ui_bug'],
            ['name' => 'Verify exam', 'outcome' => 'skipped', 'blocked_by' => 'Create exam'],
        ],
        'status' => 'done',
        'counters' => ['use_cases_walked' => 2, 'ui_bug' => 1, 'skipped' => 1],
    ]));

    file_put_contents($this->qaRoot.'/cbt/index.json', json_encode([
        'module' => 'cbt',
        'feature' => 'Computer Based Test',
        'findings' => [
            ['severity' => 'critical', 'title' => 't', 'actual' => 'a', 'expected' => 'e'],
        ],
        'summary' => ['findings_total' => 1, 'critical' => 1],
    ]));

    $this->reader = new OpenQAReader([$this->qaRoot]);
});

afterEach(function (): void {
    @unlink($this->qaRoot.'/cbt/explorer.json');
    @unlink($this->qaRoot.'/cbt/index.json');
    @rmdir($this->qaRoot.'/cbt');
    @rmdir($this->qaRoot);
});

it('resolve root direktori sumber pertama yang ada', function (): void {
    expect($this->reader->resolveRoot())->toBe($this->qaRoot);
});

it('membaca daftar modul', function (): void {
    $modules = $this->reader->modules();

    expect($modules)->toHaveCount(1)
        ->and($modules[0]['slug'])->toBe('cbt')
        ->and($modules[0]['feature'])->toBe('Computer Based Test')
        ->and($modules[0]['summary']['critical'])->toBe(1);
});

it('membaca detail satu modul', function (): void {
    $module = $this->reader->module('cbt');

    expect($module['slug'])->toBe('cbt')
        ->and($module['explorer']['use_cases'])->toHaveCount(2)
        ->and($module['index']['findings'])->toHaveCount(1);
});

it('mengembalikan null untuk modul tidak ada', function (): void {
    expect($this->reader->module('tidak-ada'))->toBeNull();
});

it('mencegah path traversal pada slug modul', function (): void {
    expect($this->reader->module('../../etc'))->toBeNull();
});

it('mengembalikan array kosong saat tidak ada direktori sumber', function (): void {
    $reader = new OpenQAReader([sys_get_temp_dir().'/openqa-nope-'.uniqid()]);

    expect($reader->resolveRoot())->toBeNull()
        ->and($reader->modules())->toBe([]);
});
