# Changelog

All notable changes to **FocusTube** are documented here. Adheres loosely to
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Semver until 1.0: 0.x.

## [2.3.0] - 2026-10-09

### Added

- **Windows auto-update** — `electron-updater` checks GitHub Releases at launch (and every 4 h),
  prompts, downloads, and installs the new build; `latest.yml` metadata is published.
- **macOS & Linux "Check for Updates…"** menu item — queries the GitHub Releases API and opens
  the download page when a newer version exists (macOS auto-install still needs paid Apple signing).
- **Android app** — native APK via Capacitor (bundles the offline-capable renderer), built and
  signed in CI, with an in-app "update available" banner.
- README install/update documentation for every platform.

## [2.2.0] - 2026-10-09

### Added

- **Windows installer** (.exe, NSIS) built natively on `windows-latest` and
  attached to Releases.
- **macOS app** (.dmg, unsigned) built natively on `macos-latest` and attached
  to Releases.
- Installation guides in the README for Linux (apt + .deb), Windows (.exe),
  macOS (.dmg), and Android (web app as an installable PWA).

## [2.1.3] - 2026-10-09

### Fixed

- Stray "1" rendered at the top-left of every page: a lone `1` after the
  `google-site-verification` meta tag was interpreted by the HTML parser as a
  text node in `<body>` (non-whitespace text inside `<head>`). The web repo was
  fixed in parallel.

## [2.1.2] - 2026-10-09

### Fixed

- App failing to open on Linux/Wayland: the GPU process crashed shortly after
  launch (`GPU process isn't usable. Goodbye`), taking Electron down with it.
  Hardware acceleration is now disabled via `app.disableHardwareAcceleration()`
  — software rendering is plenty for a video-viewer UI.
- GitHub Pages deployments are now tracked against the `github-pages`
  environment, so the repo's Environments panel shows a green deployment
  instead of stale red crosses.

## [2.1.1] - 2026-10-08

### Fixed

- APT repository build + GitHub Pages deployment moved into a single CI job
  (previous split job failed to provision). Same `sudo apt install focustube`
  end result, now deployed on every release tag.

## [2.1.0] - 2026-10-08

### Added

- **APT repository on GitHub Pages** — install and update FocusTube with plain `sudo apt install focustube`:

  ```bash
  curl -fsSL https://mradifhassan.github.io/focus-tube-desktop/focustube.asc | sudo gpg --dearmor -o /usr/share/keyrings/focustube-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/focustube-keyring.gpg] https://mradifhassan.github.io/focus-tube-desktop stable main" | sudo tee /etc/apt/sources.list.d/focustube.list
  sudo apt update && sudo apt install focustube
  ```

  - Signed with the dedicated **FocusTube Release Signing** key; repo rebuilt and re-deployed by CI on every `v*` tag.
  - `scripts/apt-repo.sh` runs the whole `dpkg-scanpackages` + `apt-ftparchive` + GPG signing flow.
- Debian package renamed to `focustube` so `apt install focustube` matches the product name.

## [2.0.0] - 2026-10-08

### Added

- Complete Debian packaging (`focus-tube-desktop_2.0.0_amd64.deb`) via electron-builder.
- Professional repository metadata: AGPL-3.0 license, Code of Conduct, contributing and security guides.
- GitHub Actions CI (`build.yml`) that builds the `.deb` from source and drafts a release on `v*` tags.
- `scripts/build-renderer.sh` — one-command build of the web renderer into `app/` with a relative asset base.

### Changed

- The renderer (web app) source is now vendored under `renderer/`, so the whole project builds from a single source tree and `app/` output is generated at build time.
- `main.js` now resolves the app directory from Electron resources (`process.resourcesPath/app`) when packaged.
- Loopback server hardened: SPA fallback, path-traversal rejection, loopback-only binding.

### Fixed

- Video player iframe no longer reloads when toggling the description or playlist controls (persistent player shell).
- Scroll-to-top now targets the real scroll container.
- oEmbed embeddability checks memoized per video.

## [1.0.0] - 2026-10-01

### Added

- First desktop shell: Electron main process with loopback server + BrowserWindow.
- FocusTube web app (v2 UI) as the renderer.
- Native-style playlist autoplay / repeat / shuffle.
- Privacy shield (Invidious + `youtube-nocookie`), isolated video mode.