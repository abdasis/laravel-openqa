<?php

declare(strict_types=1);

return [
    /*
     | Path route untuk dashboard QA. Default: /e2e
     */
    'path' => env('OPENQA_PATH', '/e2e'),

    /*
     | Middleware route. Tambahkan 'auth' bila ingin diproteksi.
     */
    'middleware' => ['web'],

    /*
     | Direktori sumber data, dicek berurutan. Null = pakai default
     | (base_path('.openqa') lalu base_path('openqa')).
     */
    'sources' => null,

    /*
     | Auto-sync skill QA bundled (qa-explorer, qa-issues-fixer) ke
     | .claude/skills/ saat console boot. Set false untuk nonaktifkan.
     */
    'install_skills' => env('OPENQA_INSTALL_SKILLS', true),
];
