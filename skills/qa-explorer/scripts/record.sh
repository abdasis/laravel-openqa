#!/usr/bin/env bash
#
# record.sh — utilitas rekaman bukti QA exploration ke .openqa/<modul>/storage/.
#
# Dua sub-perintah:
#
#   shot   — ambil 1 screenshot via browser-use ke folder media sub-fitur.
#            File: storage/<sub-slug>/<uc>-<step>.png  (uc & step di-zero-pad 2 digit).
#
#   video  — rangkai semua PNG (urut nama, rekursif) jadi 1 MP4 sesi via ffmpeg.
#            Output: storage/video.mp4  (slideshow, default 1 fps per frame).
#
# Rekaman video = slideshow dari screenshot per-step yang sudah diambil, BUKAN
# screencast real-time. Andal & deterministik: tak ada frame muxing CDP yang rapuh.
#
# Usage:
#   record.sh shot  <modul> --sub <sub-slug> --uc <n> --step <n> [--root DIR]
#   record.sh video <modul> [--fps N] [--root DIR]
#
# Exit non-zero bila argumen kurang atau tool (browser-use/ffmpeg) tak ada.

set -euo pipefail

CMD="${1:-}"
MODULE="${2:-}"
ROOT="$(pwd)"
SUB=""
UC=""
STEP=""
FPS="1"

shift 2 2>/dev/null || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="$2"; shift 2 ;;
    --sub)  SUB="$2"; shift 2 ;;
    --uc)   UC="$2"; shift 2 ;;
    --step) STEP="$2"; shift 2 ;;
    --fps)  FPS="$2"; shift 2 ;;
    *) echo "record.sh: argumen tidak dikenal: $1" >&2; exit 2 ;;
  esac
done

if [[ "$CMD" != "shot" && "$CMD" != "video" ]]; then
  echo "record.sh: perintah harus 'shot' atau 'video' (dapat: '$CMD')" >&2
  echo "Usage: record.sh shot <modul> --sub <slug> --uc <n> --step <n> [--root DIR]" >&2
  echo "       record.sh video <modul> [--fps N] [--root DIR]" >&2
  exit 2
fi

if [[ -z "$MODULE" ]]; then
  echo "record.sh: nama modul wajib" >&2
  exit 2
fi

STORAGE="$ROOT/.openqa/$MODULE/storage"

pad2() { printf '%02d' "$1"; }

if [[ "$CMD" == "shot" ]]; then
  if [[ -z "$SUB" || -z "$UC" || -z "$STEP" ]]; then
    echo "record.sh shot: wajib --sub, --uc, --step" >&2
    exit 2
  fi
  if ! command -v browser-use >/dev/null 2>&1; then
    echo "record.sh: 'browser-use' tidak ditemukan di PATH" >&2
    exit 3
  fi
  DIR="$STORAGE/$SUB"
  mkdir -p "$DIR"
  OUT="$DIR/$(pad2 "$UC")-$(pad2 "$STEP").png"
  browser-use screenshot "$OUT" >/dev/null
  echo "record.sh: screenshot → $OUT" >&2
  echo "$OUT"
  exit 0
fi

# CMD == video
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "record.sh: 'ffmpeg' tidak ditemukan di PATH — lewati pembuatan video" >&2
  exit 3
fi
if [[ ! -d "$STORAGE" ]]; then
  echo "record.sh: folder storage tidak ada: $STORAGE" >&2
  exit 3
fi

# Kumpulkan semua PNG (rekursif), urut nama, lewat list file ffmpeg concat.
mapfile -t SHOTS < <(find "$STORAGE" -type f -name '*.png' | sort)
if [[ ${#SHOTS[@]} -eq 0 ]]; then
  echo "record.sh: tak ada PNG di $STORAGE — tak ada yang direkam" >&2
  exit 3
fi

LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT
DUR="$(awk "BEGIN { printf \"%.4f\", 1/$FPS }")"
for s in "${SHOTS[@]}"; do
  printf "file '%s'\nduration %s\n" "$s" "$DUR" >> "$LIST"
done
# ffmpeg concat demuxer butuh frame terakhir diulang tanpa duration.
printf "file '%s'\n" "${SHOTS[-1]}" >> "$LIST"

OUT="$STORAGE/video.mp4"
# pad ke dimensi genap (libx264 wajib) + format yuv420p biar bisa diputar luas.
ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" \
  -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p" \
  -r 30 "$OUT"
echo "record.sh: video (${#SHOTS[@]} frame @ ${FPS}fps) → $OUT" >&2
echo "$OUT"
