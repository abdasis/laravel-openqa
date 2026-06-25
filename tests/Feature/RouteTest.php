<?php

declare(strict_types=1);

beforeEach(function (): void {
    $this->qaRoot = sys_get_temp_dir().'/openqa-route-'.uniqid();
    @mkdir($this->qaRoot.'/cbt', 0777, true);

    file_put_contents($this->qaRoot.'/cbt/explorer.json', json_encode([
        'module' => 'cbt',
        'feature' => 'Computer Based Test',
        'use_cases' => [['name' => 'A', 'outcome' => 'ui_bug']],
        'status' => 'done',
    ]));
    file_put_contents($this->qaRoot.'/cbt/index.json', json_encode([
        'module' => 'cbt',
        'findings' => [['severity' => 'critical', 'title' => 't']],
        'summary' => ['critical' => 1],
    ]));

    config()->set('openqa.sources', [$this->qaRoot]);
    app()->forgetInstance(\Abdasis\OpenQA\OpenQAReader::class);
});

afterEach(function (): void {
    @unlink($this->qaRoot.'/cbt/explorer.json');
    @unlink($this->qaRoot.'/cbt/index.json');
    @rmdir($this->qaRoot.'/cbt');
    @rmdir($this->qaRoot);
});

it('merender komponen inertia e2e/index dengan modul aktif', function (): void {
    $this->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '1')
        ->get('/e2e')
        ->assertOk()
        ->assertHeader('X-Inertia', 'true')
        ->assertJsonPath('component', 'e2e/index')
        ->assertJsonPath('props.active.slug', 'cbt')
        ->assertJsonCount(1, 'props.modules');
});

it('merender tanpa modul aktif saat direktori kosong', function (): void {
    config()->set('openqa.sources', [sys_get_temp_dir().'/openqa-empty-'.uniqid()]);
    app()->forgetInstance(\Abdasis\OpenQA\OpenQAReader::class);

    $this->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '1')
        ->get('/e2e')
        ->assertOk()
        ->assertJsonPath('component', 'e2e/index')
        ->assertJsonCount(0, 'props.modules')
        ->assertJsonPath('props.active', null);
});
