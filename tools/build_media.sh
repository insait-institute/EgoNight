#!/usr/bin/env bash
# Re-encode the day/night GIFs in fig/ as web video for index.html and talk.html.
#
# Each day/night pair has identical frame counts, so it is stacked into ONE
# video (day on top, night below). The page draws the two halves onto a
# canvas, which keeps the day/night wipe frame-locked; two separate <video>
# elements would drift. Night-only Oxford clips are encoded as they are.
# The original GIFs are left untouched (poster.html and older links use them).
#
#   tools/build_media.sh          # needs ffmpeg; ~1 min
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=fig/video
mkdir -p "$OUT"

enc() { # enc <out.mp4> <ffmpeg input/filter args...>
  local out=$1; shift
  ffmpeg -hide_banner -loglevel error -y "$@" -an -c:v libx264 -preset slow -crf 22 \
    -pix_fmt yuv420p -movflags +faststart "$out"
}

for name in Apartment1 Sofia grocery synthetic1 synthetic2 synthetic3; do
  day=fig/${name}_day.gif night=fig/${name}_night.gif
  nd=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$day")
  nn=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$night")
  [ "$nd" = "$nn" ] || { echo "$name: day has $nd frames, night has $nn; not aligned" >&2; exit 1; }
  enc "$OUT/${name}_dn.mp4" -i "$day" -i "$night" -filter_complex "[0:v][1:v]vstack=inputs=2,scale=trunc(iw/2)*2:trunc(ih/2)*2"
  ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$OUT/${name}_dn.mp4" -frames:v 1 -q:v 3 "$OUT/${name}_dn.jpg"
  echo "${name}_dn.mp4 $(du -h "$OUT/${name}_dn.mp4" | cut -f1) ($nd frames)"
done

for name in oxford1 oxford2 oxford3; do
  enc "$OUT/${name}_night.mp4" -i "fig/${name}_night.gif" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"
  ffmpeg -hide_banner -loglevel error -y -ss 1 -i "$OUT/${name}_night.mp4" -frames:v 1 -q:v 3 "$OUT/${name}_night.jpg"
  echo "${name}_night.mp4 $(du -h "$OUT/${name}_night.mp4" | cut -f1)"
done
