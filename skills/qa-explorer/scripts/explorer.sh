#!/usr/bin/env bash
#
# explorer.sh — validator + writer untuk hasil QA exploration (format TestSprite).
#
# Skill (Claude) menjelajah browser, merakit JSON, lalu pipe ke script ini.
# Script TIDAK memanggil browser sendiri — hanya validasi skema & tulis rapi.
#
# Usage:
#   <json di stdin> | explorer.sh explorer  <modul> [--root <project_root>]
#   <json di stdin> | explorer.sh index     <modul> [--root <project_root>]
#   <json di stdin> | explorer.sh meta      <modul> [--root <project_root>]
#   <json di stdin> | explorer.sh subreport <modul> --slug <sub-slug> [--root <project_root>]
#   explorer.sh explorer <modul> --file payload.json
#
# Output:
#   explorer  -> .openqa/<modul>/explorer.json
#   index     -> .openqa/<modul>/index.json
#   meta      -> .openqa/<modul>/meta.json
#   subreport -> .openqa/<modul>/<sub-slug>.json   (laporan scoped per sub-fitur)
# Selalu juga membuat folder placeholder .openqa/<modul>/e2e/ dan .openqa/<modul>/storage/.
# Exit non-zero jika skema tidak valid (tidak menulis file).

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
    *) echo "explorer.sh: argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

case "$KIND" in
  explorer|index|meta|subreport) ;;
  *)
    echo "explorer.sh: kind harus 'explorer', 'index', 'meta', atau 'subreport' (dapat: '$KIND')" >&2
    echo "Usage: explorer.sh <explorer|index|meta|subreport> <modul> [--slug SUB] [--root DIR] [--file FILE]" >&2
    exit 2
    ;;
esac

if [[ -z "$MODULE" ]]; then
  echo "explorer.sh: nama modul wajib" >&2
  exit 2
fi

if [[ "$KIND" == "subreport" && -z "$SLUG" ]]; then
  echo "explorer.sh: kind 'subreport' wajib --slug <sub-slug>" >&2
  exit 2
fi

# Baca payload dari --file atau stdin.
if [[ -n "$INPUT_FILE" ]]; then
  PAYLOAD="$(cat "$INPUT_FILE")"
else
  PAYLOAD="$(cat)"
fi

OUT_DIR="$ROOT/.openqa/$MODULE"
if [[ "$KIND" == "subreport" ]]; then
  OUT_FILE="$OUT_DIR/$SLUG.json"
else
  OUT_FILE="$OUT_DIR/$KIND.json"
fi

# Validasi + pretty-print via python3. Menulis ke stdout jika valid.
VALIDATED="$(KIND="$KIND" MODULE="$MODULE" SLUG="$SLUG" python3 - "$PAYLOAD" <<'PY'
import json, os, sys

kind = os.environ["KIND"]
module = os.environ["MODULE"]
slug = os.environ.get("SLUG", "")
raw = sys.argv[1]

def die(msg):
    print(f"explorer.sh: skema tidak valid: {msg}", file=sys.stderr)
    sys.exit(1)

try:
    data = json.loads(raw)
except json.JSONDecodeError as e:
    die(f"JSON tidak bisa di-parse: {e}")

if not isinstance(data, dict):
    die("root harus object")

# Field umum.
for f in ("module", "feature"):
    if not data.get(f):
        die(f"field '{f}' wajib")
if data.get("module") != module:
    die(f"field module '{data.get('module')}' tidak cocok argumen '{module}'")

data.setdefault("schema_version", "1.0")

VALID_OUTCOMES = {"succeeded", "ui_bug", "incomplete", "skipped"}
VALID_SEVERITY = {"critical", "warning", "info"}
VALID_LEVEL = {"tinggi", "sedang", "rendah"}


def validate_use_cases(ucs):
    """Validasi array use_cases (skema explorer) dan kembalikan counters."""
    if not isinstance(ucs, list) or not ucs:
        die("'use_cases' harus array non-kosong")
    for i, uc in enumerate(ucs):
        loc = f"use_cases[{i}]"
        if not uc.get("name"):
            die(f"{loc}.name wajib")
        outcome = uc.get("outcome")
        if outcome not in VALID_OUTCOMES:
            die(f"{loc}.outcome harus salah satu {sorted(VALID_OUTCOMES)} (dapat: {outcome})")
        trace = uc.get("trace") or []
        if outcome == "skipped":
            if trace:
                die(f"{loc}: outcome 'skipped' tidak boleh punya trace")
            if not uc.get("why_skipped"):
                die(f"{loc}: outcome 'skipped' wajib 'why_skipped'")
        else:
            if not trace:
                die(f"{loc}: outcome '{outcome}' wajib punya trace non-kosong")
        if outcome == "succeeded" and not uc.get("success_signal"):
            die(f"{loc}: outcome 'succeeded' wajib 'success_signal'")
        if outcome == "incomplete" and not uc.get("why_incomplete"):
            die(f"{loc}: outcome 'incomplete' wajib 'why_incomplete'")
        if outcome == "ui_bug" and not uc.get("defect_summary"):
            die(f"{loc}: outcome 'ui_bug' wajib 'defect_summary'")
        for j, step in enumerate(trace):
            st = step.get("step_type", "action")
            sloc = f"{loc}.trace[{j}]"
            if st == "wait":
                if not step.get("wait_note"):
                    die(f"{sloc}: step wait wajib 'wait_note'")
            elif st == "action":
                if not step.get("action"):
                    die(f"{sloc}: step action wajib 'action'")
            else:
                die(f"{sloc}: step_type harus 'action' atau 'wait' (dapat: {st})")
    counters = {"use_cases_walked": 0, "succeeded": 0, "ui_bug": 0, "incomplete": 0, "skipped": 0}
    for uc in ucs:
        counters[uc["outcome"]] += 1
        if uc["outcome"] != "skipped":
            counters["use_cases_walked"] += 1
    return counters


def validate_findings(findings, recs):
    """Validasi findings + recommendations (skema index/subreport)."""
    if not isinstance(findings, list):
        die("'findings' harus array")
    for i, f in enumerate(findings):
        loc = f"findings[{i}]"
        if f.get("severity") not in VALID_SEVERITY:
            die(f"{loc}.severity harus {sorted(VALID_SEVERITY)} (dapat: {f.get('severity')})")
        for req in ("title", "actual", "expected", "recommendation"):
            if not f.get(req):
                die(f"{loc}.{req} wajib")
        # semua severity WAJIB membawa fix_prompt siap-paste ke LLM coding agent.
        if not f.get("fix_prompt"):
            die(f"{loc}.fix_prompt wajib untuk semua severity (critical/warning/info)")
    if not isinstance(recs, list):
        die("'recommendations' harus array")
    for i, r in enumerate(recs):
        loc = f"recommendations[{i}]"
        for lvl in ("business_value", "complexity"):
            if r.get(lvl) is not None and r.get(lvl) not in VALID_LEVEL:
                die(f"{loc}.{lvl} harus {sorted(VALID_LEVEL)} (dapat: {r.get(lvl)})")


def severity_summary(findings, recs):
    sev = {"critical": 0, "warning": 0, "info": 0}
    for f in findings:
        sev[f["severity"]] += 1
    return {
        "findings_total": len(findings),
        "critical": sev["critical"],
        "warning": sev["warning"],
        "info": sev["info"],
        "recommendations": len(recs),
    }


if kind == "explorer":
    data["counters"] = validate_use_cases(data.get("use_cases"))
    data.setdefault("status", "done")

elif kind == "index":
    findings = data.get("findings", [])
    recs = data.get("recommendations", [])
    validate_findings(findings, recs)
    data.setdefault("summary", {})
    data["summary"].update(severity_summary(findings, recs))

elif kind == "subreport":
    # Laporan scoped per sub-fitur: WAJIB 'page', boleh punya use_cases + findings.
    if not data.get("page"):
        die("subreport wajib field 'page' (path halaman sub-fitur)")
    ucs = data.get("use_cases")
    if ucs is not None:
        walked = validate_use_cases(ucs)
        data.setdefault("summary", {})
        data["summary"].update({
            "use_cases_walked": walked["use_cases_walked"],
            "succeeded": walked["succeeded"],
            "ui_bug": walked["ui_bug"],
            "incomplete": walked["incomplete"],
            "skipped": walked["skipped"],
        })
    findings = data.get("findings", [])
    recs = data.get("recommendations", [])
    validate_findings(findings, recs)
    data.setdefault("summary", {})
    data["summary"].update(severity_summary(findings, recs))

elif kind == "meta":
    if not data.get("base_url"):
        die("meta wajib field 'base_url'")
    creds = data.get("credentials", {})
    if not isinstance(creds, dict):
        die("'credentials' harus object {role_key: {email, password, role}}")
    for key, c in creds.items():
        if not isinstance(c, dict):
            die(f"credentials.{key} harus object")
        for req in ("email", "password", "role"):
            if not c.get(req):
                die(f"credentials.{key}.{req} wajib")
    if "notes" in data and not isinstance(data["notes"], list):
        die("'notes' harus array string")

print(json.dumps(data, indent=2, ensure_ascii=False))
PY
)"

mkdir -p "$OUT_DIR"
# Folder placeholder: target playwright spec (e2e/) & screenshot (storage/).
mkdir -p "$OUT_DIR/e2e" "$OUT_DIR/storage"
printf '%s\n' "$VALIDATED" > "$OUT_FILE"
echo "explorer.sh: ditulis → $OUT_FILE" >&2
echo "$OUT_FILE"
