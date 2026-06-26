---
name: qa-issues-fixer
description: |
  Retest hasil perbaikan dari laporan qa-explorer. Jalankan ulang E2E Playwright (atau fallback browser-use) untuk tiap finding critical/warning di .openqa/<modul>/, verifikasi fix_prompt sudah dikerjakan, tandai status (fixed/still_failing/regressed) ke findings JSON & tampilkan di web openqa, lalu komentari + tutup GitHub Issue yang sudah fixed (yang belum lulus dibiarkan open dengan komentar status).

  Aktifkan skill ini setiap kali user minta:
  - "retest modul X", "uji ulang fitur X", "cek perbaikan X"
  - "verifikasi fix X sudah jalan", "test ulang temuan X"
  - "jalankan retest X", "validasi hasil perbaikan X"
  - "apakah bug X sudah beres", "tutup issue yang sudah fixed"

  Skill ini menindaklanjuti qa-explorer: qa-explorer menemukan bug + menulis fix_prompt; qa-issues-fixer memverifikasi setelah bug diperbaiki. Butuh .openqa/<modul>/ sudah ada (index.json / <sub-slug>.json dengan findings + e2e spec). Jika belum, arahkan user ke qa-explorer dulu.
allowed-tools: Bash, Read, Write, Agent
---

# QA Issues Fixer (Retest & Close)

Tujuan: verifikasi bahwa finding `critical`/`warning` dari laporan qa-explorer sudah diperbaiki. Jalankan ulang E2E (Playwright dulu, fallback browser-use), tandai status per finding ke JSON, tampilkan di web openqa, lalu komentari & tutup GitHub Issue yang sudah `fixed`.

**Prasyarat:** `.openqa/<modul>/` sudah ada hasil qa-explorer — minimal `index.json` atau `<sub-slug>.json` dengan `findings[]`, dan idealnya spec di `e2e/`. Bila belum ada, hentikan dan minta user jalankan skill `qa-explorer` dulu.

**Sumber kebenaran target retest:** hanya finding dengan `severity` `critical` atau `warning` (yang punya `fix_prompt`). Finding `info` dilewati. Recommendations tidak diretest.

## Alur Kerja

### 1. Muat Laporan & Tentukan Target

- Tentukan slug modul (`.openqa/<modul>/`). Baca `meta.json` (base_url, kredensial), `index.json`, dan tiap `<sub-slug>.json`.
- Kumpulkan semua finding `critical`/`warning` dari index + subreport. Tiap finding: catat `id`, `severity`, `page`, `expected`, `fix_prompt`, `related_use_case`, dan file asalnya (index vs subreport mana).
- Jika finding sudah punya `status: "fixed"` dari retest sebelumnya, tetap retest ulang (regresi bisa terjadi) kecuali user minta hanya yang belum.

### 2. Jalankan E2E — Playwright dulu

Spec hasil qa-explorer ada di `.openqa/<modul>/e2e/` (luar `testDir` Playwright). Untuk menjalankan, sinkronkan ke `tests/e2e/`:

```bash
ROOT="$(pwd)"
DEST="tests/e2e/$MODULE"
mkdir -p "$DEST"
cp -r ".openqa/$MODULE/e2e/." "$DEST/"     # spec + pages/ + tsconfig
```

Cek app reachable dulu (jangan jalankan test jika mati):

```bash
curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/login" --max-time 5
```

Jika reachable (2xx/3xx), jalankan spec modul — fokus test REGRESI (yang menegaskan `expected`):

```bash
E2E_LOCAL_URL="$BASE_URL" npx playwright test "$DEST" --reporter=list 2>&1 | tee /tmp/retest-$MODULE.log
```

Petakan hasil ke finding lewat komentar `// REGRESI <id>` di spec:
- Test REGRESI `<id>` **lulus** → finding `<id>` `status: "fixed"`, `method: "playwright"`.
- Test REGRESI `<id>` **gagal** → `status: "still_failing"`.
- Test happy-path (non-regresi) yang dulu lulus kini **gagal** → finding terkait `status: "regressed"` (fix merusak alur lain).

Jangan biarkan salinan menumpuk: setelah selesai, hapus `tests/e2e/$MODULE` bila tadinya tidak ada (cek `git status`/keberadaan sebelum copy). Spec sumber tetap di `.openqa/`.

### 3. Fallback browser-use (jika Playwright tak bisa)

Pakai jalur ini jika: app tak reachable lewat Playwright config, spec gagal setup (auth/storageState), atau finding tak punya test REGRESI yang jelas. Verifikasi manual seperti qa-explorer tapi **fokus sempit** ke tiap finding:

```bash
browser-use --headless open "$BASE_URL"
# login bila perlu (kredensial dari meta.json), navigasi ke finding.page
browser-use --headless state
```

Untuk tiap finding, reproduksi skenario `related_use_case` lalu cek apakah `expected` kini terpenuhi:
- `expected` terpenuhi → `status: "fixed"`, `method: "browser-use"`.
- Masih seperti `actual` lama → `status: "still_failing"`.
- Alur yang dulu jalan kini rusak → `status: "regressed"`.

Rekam bukti retest via `record.sh` skill qa-explorer (reuse), simpan ke folder terpisah biar tak menimpa bukti eksplorasi:

```bash
REC="$HOME/.claude/skills/qa-explorer/scripts/record.sh"
bash "$REC" shot "$MODULE" --sub "retest-<sub-slug>" --uc <n> --step <n> --root "$(pwd)"
```

### 4. Tulis Status ke JSON

Rakit patch status per file (index dan tiap subreport terpisah — id finding milik file masing-masing) lalu pipe ke `scripts/retest.sh`. Script memvalidasi enum + mencocokkan `id` ke findings existing, lalu merge in-place + menghitung blok `retest`.

```bash
SKILL_DIR="$HOME/.claude/skills/qa-issues-fixer"
SH="$SKILL_DIR/scripts/retest.sh"

# Patch untuk findings di index.json
cat /tmp/retest-index.json | bash "$SH" index "$MODULE" --root "$(pwd)"

# Patch untuk findings di subreport (ulangi per sub-slug)
cat /tmp/retest-sp-thresholds.json | bash "$SH" subreport "$MODULE" --slug sp-thresholds --root "$(pwd)"
```

Bentuk payload patch:
```json
{
  "retested_at": "<ISO8601 +07:00 — stamp waktu retest>",
  "statuses": [
    { "id": "bk-sp-001", "status": "fixed",        "method": "playwright",  "note": "Test REGRESI bk-sp-001 lulus; submit nilai 200 kini ditolak error inline." },
    { "id": "bk-sp-003", "status": "still_failing", "method": "playwright",  "note": "Submit Poin Minimum kosong masih menutup modal tanpa error." }
  ]
}
```

Aturan:
- `status`: `fixed` | `still_failing` | `regressed` | `open`. `method`: `playwright` | `browser-use`.
- `note` ringkas: apa yang diuji & hasilnya (bukti konkret), Bahasa Indonesia.
- `id` WAJIB cocok dengan finding di file target — script menolak id asing.
- Hanya kirim status untuk finding yang benar-benar diretest. Finding `info` atau yang tak diuji biarkan tanpa status.
- `retested_at` tentukan dari jam nyata saat retest (script tidak menstempel sendiri agar resumable).

### 5. Komentar & Tutup GitHub Issue (WAJIB, otomatis)

Setelah status retest ditulis ke JSON (langkah 4), tindak lanjuti GitHub Issue yang dibuat qa-explorer. Pakai `scripts/close-issues.sh` — issue dipetakan dari finding via marker `<!-- qa:<id> -->`:
- Finding `fixed` → comment singkat (bukti retest + metode) lalu **tutup** issue (`--reason completed`).
- Finding `still_failing`/`regressed` → comment status, issue **dibiarkan open** (reopen dulu jika sudah closed).
- Finding tanpa status / `open`, atau issue sudah closed (untuk `fixed`) → dilewati.

```bash
SKILL_DIR="$HOME/.claude/skills/qa-issues-fixer"
CLOSE="$SKILL_DIR/scripts/close-issues.sh"

# Lihat dulu apa yang akan ditutup/dikomentari (tidak menyentuh GitHub).
bash "$CLOSE" "$MODULE" --root "$(pwd)" --dry-run

# Eksekusi: comment + tutup yang fixed, comment status yang belum lulus.
bash "$CLOSE" "$MODULE" --root "$(pwd)"
```

Catatan:
- **Selalu `--dry-run` dulu**, tampilkan ke user issue mana yang akan ditutup vs dikomentari, baru eksekusi — menutup issue itu outward-facing.
- Comment & close hanya untuk finding yang **benar-benar diretest** dan statusnya tertulis di JSON. Finding yang tak diuji tak disentuh.
- Butuh `gh` ter-auth. Jika `gh` tak ada / belum auth / issue tak ditemukan (marker hilang), script melaporkan dan lanjut tanpa gagal total.
- Idempoten: issue `fixed` yang sudah closed dilewati; aman dijalankan ulang.

### 6. Ringkas ke User

Beri ringkasan padat:
- Metode yang dipakai (Playwright / browser-use / campuran) dan kenapa.
- Tabel finding diretest: `id` · severity · status (fixed/still_failing/regressed) · catatan singkat.
- Total: N fixed, M masih gagal, K regresi.
- **Issue GitHub:** berapa ditutup (fixed), berapa dikomentari & tetap open (belum lulus) — sebut nomornya.
- Untuk yang `still_failing`/`regressed`: ingatkan `fix_prompt` belum tuntas — tawarkan kirim ulang ke coding agent.
- Path file yang diupdate (`index.json`, tiap `<sub-slug>.json`) dan reminder hasil tampil di web openqa (badge status pada kartu finding).

---

## Tips

- **App mati:** Playwright & browser-use sama-sama butuh app hidup. Jika `curl` login gagal, hentikan dan minta user start server (`composer run dev` / `php artisan serve`) + pastikan tenant host (`smknura.localhost:8006`) resolve.
- **Spec belum ada di e2e/:** jalankan qa-explorer dulu (langkah 5-nya generate spec), atau retest manual via browser-use saja.
- **Regresi:** selalu jalankan juga test happy-path, bukan cuma REGRESI — fix bisa memperbaiki satu hal tapi merusak alur lain.
- **Idempoten:** test yang mengubah data harus restore seed; kalau retest mengubah data nyata, kembalikan seperti qa-explorer (lihat `meta.notes` untuk nilai asli).
- **Re-run:** `retest.sh` menimpa blok `retest` + field status per finding; aman dijalankan berulang.
