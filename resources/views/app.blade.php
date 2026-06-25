<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title inertia>OpenQA</title>
    @php
        $assets = \Abdasis\OpenQA\OpenQAAssets::make();
        $base = rtrim((string) config('openqa.path', '/e2e'), '/');
    @endphp
    @if ($assets->isBuilt())
        {!! $assets->tags($base) !!}
    @else
        <script>document.documentElement.innerHTML = '<body style="font-family:sans-serif;padding:2rem">OpenQA belum di-build. Jalankan <code>npm install &amp;&amp; npm run build</code> di <code>packages/openqa</code>.</body>';</script>
    @endif
</head>
<body class="h-full bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
    @inertia
</body>
</html>
