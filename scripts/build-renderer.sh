#!/usr/bin/env sh
# Builds the FocusTube renderer (the web app) into ../app using a relative
# asset base so the desktop shell can serve it from the loopback server.
set -e

cd "$(dirname "$0")/../renderer"
rm -rf ../app
npx vite build --base=./ --outDir ../app

echo "Renderer built -> $(cd .. && pwd)/app"