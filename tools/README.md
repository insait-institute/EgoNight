# Page tools

```
index.html            the project page (hand-written); styles in site.css, behaviour in site.js
talk.html             interactive slides embedded at the top of index.html (generated)
style.css             old stylesheet, still used by benchmark.html
fig/video/            day/night clips as web video (generated from the GIFs in fig/)
fig/talk/             logos and photo taken from the ICLR slides (EgoNight_slide.ppt)
tools/talk.html       slides source, in claude.ai Artifact form (no document skeleton)
tools/build_talk.py   tools/talk.html -> talk.html; fails on a missing fig/ asset
tools/build_media.sh  fig/*_day.gif + fig/*_night.gif -> fig/video/*_dn.mp4 (day stacked over night)
tools/build_preview.py index.html -> build/preview.html, Artifact form, for previewing the page
```

Each day/night pair is one video with the day frames above the night frames;
the page draws both halves onto a canvas, so the wipe between them stays
frame-locked. `build_media.sh` refuses a pair whose frame counts differ.

Rebuild after editing:

```bash
tools/build_media.sh          # only when the GIFs change; needs ffmpeg
python3 tools/build_talk.py
```

The slide numbers come from the paper and the ICLR slides: the leaderboard
matches the table in index.html, the day/night bars are the values printed in
the paper's gap figure (fig/new_gap.png).
