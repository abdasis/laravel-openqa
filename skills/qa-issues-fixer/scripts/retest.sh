#!/usr/bin/env bash
#
# retest.sh — patch status retest ke findings hasil qa-explorer (.openqa/<modul>/).
#
# Skill (Claude) menjalankan ulang E2E / browser-use untuk memverifikasi fix,
# lalu pipe daftar status per finding ke script ini. Script TIDAK menjalankan
# test sendiri — hanya merge status (by finding id) ke index.json / <sub-slug>.json
# existing, menulis ulang dengan rapi, dan menghitung blok "retest".
#
# Usage:
#   <json di stdin> | retest.sh index     <modul> [--root DIR]
#   <json di stdin> | retest.sh subreport <modul> --slug <sub-slug> [--root DIR]
#   retest.sh index <modul> --file patch.json
#
# Payload stdin (patch status):
#   {
#     "retested_at": "2026-06-26T10:00:00+07:00",
#     "statuses": [
#       { "id": "bk-sp-001", "status": "fixed",        "method": "playwright",  "note": "Validasi urutan kini menolak SP1>SP2." },
#       { "id": "bk-sp-003", "status": "still_failing", "method": "browser-use", "note": "Masih bisa submit kosong." }
#     ]
#   }
#
# status enum: fixed | still_failing | regressed | open
# method enum: playwright | browser-use
#
# Output: menimpa .openqa/<modul>/{index.json|<sub-slug>.json} (in-place merge).
# Exit non-zero jika file target tak ada, id tak cocok, atau enum salah (tidak menulis).

set -euo pipefail

KIND="${1:-}"
MODULE="${2:-}"
ROOT="$(pwd)"
INPUT_FILE=""
SLUG=""

shift 2 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --file) INPUT_FILE="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    *) echo "retest.sh: argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

case "$KIND" in
  index|subreport) ;;
  *)
    echo "retest.sh: kind harus 'index' atau 'subreport' (dapat: '$KIND')" >&2
    echo "Usage: retest.sh <index|subreport> <modul> [--slug SUB] [--root DIR] [--file FILE]" >&2
    exit 2
    ;;
esac

if [[ -z "$MODULE" ]]; then
  echo "retest.sh: nama modul wajib" >&2
  exit 2
fi

if [[ "$KIND" == "subreport" && -z "$SLUG" ]]; then
  echo "retest.sh: kind 'subreport' wajib --slug <sub-slug>" >&2
  exit 2
fi

if [[ -n "$INPUT_FILE" ]]; then
  PATCH="$(cat "$INPUT_FILE")"
else
  PATCH="$(cat)"
fi

OUT_DIR="$ROOT/.openqa/$MODULE"
if [[ "$KIND" == "subreport" ]]; then
  OUT_FILE="$OUT_DIR/$SLUG.json"
else
  OUT_FILE="$OUT_DIR/index.json"
fi

if [[ ! -f "$OUT_FILE" ]]; then
  echo "retest.sh: file target tidak ada: $OUT_FILE (jalankan qa-explorer dulu)" >&2
  exit 2
fi

MERGED="$(OUT_FILE="$OUT_FILE" python3 - "$PATCH" <<'PY'
import json, os, sys

out_file = os.environ["OUT_FILE"]
patch_raw = sys.argv[1]

VALID_STATUS = {"open", "fixed", "still_failing", "regressed"}
VALID_METHOD = {"playwright", "browser-use"}

def die(msg):
    print(f"retest.sh: {msg}", file=sys.stderr)
    sys.exit(1)

try:
    patch = json.loads(patch_raw)
except json.JSONDecodeError as e:
    die(f"patch JSON tidak bisa di-parse: {e}")

with open(out_file, encoding="utf-8") as fh:
    data = json.load(fh)

findings = data.get("findings") or []
by_id = {f.get("id"): f for f in findings if f.get("id")}

statuses = patch.get("statuses")
if not isinstance(statuses, list) or not statuses:
    die("'statuses' harus array non-kosong")

retested_at = patch.get("retested_at")

for i, s in enumerate(statuses):
    loc = f"statuses[{i}]"
    fid = s.get("id")
    if not fid:
        die(f"{loc}.id wajib")
    if fid not in by_id:
        die(f"{loc}.id '{fid}' tidak ada di {os.path.basename(out_file)} (findings: {sorted(by_id)})")
    st = s.get("status")
    if st not in VALID_STATUS:
        die(f"{loc}.status harus {sorted(VALID_STATUS)} (dapat: {st})")
    method = s.get("method")
    if method is not None and method not in VALID_METHOD:
        die(f"{loc}.method harus {sorted(VALID_METHOD)} (dapat: {method})")

    f = by_id[fid]
    f["status"] = st
    if method is not None:
        f["retest_method"] = method
    if s.get("note"):
        f["retest_note"] = s["note"]
    if retested_at:
        f["retested_at"] = retested_at

tally = {"fixed": 0, "still_failing": 0, "regressed": 0, "open": 0}
tested = 0
for f in findings:
    st = f.get("status")
    if st in tally:
        tally[st] += 1
        tested += 1

data["retest"] = {
    "retested_at": retested_at,
    "findings_tested": tested,
    "findings_total": len(findings),
    "fixed": tally["fixed"],
    "still_failing": tally["still_failing"],
    "regressed": tally["regressed"],
    "open": tally["open"],
}

print(json.dumps(data, indent=2, ensure_ascii=False))
PY
)"

printf '%s\n' "$MERGED" > "$OUT_FILE"
echo "retest.sh: status retest dimerge → $OUT_FILE" >&2
echo "$OUT_FILE"
