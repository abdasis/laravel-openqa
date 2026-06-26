<?php

declare(strict_types=1);

use Abdasis\OpenQA\Http\OpenQAController;
use Illuminate\Support\Facades\Route;

$path = trim((string) config('openqa.path', '/e2e'), '/');

Route::middleware(config('openqa.middleware', ['web']))
    ->get($path, [OpenQAController::class, 'index'])
    ->name('openqa.index');

// Sajikan asset build milik package (dist/) tanpa perlu publish ke public/.
Route::get($path.'/assets/{file}', [OpenQAController::class, 'asset'])
    ->where('file', '.*')
    ->name('openqa.asset');

// Sajikan screenshot dari .openqa/{module}/storage/{folder}/{file}
Route::get($path.'/storage/{module}/{folder}/{file}', [OpenQAController::class, 'storage'])
    ->where(['module' => '[^/]+', 'folder' => '[^/]+', 'file' => '[^/]+'])
    ->name('openqa.storage');
