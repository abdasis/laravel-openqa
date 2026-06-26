#!/usr/bin/env bash
#
# issues.sh — buat GitHub Issue dari findings + recommendations hasil qa-explorer.
#
# Satu issue per finding (bug) dan per recommendation (feature request).
# Dedup via marker tersembunyi di body: "<!-- qa:<id> -->". Issue yang sudah
# punya marker id-nya (open ATAU closed) dilewati — aman dijalankan berulang.
#
# Membaca .openqa/<modul>/index.json + semua <sub-slug>.json (kecuali reserved),
# kumpulkan findings & recommendations, lalu create issue lewat `gh`.
#
# Usage:
#   issues.sh <modul> [--root DIR] [--dry-run] [--only bugs|features]
#
# Prasyarat: `gh` ter-auth, label 'bug' & 'feature-request' ada (auto-create bila tak ada).
# Exit non-zero bila gh tak ada / tak ter-auth / laporan tak ditemukan.

set -euo pipefail

MODULE="${1:-}"
ROOT="$(pwd)"
DRY_RUN=0
ONLY=""
FORCE=0

shift 1 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --only) ONLY="$2"; shift 2 ;;
    --force) FORCE=1; shift ;;
    *) echo "issues.sh: argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$MODULE" ]]; then
  echo "issues.sh: nama modul wajib. Usage: issues.sh <modul> [--root DIR] [--dry-run] [--only bugs|features]" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "issues.sh: 'gh' (GitHub CLI) tidak ditemukan" >&2
  exit 2
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "issues.sh: gh belum ter-auth. Jalankan 'gh auth login'." >&2
  exit 2
fi

DIR="$ROOT/.openqa/$MODULE"
if [[ ! -d "$DIR" ]]; then
  echo "issues.sh: laporan tidak ditemukan: $DIR (jalankan qa-explorer dulu)" >&2
  exit 2
fi

# Pastikan label ada (idempoten — abaikan error bila sudah ada).
gh label create "bug" --color "d73a4a" --description "Bug report" >/dev/null 2>&1 || true
gh label create "feature-request" --color "84b6eb" --description "Feature request" >/dev/null 2>&1 || true
gh label create "qa-explorer" --color "5319e7" --description "Temuan QA Explorer" >/dev/null 2>&1 || true

# Ekstrak daftar item (findings + recommendations) sebagai TSV via python3.
# Kolom: kind \t id \t title \t labels \t body(base64)
ITEMS_TSV="$(MODULE="$MODULE" DIR="$DIR" ONLY="$ONLY" python3 - <<'PY'
import base64, glob, json, os

module = os.environ["MODULE"]
d = os.environ["DIR"]
only = os.environ.get("ONLY", "")

RESERVED = {"meta.json", "explorer.json"}

def b64(s):
    return base64.b64encode(s.encode("utf-8")).decode("ascii")

def emit(kind, id_, title, labels, body):
    title = " ".join((title or "").split())
    print("\t".join([kind, id_, title, labels, b64(body)]))

SEV_LABEL = {"critical": "bug", "warning": "bug", "info": "bug"}
SEV_TAG = {"critical": "Critical", "warning": "Warning", "info": "Info"}

files = []
idx = os.path.join(d, "index.json")
if os.path.isfile(idx):
    files.append(idx)
for f in sorted(glob.glob(os.path.join(d, "*.json"))):
    if os.path.basename(f) in RESERVED or os.path.basename(f) == "index.json":
        continue
    files.append(f)

seen_ids = set()

for path in files:
    try:
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        continue

    feature = data.get("feature") or module
    base_url = data.get("base_url") or ""

    if only != "features":
        for fnd in data.get("findings") or []:
            fid = fnd.get("id")
            if not fid or fid in seen_ids:
                continue
            sev = fnd.get("severity", "info")
            # Hanya bug yang layak issue: critical & warning (punya fix_prompt).
            if sev not in ("critical", "warning"):
                continue
            seen_ids.add(fid)
            page = fnd.get("page") or ""
            tag = SEV_TAG.get(sev, "Info")
            lines = [
                f"<!-- qa:{fid} -->",
                f"**Modul:** {feature}  ",
                f"**Severity:** {tag}  ",
                f"**Halaman:** `{page}`  " if page else "",
                f"**Finding ID:** `{fid}`  ",
                "",
                "## Deskripsi",
                "",
                f"**Aktual:** {fnd.get('actual','-')}  ",
                f"**Ekspektasi:** {fnd.get('expected','-')}  ",
                "",
                "## Saran Perbaikan",
                "",
                fnd.get("recommendation", "-"),
            ]
            if fnd.get("fix_prompt"):
                lines += [
                    "",
                    "## Prompt Perbaikan (AI)",
                    "",
                    "```",
                    fnd["fix_prompt"],
                    "```",
                ]
            if fnd.get("related_use_case"):
                lines += ["", f"_Use case terkait: {fnd['related_use_case']}_"]
            if base_url:
                lines += ["", f"_Base URL: {base_url}_"]
            body = "\n".join(x for x in lines if x is not None)
            title = f"[Bug][{tag}] {fnd.get('title','(tanpa judul)')}"
            emit("bug", fid, title, "bug,qa-explorer", body)

    if only != "bugs":
        for rec in data.get("recommendations") or []:
            rid = rec.get("id")
            if not rid or rid in seen_ids:
                continue
            seen_ids.add(rid)
            lines = [
                f"<!-- qa:{rid} -->",
                f"**Modul:** {feature}  ",
                f"**Recommendation ID:** `{rid}`  ",
                f"**Nilai bisnis:** {rec.get('business_value','-')} · **Kompleksitas:** {rec.get('complexity','-')}  ",
                "",
                "## Masalah / Kebutuhan",
                "",
                rec.get("problem", "-"),
                "",
                "## Solusi yang Diusulkan",
                "",
                rec.get("solution", "-"),
                "",
                "## Nilai untuk User",
                "",
                rec.get("value", "-"),
            ]
            body = "\n".join(lines)
            title = f"[Feature Request] {rec.get('title','(tanpa judul)')}"
            emit("feature", rid, title, "feature-request,qa-explorer", body)
PY
)"

if [[ -z "$ITEMS_TSV" ]]; then
  echo "issues.sh: tidak ada findings (critical/warning) atau recommendations untuk dijadikan issue." >&2
  exit 0
fi

created=0
skipped=0

# Cache judul issue OPEN existing untuk deteksi duplikat-semantik (judul mirip).
# Format tiap baris: "<number>\t<title>".
EXISTING_TITLES="$(gh issue list --state open --limit 400 --json number,title \
  --jq '.[] | "\(.number)\t\(.title)"' 2>/dev/null || true)"

# Judul yang sudah diputuskan dibuat di run ini (cegah duplikat antar-item batch,
# mis. recommendation identik di index.json dan subreport). Format: "BATCH\t<title>".
BATCH_TITLES=""

# similar <title> -> cetak "#<num>\t<existing-title>" untuk issue OPEN paling mirip
# (token-overlap Jaccard >= 0.6 setelah strip tag [Bug]/[Feature Request]/severity),
# atau kosong bila tak ada yang mirip.
similar_issue() {
  TITLE="$1" TITLES="$2" python3 - <<'PY'
import os, re

def norm(s):
    s = s.lower()
    s = re.sub(r"\[(bug|feature request|critical|warning|info)\]", " ", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    toks = [t for t in s.split() if len(t) > 2]
    stop = {"untuk", "dan", "yang", "tidak", "pada", "dari", "the", "for", "and"}
    return set(t for t in toks if t not in stop)

target = norm(os.environ["TITLE"])
best, best_score, best_line = None, 0.0, ""
for line in os.environ.get("TITLES", "").splitlines():
    if "\t" not in line:
        continue
    num, title = line.split("\t", 1)
    other = norm(title)
    if not target or not other:
        continue
    inter = len(target & other)
    union = len(target | other)
    score = inter / union if union else 0.0
    if score > best_score:
        best_score, best, best_line = score, num, title
if best_score >= 0.6:
    print(f"#{best}\t{best_line}")
PY
}

while IFS=$'\t' read -r KIND ID TITLE LABELS BODY_B64; do
  [[ -z "$ID" ]] && continue

  # Dedup kuat: cari marker "<!-- qa:<id> -->" di body issue (open atau closed).
  EXISTING="$(gh issue list --state all --search "in:body qa:$ID" --json number,body \
    --jq "[.[] | select(.body | contains(\"<!-- qa:$ID -->\")) | .number] | first // empty" 2>/dev/null || true)"

  if [[ -n "$EXISTING" ]]; then
    echo "issues.sh: SKIP $ID — sudah ada issue #$EXISTING (marker)" >&2
    skipped=$((skipped + 1))
    continue
  fi

  # Dedup lunak antar-item batch: judul identik/mirip dengan item lain di run ini
  # (mis. recommendation sama di index.json & subreport). Selalu skip — ini duplikat nyata.
  BATCH_SIM="$(similar_issue "$TITLE" "$BATCH_TITLES" || true)"
  if [[ -n "$BATCH_SIM" ]]; then
    echo "issues.sh: SKIP $ID — duplikat judul dengan item lain di laporan ini (\"${BATCH_SIM#*$'\t'}\")" >&2
    skipped=$((skipped + 1))
    continue
  fi

  # Dedup lunak: judul mirip dengan issue OPEN existing. Tanpa --force → skip + warn.
  SIM="$(similar_issue "$TITLE" "$EXISTING_TITLES" || true)"
  if [[ -n "$SIM" ]]; then
    SIM_NUM="${SIM%%$'\t'*}"
    SIM_TITLE="${SIM#*$'\t'}"
    if [[ "$FORCE" -eq 0 ]]; then
      echo "issues.sh: SKIP $ID — mirip issue existing $SIM_NUM \"$SIM_TITLE\" (pakai --force untuk tetap buat)" >&2
      skipped=$((skipped + 1))
      continue
    fi
    echo "issues.sh: WARN $ID — mirip $SIM_NUM \"$SIM_TITLE\", tetap dibuat (--force)" >&2
  fi

  # Catat judul ini ke batch agar item berikutnya yang mirip ikut ter-dedup.
  BATCH_TITLES="${BATCH_TITLES}${BATCH_TITLES:+$'\n'}BATCH"$'\t'"$TITLE"

  BODY="$(printf '%s' "$BODY_B64" | base64 -d)"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "issues.sh: [dry-run] akan buat ($KIND) $ID — $TITLE [labels: $LABELS]" >&2
    continue
  fi

  URL="$(gh issue create --title "$TITLE" --label "$LABELS" --body "$BODY" 2>&1)" || {
    echo "issues.sh: GAGAL buat issue $ID: $URL" >&2
    continue
  }
  echo "issues.sh: dibuat $ID → $URL" >&2
  created=$((created + 1))
done <<< "$ITEMS_TSV"

echo "issues.sh: selesai — $created dibuat, $skipped dilewati (sudah ada)." >&2
