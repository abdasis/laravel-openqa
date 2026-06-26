# abdasis/openqa

Dashboard QA standalone untuk Laravel. Membaca hasil exploration `qa-explorer`
dari direktori `.openqa/` (atau `openqa/`) dan menampilkannya di route `/e2e`
sebagai aplikasi Inertia + React mandiri — tidak menyentuh build/asset aplikasi utama.

## Sumber data

Package memindai (berurutan, yang pertama ada dipakai):

1. `base_path('.openqa')`
2. `base_path('openqa')`

Struktur tiap modul: `<root>/<modul>/explorer.json` dan `<root>/<modul>/index.json`.

## Pasang (path repository, sudah dilakukan di repo ini)

`composer.json` aplikasi:

```json
{
    "repositories": [
        { "type": "path", "url": "packages/openqa", "options": { "symlink": true } }
    ],
    "require": { "abdasis/openqa": "@dev" }
}
```

Lalu `composer update abdasis/openqa`.

## Build frontend (wajib, sekali per perubahan UI)

Package punya pipeline Vite sendiri, terpisah dari app utama:

```bash
cd packages/openqa
npm install
npm run build      # output ke packages/openqa/dist/
```

Asset dilayani lewat route `/e2e/assets/*` — tidak perlu `php artisan vendor:publish`
atau menyalin ke `public/`.

## Konfigurasi (opsional)

```bash
php artisan vendor:publish --tag=openqa-config
```

`config/openqa.php`:

- `path` — prefix route (default `/e2e`).
- `middleware` — default `['web']`; tambah `'auth'` untuk proteksi.
- `sources` — override direktori sumber (array path absolut).

## Test package

```bash
cd packages/openqa
composer install
vendor/bin/pest
```
