#!/bin/sh
# FocusTube wrapper script.
#
# Electron's ozone platform (X11 vs Wayland) and GPU flags are initialized
# BEFORE the main process JavaScript runs, so they cannot be changed from
# main.js. This wrapper sets them automatically so a plain `focustube`
# command just works on Ubuntu/Wayland — no flags needed.
#
# The combination --ozone-platform=x11 --disable-gpu reliably works on
# Ubuntu/Wayland: XWayland provides a working X11 path when native Wayland
# GPU crashes, and --disable-gpu prevents the GPU-process segfault.

REAL_BINARY="$(dirname "$0")/focustube-bin"

# Force X11 under Wayland (must be set before Electron starts)
if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
  export ELECTRON_OZONE_PLATFORM_HINT=x11
fi

exec "$REAL_BINARY" --ozone-platform=x11 --disable-gpu "$@"
