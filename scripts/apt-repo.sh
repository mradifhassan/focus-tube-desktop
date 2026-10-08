#!/usr/bin/env bash
# Build and sign a Debian-style (apt) repository from built .deb packages.
#
# Produces (in OUT_DIR, default ./apt-repo):
#   focustube.asc                        ASCII-armored public signing key
#   pool/main/<letter>/<pkg>/<pkg>.deb   package pool
#   dists/stable/Release                 repo metadata
#   dists/stable/InRelease + Release.gpg signed (apt first-class)
#   dists/stable/main/binary-amd64/Packages[.gz]
#
# Usage:
#   scripts/apt-repo.sh [deb-file ...]          (default: dist/*.deb)
#
# Environment:
#   SIGN_KEY           gpg signing key id/fingerprint
#                      (default: the single secret key in the keyring)
#   SIGNING_PASSPHRASE passphrase for SIGN_KEY
#   OUT_DIR            output directory (default: apt-repo)
set -euo pipefail

out="${OUT_DIR:-apt-repo}"
suite=stable
arch=amd64

if [ -n "${SIGN_KEY:-}" ]; then
  sign_key="$SIGN_KEY"
else
  sign_key=$(gpg --list-secret-keys --with-colons 2>/dev/null |
    awk -F: '$1 == "fpr" { print $10; n++ } END { if (n != 1) exit 1 }') || {
    echo "no unique secret key; set SIGN_KEY" >&2
    exit 1
  }
fi

debs=("$@")
if [ "${#debs[@]}" -eq 0 ]; then
  while IFS= read -r -d '' f; do debs+=("$f"); done < <(find dist -maxdepth 1 -name '*.deb' -print0 2>/dev/null || true)
fi
if [ "${#debs[@]}" -eq 0 ]; then
  echo "error: no .deb files found (searched dist/*.deb)" >&2
  exit 1
fi

rm -rf "$out"
mkdir -p "$out/pool/main"
for deb in "${debs[@]}"; do
  [ -f "$deb" ] || { echo "error: missing package $deb" >&2; exit 1; }
  pkg=$(dpkg-deb -f "$deb" Package)
  pool_dir="$out/pool/main/${pkg:0:1}/$pkg"
  mkdir -p "$pool_dir"
  cp -f "$deb" "$pool_dir/"
  echo "pooled: $pkg ($(basename "$deb"))"
done

binary="$out/dists/$suite/main/binary-$arch"
mkdir -p "$binary"

dpkg-scanpackages --multiversion "$out/pool" > "$binary/Packages"
gzip -9c < "$binary/Packages" > "$binary/Packages.gz"
echo "indexed: $binary/Packages.gz ($(wc -l < "$binary/Packages") package stanzas)"

apt-ftparchive release \
  -o "APT::FTPArchive::Release::Origin=FocusTube" \
  -o "APT::FTPArchive::Release::Label=FocusTube" \
  -o "APT::FTPArchive::Release::Suite=$suite" \
  -o "APT::FTPArchive::Release::Codename=$suite" \
  -o "APT::FTPArchive::Release::Architectures=$arch" \
  -o "APT::FTPArchive::Release::Components=main" \
  -o "APT::FTPArchive::Release::Description=FocusTube - distraction-free YouTube client for HSC students" \
  "$out/dists/$suite" > "$out/dists/$suite/Release"
echo "released: dists/$suite/Release"

gpg_args=(--batch --yes --digest-algo SHA256 --default-key "$sign_key")
if [ -n "${SIGNING_PASSPHRASE:-}" ]; then
  gpg_args+=(--pinentry-mode loopback --passphrase "$SIGNING_PASSPHRASE")
fi
gpg "${gpg_args[@]}" --detach-sign --armor \
  -o "$out/dists/$suite/Release.gpg" "$out/dists/$suite/Release"
gpg "${gpg_args[@]}" --clearsign \
  -o "$out/dists/$suite/InRelease" "$out/dists/$suite/Release"
gpg --armor --export "$sign_key" > "$out/focustube.asc"
echo "signed:   dists/$suite/InRelease + Release.gpg (+ focustube.asc)"

echo
echo "Repo ready at ./$out — publish its contents as the site root."
echo "Add this apt source (path = the published root URL):"
echo "  deb [signed-by=<keyring path>] <URL>/ $suite main"