#!/bin/sh
# FocusTube rpm post-install script.
# Sets the Chromium SUID sandbox helper to 4755 owned by root so the app can
# launch on RHEL/Fedora (and other rpm-based distros) where unprivileged user
# namespaces are restricted (Ubuntu 24.04+ AppArmor, SELinux, etc.).
#
# Without this, Chromium aborts at launch with:
#   "The SUID sandbox helper binary ... is not configured correctly"
#
# electron-builder runs %post scripts for rpm; this script is wired via the
# "rpm.afterInstall" build config in package.json.

# Make the Chromium sandbox helper setuid root
if [ -f '/usr/lib/focustube/chrome-sandbox' ]; then
    chown root:root '/usr/lib/focustube/chrome-sandbox' 2>/dev/null || true
    chmod 4755 '/usr/lib/focustube/chrome-sandbox' 2>/dev/null || true
fi

# Also handle the /opt layout some builds use
if [ -f '/opt/FocusTube/chrome-sandbox' ]; then
    chown root:root '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
    chmod 4755 '/opt/FocusTube/chrome-sandbox' 2>/dev/null || true
fi

# Refresh desktop/mime caches
if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi
