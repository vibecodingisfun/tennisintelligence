#!/bin/sh
# Copies the public site into dist/ for Cloudflare Pages. Run from the repo root.
# Deploy: tools/build.sh && npx wrangler@3 pages deploy   (wrangler reads functions/ and wrangler.toml from here)
set -eu
cd "$(dirname "$0")/.."
rm -rf dist
mkdir dist
for d in assets charts data maindraw plots radar styles topics usta; do
  [ -d "$d" ] && cp -R "$d" dist/
done
cp index.html 404.html robots.txt sitemap.xml _headers dist/
find dist -name '*.check.mjs' -delete
find dist -name '.DS_Store' -delete
echo "dist ready: $(find dist -type f | wc -l | tr -d ' ') files"
