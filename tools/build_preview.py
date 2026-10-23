#!/usr/bin/env python3
"""Write build/preview.html: index.html in claude.ai Artifact form, for previewing the page.

An Artifact supplies its own document skeleton, so the doctype, <html>, <head>
and <body> tags are dropped. It also cannot load third-party stylesheets,
embeds or images, so the preview lacks the Font Awesome icons, the YouTube
video, the Hugging Face logo and the contact photos; the published page is
unaffected. Prints the local files the page references, for the Artifact's
`files` map.
"""
import re
from pathlib import Path

PAGE = Path(__file__).resolve().parents[1]
src = (PAGE / "index.html").read_text()
src = re.sub(r"<!DOCTYPE html>|</?html[^>]*>|</?head>|</?body>", "", src)
src = re.sub(r'\s*<link rel="stylesheet" href="https://cdnjs[^"]*">', "", src)
src = re.sub(r"<title>[^<]*</title>", '<title>EgoNight Project Page</title>\n<meta name="claude:viewport-fit-sides" content="cover">', src, count=1)
(PAGE / "build").mkdir(exist_ok=True)
(PAGE / "build/preview.html").write_text(src.strip() + "\n")

refs = set()
for f in ("index.html", "talk.html", "site.js"):
    refs |= set(re.findall(r"""["'(]((?:fig|site|talk)[A-Za-z0-9_./-]*\.(?:png|jpe?g|webp|gif|mp4|css|js|html))""",
                           (PAGE / f).read_text()))
# site.js builds clip paths at run time from data-clips names
for names in re.findall(r'data-clips="([^"]+)"', (PAGE / "index.html").read_text()):
    for n in names.split(","):
        kind = "_night" if n.startswith("oxford") else "_dn"
        refs |= {f"fig/video/{n}{kind}.mp4", f"fig/video/{n}{kind}.jpg"}
refs |= {f"fig/qa_example_{t}.png" for t in re.findall(r"'qa_example_' \+ TYPES|\['[^']+', '([a-z_]+)'", (PAGE / "site.js").read_text()) if t}
missing = sorted(r for r in refs if not (PAGE / r).is_file())
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
size = sum((PAGE / r).stat().st_size for r in refs)
print(f"build/preview.html; {len(refs)} referenced files, {size / 1e6:.1f} MB")
for r in sorted(refs):
    print(r)
