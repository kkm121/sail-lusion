#!/bin/bash
# build the worktree's v4 and capture phase one: tools/p1shots.sh <prefix> [desktop|mobile] [points]
set -e
cd /c/Users/muthu/Downloads/frontend/p1/v4 && MSYS_NO_PATHCONV=1 npx vite build --base=/ --outDir=../dist-p1 --emptyOutDir > /tmp/p1build.log 2>&1 || { tail -30 /tmp/p1build.log; exit 1; }
cd .. && MSYS_NO_PATHCONV=1 BASE=http://127.0.0.1:4700 ROUTE=/discover timeout 280 node tools/v3lab.mjs ${2:-desktop} ${3:-0.15,0.3,0.345,0.39,0.43,0.46,0.49,0.51,0.53,0.55} $1 2>&1 | grep -v "^    at\|Clock\|X4122\|^ \"warn" | tail -4
FF=/c/Users/muthu/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin
"$FF/ffmpeg" -v error -y -i shots/$1-%d.png -vf "scale=640:-1,tile=5x2" -frames:v 1 shots/$1-sheet.png
