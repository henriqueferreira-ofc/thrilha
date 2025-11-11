#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "dist directory not found. Run 'npm run build' first." >&2
  exit 1
fi

REMOTE_URL="$(git -C "$ROOT_DIR" remote get-url origin)"
if [ -z "$REMOTE_URL" ]; then
  echo "Unable to determine git remote URL." >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

cp -R "$DIST_DIR"/. "$TMP_DIR"/

pushd "$TMP_DIR" >/dev/null
  git init
  git checkout -b gh-pages
  git config user.name "thrilha-deploy"
  git config user.email "deploy@thrilha.local"
  git add .
  git commit -m "Deploy to GitHub Pages"
  git push -f "$REMOTE_URL" gh-pages
popd >/dev/null

echo "Deployment pushed to gh-pages. Ensure GitHub Pages is configured to serve that branch (root)."
