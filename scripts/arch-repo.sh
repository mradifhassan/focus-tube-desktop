#!/usr/bin/env bash
# Build an Arch Linux package from a prebuilt .deb and assemble a pacman
# repository from it.
#
# Run inside an Arch container (e.g. `archlinux:base-devel`), which provides
# `ar`, `tar`, `zstd`, `bsdtar` and `repo-add`.
#
# Usage:
#   scripts/arch-repo.sh <deb-file> <out-dir>
#
# Produces in <out-dir>:
#   focustube-<ver>-1-x86_64.pkg.tar.zst
#   focustube.db.tar.gz   (+ focustube.db symlink)
#   focustube.files.tar.gz (+ focustube.files symlink)
set -euo pipefail

deb="${1:?usage: arch-repo.sh <deb-file> <out-dir>}"
out="${2:?usage: arch-repo.sh <deb-file> <out-dir>}"

[ -f "$deb" ] || { echo "error: no such deb: $deb" >&2; exit 1; }
deb="$(readlink -f "$deb")"
out="$(readlink -f "$out" 2>/dev/null || echo "$out")"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# ---- unpack the .deb -------------------------------------------------------
( cd "$work" && ar x "$deb" )
mkdir -p "$work/control" "$work/root"
( cd "$work" && tar xf control.tar.* -C control )
( cd "$work" && tar xf data.tar.* -C root )

pkgname="$(awk -F': ' '/^Package:/ {print $2}' "$work/control/control")"
pkgver="$(awk -F': ' '/^Version:/ {print $2}' "$work/control/control")"
pkgrel=1
pkgdesc="FocusTube — distraction-free YouTube client for HSC students"
url="https://github.com/mradifhassan/focus-tube-desktop"
packager="Radif Hassan <radif@example.com>"
arch=x86_64
builddate="$(date +%s)"
isize="$(du -sb "$work/root" | cut -f1)"

# Normalise a debian version (may contain '-') into pkgver only.
pkgver="${pkgver%%-*}"

deps=(gtk3 nss libxss libxtst xdg-utils at-spi2-core util-linux libsecret alsa-lib libnotify)

# ---- write .PKGINFO --------------------------------------------------------
{
  echo "pkgname = $pkgname"
  echo "pkgbase = $pkgname"
  echo "pkgver = $pkgver-$pkgrel"
  echo "pkgdesc = $pkgdesc"
  echo "url = $url"
  echo "builddate = $builddate"
  echo "packager = $packager"
  echo "size = $isize"
  echo "arch = $arch"
  echo "license = AGPL-3.0"
  for d in "${deps[@]}"; do echo "depend = $d"; done
} > "$work/root/.PKGINFO"

# ---- build .MTREE ----------------------------------------------------------
( cd "$work/root" && LANG=C bsdtar -czf .MTREE --format=mtree \
    --options='!all,use-set,type,uid,gid,mode,time,size,md5,sha256,link' .PKGINFO opt usr )

# ---- create the package ----------------------------------------------------
mapfile -t entries < <(cd "$work/root" && ls -A)
pkgfile="$pkgname-$pkgver-$pkgrel-$arch.pkg.tar.zst"
mkdir -p "$out"
( cd "$work/root" && bsdtar -cf - "${entries[@]}" | zstd -z -q -c -T0 > "$out/$pkgfile" )

# ---- assemble the repository ----------------------------------------------
( cd "$out" && repo-add -q "$pkgname.db.tar.gz" "$pkgfile" )
echo "arch package: $out/$pkgfile"
echo "arch repo:    $out/$pkgname.db.tar.gz"
