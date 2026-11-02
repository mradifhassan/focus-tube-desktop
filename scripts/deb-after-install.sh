#!/bin/sh
# FocusTube deb post-install script.
# Runs as root during `dpkg -i` on the user's machine.

# --- Step 1: Wrap the Electron binary so ozone+gpu flags are applied before launch ---
# Electron's ozone platform (X11 vs Wayland) is initialized BEFORE the main
# process JavaScript runs, so app.commandLine.appendSwitch() in main.js cannot
# change it. We rename the real binary and install a wrapper that sets
# --ozone-platform=x11 --disable-gpu before Electron starts.
FOCUSTUBE_DIR='/opt/FocusTube'
REAL_BIN="$FOCUSTUBE_DIR/focustube-bin"
WRAPPER="$FOCUSTUBE_DIR/focustube"

if [ -f "$FOCUSTUBE_DIR/focustube" ] && [ ! -f "$REAL_BIN" ]; then
    mv "$FOCUSTUBE_DIR/focustube" "$REAL_BIN" 2>/dev/null || true
fi

cat > "$WRAPPER" << 'WRAPPER_EOF'
#!/bin/sh
exec /opt/FocusTube/focustube-bin --ozone-platform=x11 --disable-gpu "$@"
WRAPPER_EOF
chmod 755 "$WRAPPER" 2>/dev/null || true

# --- Step 2: Register the 'focustube' command via update-alternatives ---
if type update-alternatives 2>/dev/null >&1; then
    if [ -L '/usr/bin/focustube' ] && [ -e '/usr/bin/focustube' ] && [ "$(readlink '/usr/bin/focustube')" != '/etc/alternatives/focustube' ]; then
        rm -f '/usr/bin/focustube'
    fi
    update-alternatives --install '/usr/bin/focustube' 'focustube' '/opt/FocusTube/focustube' 100 || \
    ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube'
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

exit 0
