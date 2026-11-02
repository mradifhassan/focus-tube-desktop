#!/bin/sh
# This script is run AFTER the deb is installed on the user's machine.
# It renames the real Electron binary and replaces it with a wrapper
# that sets --ozone-platform=x11 --disable-gpu before Electron starts.
# These flags MUST be set before the JS entry point runs, so they cannot
# be changed from main.js.

FOCUSTUBE_DIR="/opt/FocusTube"
REAL_BIN="$FOCUSTUBE_DIR/focustube-bin"
WRAPPER="$FOCUSTUBE_DIR/focustube"

# Rename real binary if not already done
if [ -f "$FOCUSTUBE_DIR/focustube" ] && [ ! -f "$REAL_BIN" ]; then
    mv "$FOCUSTUBE_DIR/focustube" "$REAL_BIN" 2>/dev/null || true
fi

# Write wrapper script
cat > "$WRAPPER" << 'EOF'
#!/bin/sh
exec "$(dirname "$0")/focustube-bin" --ozone-platform=x11 --disable-gpu "$@"
EOF

chmod 755 "$WRAPPER" 2>/dev/null || true

# Register command
if type update-alternatives 2>/dev/null >&1; then
    update-alternatives --install '/usr/bin/focustube' 'focustube' '/opt/FocusTube/focustube' 100 2>/dev/null || \
    ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube' 2>/dev/null || true
else
    ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube' 2>/dev/null || true
fi

# Fix chrome-sandbox
if [ -f '/opt/FocusTube/chrome-sandbox' ]; then
    chown root:root '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
    chmod 4755 '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
fi

exit 0
