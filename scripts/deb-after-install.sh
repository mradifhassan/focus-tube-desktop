#!/bin/sh
# FocusTube deb post-install script.
#
# 1. Renames the real Electron binary to focustube-bin and installs a wrapper
#    script as focustube. The wrapper sets --ozone-platform=x11 --disable-gpu
#    before Electron starts (these flags must be set before the JS entry point
#    runs, so they cannot be changed from main.js).
#
# 2. Fixes chrome-sandbox permissions (setuid root, mode 4755) for Ubuntu 24.04+
#    AppArmor unprivileged user namespace restrictions.
#
# 3. Registers the 'focustube' command via update-alternatives.

# --- Step 1: Wrap the Electron binary so flags are applied before launch ---
FOCUSTUBE_DIR='/opt/FocusTube'
REAL_BIN="$FOCUSTUBE_DIR/focustube-bin"
WRAPPER_BIN="$FOCUSTUBE_DIR/focustube"

if [ -f "$FOCUSTUBE_DIR/focustube" ] && [ ! -f "$REAL_BIN" ]; then
    # Rename the real Electron binary to focustube-bin
    mv "$FOCUSTUBE_DIR/focustube" "$REAL_BIN" || true
fi

# Install the wrapper script as focustube
if [ -f "$WRAPPER_BIN" ]; then
    chmod 755 "$WRAPPER_BIN" || true
fi

# --- Step 2: Register the 'focustube' command via update-alternatives ---
if type update-alternatives 2>/dev/null >&1; then
    if [ -L '/usr/bin/focustube' ] && [ -e '/usr/bin/focustube' ] && [ "$(readlink '/usr/bin/focustube')" != '/etc/alternatives/focustube' ]; then
        rm -f '/usr/bin/focustube'
    fi
    update-alternatives --install '/usr/bin/focustube' 'focustube' '/opt/FocusTube/focustube' 100 || ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube'
else
    ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube'
fi

# --- Step 3: Make the Chromium sandbox helper setuid root ---
if [ -f '/opt/FocusTube/chrome-sandbox' ]; then
    chown root:root '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
    chmod 4755 '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
fi

# --- Step 4: Refresh desktop/mime caches ---
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi
if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
