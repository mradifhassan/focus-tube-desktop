#!/bin/sh
# FocusTube deb post-install script.
#
# 1. Registers the 'focustube' command via update-alternatives
# 2. Fixes chrome-sandbox permissions (setuid root, mode 4755) for Ubuntu 24.04+
# 3. Refreshes desktop/mime caches
#
# Note: The --ozone-platform=x11 --disable-gpu flags are applied by the
# focustube-wrapper.sh script which the user can install manually, or by
# launching focustube with those flags directly. Electron's ozone platform
# cannot be changed from main.js (initialized before JS entry point).

# Register the 'focustube' command via update-alternatives
if type update-alternatives 2>/dev/null >&1; then
    if [ -L '/usr/bin/focustube' ] && [ -e '/usr/bin/focustube' ] && [ "$(readlink '/usr/bin/focustube')" != '/etc/alternatives/focustube' ]; then
        rm -f '/usr/bin/focustube'
    fi
    update-alternatives --install '/usr/bin/focustube' 'focustube' '/opt/FocusTube/focustube' 100 || ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube'
else
    ln -sf '/opt/FocusTube/focustube' '/usr/bin/focustube'
fi

# Make the Chromium sandbox helper setuid root
if [ -f '/opt/FocusTube/chrome-sandbox' ]; then
    chown root:root '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
    chmod 4755 '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
fi

# Refresh desktop/mime caches
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi
if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
