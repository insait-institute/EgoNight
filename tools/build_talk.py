#!/usr/bin/env python3
"""Build talk.html, the interactive slides embedded at the top of index.html.

tools/talk.html is the deck in claude.ai Artifact form (no document skeleton),
so the same file can be previewed as an Artifact. This script wraps it in a
document. Media paths (fig/...) are already relative to the page root, so they
are only checked: a referenced file that does not exist stops the build.
"""
import re
from pathlib import Path

PAGE = Path(__file__).resolve().parents[1]
src = (PAGE / "tools/talk.html").read_text()

missing = sorted({m for m in re.findall(r"""["'](fig/[A-Za-z0-9_./-]+)["']""", src)
                  if not (PAGE / m).is_file()})
if missing:
    raise SystemExit("talk.html: missing assets: " + ", ".join(missing))

# the deck's title, fonts and styles come before its first element
head, sep, body = src.partition('<div id="viewport">')
if not sep:
    raise SystemExit('talk.html: <div id="viewport"> not found in tools/talk.html')
doc = ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<link rel="icon" type="image/png" href="fig/icon.png">\n'
       '<style>html,body{margin:0}img{max-width:100%}</style>\n'
       + head.strip() + '\n</head>\n<body>\n' + sep + body.strip() + '\n</body>\n</html>\n')
(PAGE / "talk.html").write_text(doc)
print("talk.html", len(doc) // 1000, "kB")
