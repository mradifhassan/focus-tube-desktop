#!/usr/bin/env bash
# Build a dnf/yum repository from built .rpm packages.
#
# Usage:
#   scripts/rpm-repo.sh <out-dir> [rpm-file ...]
#
# When no rpm files are given, dist/*.rpm is used. Requires `createrepo_c`
# (or `createrepo`). Produces repodata/ plus a ready-to-use focustube.repo
# file in <out-dir>.
set -euo pipefail

out="${1:?usage: rpm-repo.sh <out-dir> [rpm-file ...]}"
shift || true
rpms=("$@")
if [ "${#rpms[@]}" -eq 0 ]; then
  while IFS= read -r -d '' f; do rpms+=("$f"); done < <(find dist -maxdepth 1 -name '*.rpm' -print0 2>/dev/null || true)
fi
if [ "${#rpms[@]}" -eq 0 ]; then
  echo "error: no .rpm files found (searched dist/*.rpm)" >&2
  exit 1
fi

mkdir -p "$out"
for r in "${rpms[@]}"; do
  [ -f "$r" ] || { echo "error: missing package $r" >&2; exit 1; }
  cp -f "$r" "$out/"
  echo "pooled: $(basename "$r")"
done

if command -v createrepo_c >/dev/null 2>&1; then
  createrepo_c --update "$out"
elif command -v createrepo >/dev/null 2>&1; then
  createrepo --update "$out"
else
  echo "error: createrepo_c not found (apt-get install createrepo-c)" >&2
  exit 1
fi

cat > "$out/focustube.repo" <<'EOF'
[focustube]
name=FocusTube
baseurl=https://mradifhassan.github.io/focus-tube-desktop/rpm/
enabled=1
gpgcheck=0
EOF

echo "rpm repo ready at $out (+ focustube.repo)"
