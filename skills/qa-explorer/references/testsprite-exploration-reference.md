# TestSprite Exploration Report — Reference Format

Skill ini meniru format laporan "Site Exploration (AI Agent)" milik TestSprite.
Hasil eksplorasi browser ditulis ke beberapa file JSON + folder per modul, di bawah `.openqa/<modul>/`:

| File / folder | Wajib? | Isi |
|---|---|---|
| `explorer.json` | ya | Jejak eksplorasi mentah level modul (use cases, TRACE, forms, pages). |
| `index.json` | ya | Ringkasan + temuan terkategori level modul untuk web Laravel package. |
| `meta.json` | ya | Metadata sesi QA: base_url, tenant, kredensial per role, catatan. |
| `<sub-slug>.json` | per sub-fitur | Laporan scoped satu sub-fitur/halaman (use_cases + findings + recommendations + summary). Satu file per sub-fitur penting, nama = slug kebab-case (mis. `categories.json`, `student-cases.json`). |
| `e2e/` | folder | Placeholder kosong — target Playwright spec hasil konversi temuan. |
| `storage/` | folder | Bukti rekaman eksplorasi. Screenshot per step di `storage/<sub-slug>/<uc>-<step>.png` (folder media per sub-fitur); video sesi penuh `storage/video.mp4` (slideshow dari screenshot). Diisi lewat `scripts/record.sh`. |

`meta.json`, `e2e/`, dan `storage/` dibuat otomatis oleh `explorer.sh`; folder placeholder dibuat tiap kali script jalan.

## Anatomy laporan TestSprite

```
[Discovery] <Feature>                         header + status badge (Done)
Feature: <name>
<one-line feature description>
<base URL>

<Feature> · <N UI bug> · <N skipped>          per-feature counters

Use cases walked: <N>

── per use case ──────────────────────────────
  <use case name>            <status: Succeeded | UI bug | Incomplete | Skipped>
  TRACE
    01  <action taken>
        → <observed result>
        wait · <reason>                        explicit wait nodes inline
    02  ...
  SUCCESS SIGNAL  <positive proof, untuk Succeeded>
  DATA CREATED    <test data yang dibuat agent>
  WHY INCOMPLETE  <kenapa walked tapi gagal verifikasi>
  WHY SKIPPED     <kenapa tak pernah di-walk — sebut upstream>
  FORMS OBSERVED
    <form url>
    <field> * · <input type>                   `*` marks required
    Submit disabled when: <condition>

Pages visited: <N>
  <page title> · <url>
  PURPOSE          <what the page is for>
  KEY UI ELEMENTS  <primary elements>

App-wide observations
  <global notes, e.g. auth required before any feature>
```

## Empat outcome per use case — WAJIB dibedakan

| Outcome | Arti | Punya TRACE? | Membawa |
|---|---|---|---|
| `succeeded` | walked end-to-end, sukses teramati | ya (boleh 1 step) | `success_signal`, `data_created` |
| `ui_bug` | walked, defect fungsional/UI muncul di tengah trace | ya | failing step + observasi (`defect_summary`) |
| `incomplete` | walked tapi verifikasi gagal / kehabisan budget | ya | `why_incomplete`, sering `data_created` |
| `skipped` | tak pernah di-walk — diblok use case upstream | tidak | `why_skipped` + `blocked_by` (nama upstream) |

`incomplete` vs `skipped` adalah pembeda penting: Incomplete itu **jalan** tapi tak bisa
diverifikasi; Skipped **tak pernah dicoba** karena dependensinya gagal duluan. Kalau create
flow gagal, verify/cancel/history yang bergantung padanya → `skipped` dengan `blocked_by`
menyebut nama create flow.

## Skema explorer.json

```json
{
  "schema_version": "1.0",
  "module": "cbt",
  "feature": "Computer Based Test",
  "description": "Kelola jenis ujian, ruang, sesi, dan pelaksanaan ujian.",
  "base_url": "http://smknura.localhost:8006",
  "explored_at": "2026-06-25T10:30:00+07:00",
  "status": "done",
  "counters": {
    "use_cases_walked": 4,
    "succeeded": 1,
    "ui_bug": 1,
    "incomplete": 1,
    "skipped": 1
  },
  "use_cases": [
    {
      "name": "Create student violation report",
      "outcome": "ui_bug",
      "trace": [
        {
          "step_number": 1,
          "step_type": "action",
          "action": "Navigated to the recording page.",
          "result": "Page loaded with the form."
        },
        {
          "step_type": "wait",
          "wait_note": "Wait for form fields to be interactive."
        }
      ],
      "success_signal": null,
      "data_created": null,
      "why_incomplete": null,
      "why_skipped": null,
      "blocked_by": null,
      "defect_summary": "Submitted entry never appeared in the list.",
      "forms_observed": [
        {
          "url": "http://.../create",
          "fields": [
            { "field_name": "Pilih Siswa", "input_type": "dropdown", "is_required": true }
          ],
          "submit_disabled_when": "Fields are empty"
        }
      ]
    }
  ],
  "pages_visited": [
    {
      "name": "Dashboard",
      "url": "http://...",
      "purpose": "Landing page and login portal.",
      "key_ui_elements": ["Login form", "Module sidebar"]
    }
  ],
  "app_observations": [
    "App requires authentication before any feature is reachable."
  ]
}
```

Aturan field:
- `step_type` salah satu: `action` | `wait`. Untuk `action` isi `step_number`, `action`, `result`. Untuk `wait` isi `wait_note` saja (tanpa `step_number`).
- `outcome` salah satu: `succeeded` | `ui_bug` | `incomplete` | `skipped`.
- `skipped` TIDAK boleh punya `trace`; WAJIB punya `why_skipped` (dan `blocked_by` jika diblok upstream).
- `succeeded` WAJIB punya `success_signal`.
- `incomplete` WAJIB punya `why_incomplete`.
- `ui_bug` WAJIB punya `defect_summary`.
- `is_required: true` = field bertanda `*` di TestSprite.

## Skema index.json (konsumsi web Laravel)

```json
{
  "schema_version": "1.0",
  "module": "cbt",
  "feature": "Computer Based Test",
  "base_url": "http://smknura.localhost:8006",
  "explored_at": "2026-06-25T10:30:00+07:00",
  "summary": {
    "use_cases_walked": 4,
    "succeeded": 1,
    "ui_bug": 1,
    "incomplete": 1,
    "skipped": 1,
    "pages_visited": 5
  },
  "findings": [
    {
      "id": "cbt-001",
      "severity": "critical",
      "title": "Data pelanggaran tidak muncul setelah submit",
      "page": "/counseling/student-cases/create",
      "actual": "List menampilkan 'Belum ada data' setelah create.",
      "expected": "Data baru muncul di list dengan toast sukses.",
      "recommendation": "Cek redirect & query list — kemungkinan filter scope salah.",
      "fix_prompt": "Di modul CBT halaman /counseling/student-cases/create, data pelanggaran yang baru disubmit tidak muncul di list padahal seharusnya tampil dengan toast sukses. Periksa redirect setelah store dan query list di controller index — kemungkinan filter scope tenant/user tidak cocok. Pastikan record baru tampil di tabel dan toast sukses muncul setelah submit valid.",
      "related_use_case": "Create student violation report"
    }
  ],
  "recommendations": [
    {
      "id": "cbt-rec-001",
      "title": "Bulk export ke Excel",
      "problem": "User harus salin data satu per satu untuk laporan bulanan.",
      "solution": "Tombol 'Export Excel' di toolbar tabel pelanggaran.",
      "value": "Hemat ~10 menit per laporan, kurangi human error.",
      "business_value": "sedang",
      "complexity": "rendah"
    }
  ]
}
```

Aturan field:
- `severity` salah satu: `critical` | `warning` | `info`. (Rekomendasi fitur masuk array `recommendations`, terpisah.)
- `id` format `<modul>-NNN` untuk findings, `<modul>-rec-NNN` untuk recommendations.
- `business_value` & `complexity`: `tinggi` | `sedang` | `rendah`.
- Tiap finding WAJIB punya `actual`, `expected`, `recommendation` yang konkret (sebut komponen/warna/state, bukan "perbaiki UI").
- `fix_prompt` (string) WAJIB untuk **semua** severity (`critical`, `warning`, maupun `info`) — prompt self-contained siap-paste ke LLM coding agent (konteks + situasi saat ini + arah perbaikan/implementasi + kriteria selesai). Validator menolak jika finding manapun tidak punya `fix_prompt`.

## Skema meta.json

Metadata sesi QA — base URL, tenant, dan kredensial tiap role yang dipakai eksplorasi. Web Laravel package memakainya untuk menampilkan konteks sesi & memilih akun.

```json
{
  "schema_version": "1.0",
  "module": "bk-counseling",
  "feature": "BK / Konseling Sekolah",
  "base_url": "http://smknura.localhost:8006",
  "tenant": "SMK Nurul Amanah",
  "credentials": {
    "admin": {
      "email": "admin@smknura.sch.id",
      "password": "password",
      "role": "Admin",
      "verified": true
    },
    "guru": {
      "email": "guru0@smknura.sch.id",
      "password": "password",
      "role": "Guru",
      "verified": false
    }
  },
  "notes": [
    "Role 'Guru BK' ada di tabel roles tapi 0 user terdaftar di tenant ini.",
    "Password seeded default 'password' untuk semua user tenant."
  ]
}
```

Aturan field:
- `base_url` WAJIB.
- `credentials` object beraturan `{role_key: {email, password, role, verified?}}`. Tiap entri WAJIB punya `email`, `password`, `role`. `verified` opsional (boolean).
- `notes` opsional, array string — anomali/asumsi data tenant (mis. role tanpa user, default password).

## Skema sub-report `<sub-slug>.json`

Laporan **scoped satu sub-fitur/halaman** — sama bentuk dengan index.json tapi ditambah `page` (path halaman) dan boleh membawa `use_cases` (skema sama persis dengan use_cases explorer.json). Satu file per sub-fitur penting; pakai saat satu modul punya beberapa halaman/area yang layak dilaporkan terpisah (mis. `categories.json` untuk Kategori Pelanggaran, `student-cases.json` untuk Pencatatan Kasus).

```json
{
  "schema_version": "1.0",
  "module": "bk-counseling",
  "feature": "Kategori Pelanggaran (BK / Konseling)",
  "page": "/counseling/settings/categories",
  "base_url": "http://smknura.localhost:8006",
  "explored_at": "2026-06-25T19:55:00+07:00",
  "use_cases": [
    { "name": "Create kategori pelanggaran", "outcome": "succeeded", "trace": [], "success_signal": "..." }
  ],
  "findings": [
    {
      "id": "bk-cat-001",
      "severity": "warning",
      "title": "Empty state pencarian kategori menyesatkan",
      "page": "/counseling/settings/categories",
      "actual": "...", "expected": "...", "recommendation": "...",
      "related_use_case": "Search & filter kategori"
    }
  ],
  "recommendations": []
}
```

Aturan field:
- `page` WAJIB — path halaman sub-fitur (mis. `/counseling/settings/categories`).
- `use_cases` opsional; jika ada, divalidasi dengan aturan yang **sama persis** dengan use_cases explorer.json (outcome, trace, dependency). Script menghitung counter use case ke dalam `summary`.
- `findings` & `recommendations` ikut aturan index.json. `id` pakai prefix sub-fitur (mis. `bk-cat-NNN`) agar tak bentrok dengan id level modul.
- `summary` dihitung otomatis: counter use case + severity findings + jumlah recommendations.
