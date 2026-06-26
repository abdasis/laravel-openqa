#!/usr/bin/env bash
#
# close-issues.sh — tutup GitHub Issue bug yang sudah diverifikasi 'fixed' oleh retest.
#
# Untuk tiap finding di .openqa/<modul>/ yang punya status retest:
#   - status "fixed"        -> comment singkat (bukti retest) + tutup issue.
#   - "still_failing"/"regressed" -> comment status (issue dibiarkan OPEN).
#   - tanpa status / "open"       -> dilewati.
#
# Issue dipetakan dari finding via marker "<!-- qa:<id> -->" di body
# (ditanam oleh qa-explorer/scripts/issues.sh). Issue yang sudah CLOSED dilewati.
#
# Usage:
#   close-issues.sh <modul> [--root DIR] [--dry-run]
#
# Prasyarat: `gh` ter-auth. Exit non-zero bila gh tak ada / tak ter-auth / laporan tak ada.

set -euo pipefail

MODULE="${1:-}"
ROOT="$(pwd)"
DRY_RUN=0

shift 1 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "close-issues.sh: argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$MODULE" ]]; then
  echo "close-issues.sh: nama modul wajib. Usage: close-issues.sh <modul> [--root DIR] [--dry-run]" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "close-issues.sh: 'gh' (GitHub CLI) tidak ditemukan" >&2
  exit 2
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "close-issues.sh: gh belum ter-auth. Jalankan 'gh auth login'." >&2
  exit 2
fi

DIR="$ROOT/.openqa/$MODULE"
if [[ ! -d "$DIR" ]]; then
  echo "close-issues.sh: laporan tidak ditemukan: $DIR (jalankan qa-explorer dulu)" >&2
  exit 2
fi

# Ekstrak finding yang punya status, sebagai TSV: id \t status \t method \t note
ITEMS_TSV="$(MODULE="$MODULE" DIR="$DIR" python3 - <<'PY'
import glob, json, os

d = os.environ["DIR"]
RESERVED = {"meta.json", "explorer.json"}

files = []
idx = os.path.join(d, "index.json")
if os.path.isfile(idx):
    files.append(idx)
for f in sorted(glob.glob(os.path.join(d, "*.json"))):
    b = os.path.basename(f)
    if b in RESERVED or b == "index.json":
        continue
    files.append(f)

seen = set()
for path in files:
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        continue
    for fnd in data.get("findings") or []:
        fid = fnd.get("id")
        st = fnd.get("status")
        if not fid or fid in seen or not st or st == "open":
            continue
        seen.add(fid)
        note = " ".join((fnd.get("retest_note") or "").split())
        method = fnd.get("retest_method") or ""
        print("\t".join([fid, st, method, note]))
PY
)"

if [[ -z "$ITEMS_TSV" ]]; then
  echo "close-issues.sh: tidak ada finding dengan status retest. Jalankan retest dulu." >&2
  exit 0
fi

STATUS_LABEL_FIXED="Diverifikasi sudah diperbaiki via retest"
closed=0
commented=0
missing=0

while IFS=$'\t' read -r ID STATUS METHOD NOTE; do
  [[ -z "$ID" ]] && continue

  # Cari issue (open/closed) dengan marker finding ini.
  ISSUE_JSON="$(gh issue list --state all --search "in:body qa:$ID" --json number,state,body \
    --jq "[.[] | select(.body | contains(\"<!-- qa:$ID -->\"))] | first // empty" 2>/dev/null || true)"

  if [[ -z "$ISSUE_JSON" ]]; then
    echo "close-issues.sh: $ID — issue tidak ditemukan (skip)" >&2
    missing=$((missing + 1))
    continue
  fi

  NUM="$(printf '%s' "$ISSUE_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["number"])')"
  STATE="$(printf '%s' "$ISSUE_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["state"])')"

  METHOD_TXT="${METHOD:-retest}"
  NOTE_TXT="${NOTE:-(tanpa catatan)}"

  if [[ "$STATUS" == "fixed" ]]; then
    if [[ "$STATE" == "CLOSED" ]]; then
      echo "close-issues.sh: $ID — issue #$NUM sudah CLOSED (skip)" >&2
      continue
    fi
    COMMENT="✅ **$STATUS_LABEL_FIXED** ($METHOD_TXT).

$NOTE_TXT

_Ditutup otomatis oleh qa-issues-fixer setelah retest lulus._"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "close-issues.sh: [dry-run] $ID — comment + close issue #$NUM" >&2
      continue
    fi
    gh issue comment "$NUM" --body "$COMMENT" >/dev/null
    gh issue close "$NUM" --reason completed >/dev/null
    echo "close-issues.sh: $ID — issue #$NUM ditutup (fixed)" >&2
    closed=$((closed + 1))
  else
    # still_failing / regressed -> comment status, biarkan open.
    if [[ "$STATE" == "CLOSED" ]]; then
      LABEL="Retest menemukan masalah kembali"
      VERB="reopen + comment"
    else
      LABEL="Retest belum lulus"
      VERB="comment"
    fi
    ICON="⚠️"
    COMMENT="$ICON **$LABEL** — status: \`$STATUS\` ($METHOD_TXT).

$NOTE_TXT

_Issue dibiarkan terbuka; fix_prompt belum tuntas._"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "close-issues.sh: [dry-run] $ID — $VERB issue #$NUM (status $STATUS)" >&2
      continue
    fi
    if [[ "$STATE" == "CLOSED" ]]; then
      gh issue reopen "$NUM" >/dev/null 2>&1 || true
    fi
    gh issue comment "$NUM" --body "$COMMENT" >/dev/null
    echo "close-issues.sh: $ID — issue #$NUM dikomentari (status $STATUS)" >&2
    commented=$((commented + 1))
  fi
done <<< "$ITEMS_TSV"

echo "close-issues.sh: selesai — $closed ditutup, $commented dikomentari (tetap open), $missing tanpa issue." >&2
