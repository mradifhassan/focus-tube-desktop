#!/bin/sh
# FocusTube deb post-install script.
# Replicates electron-builder's default postinst (which wires the /usr/bin
# 'focustube' command via update-alternatives) but FIXES the chrome-sandbox
# handling:
#
# Ubuntu 24.04 restricts unprivileged user namespace creation (AppArmor
# apparmor_restrict_unprivileged_userns=1), so unprivileged Chromium must use
# the SUID chrome-sandbox helper. electron-builder's default postinst instead
# probes user namespaces with `unshare --user`, which always succeeds when run
# as root — so it leaves the helper at 0755 and the app aborts at launch
# ("The SUID sandbox helper binary … is not configured correctly"). We therefore
# always set the helper setuid root (owned by root, mode 4755).

# Register the 'focustube' command via update-alternatives
if type update-alternatives 2>/dev/null >&1; then
    # Remove previous link if it doesn't use update-alternatives
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