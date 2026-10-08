# Changelog

All notable changes to **FocusTube** are documented here. Adheres loosely to
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Semver until 1.0: 0.x.

## [2.4.0] - 2026-10-09

### Performance

- **Hardware acceleration re-enabled on Linux/Wayland.** The app no longer forces
  software rendering. On Wayland sessions it routes Chromium through XWayland
  (`ozone-platform=x11`), where the GPU process is stable — so clicks and
  scrolling run at full GPU compositing speed instead of SwiftShader software
  rasterization (measured ~2× faster frame cost, GPU compositing/WebGL/video
  decode active again on machines that previously crashed on native Wayland).
- **Renderer boots without render-blocking external requests.** The Tailwind CSS
  runtime compiler (CDN) and the Google Fonts stylesheet were removed from
  `index.html`; Tailwind is now compiled into the bundle by the Vite plugin
  (`index.css` is wired into the build and declares explicit `@source`
  globs, so even arbitrary-value utilities used in template literals are
  generated). The app launches even when the machine is offline or on a slow
  link (previously it waited on `cdn.tailwindcss.com` before the UI could start).
- **Lazy-loaded thumbnails.** Every video/playlist thumbnail now uses native
  `loading="lazy"` + `decoding="async"`, so the home feed no longer fires 1000+
  image requests at once on a slow connection — only images near the viewport load.

## [2.3.1] - 2026-10-09

### Fixed

- **Debian package: app "not opening" via terminal.** electron-builder named the
  packaged binary `focus-tube-desktop`, but created a `/usr/bin/focustube`
  alternatives symlink pointing to `/opt/FocusTube/focustube` — a dangling link,
  so running `focustube` failed. The executable is now correctly installed as
  `/opt/FocusTube/focustube`, so both the `focustube` command and the app-menu
  entry launch the app.

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