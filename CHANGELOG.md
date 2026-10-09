# Changelog

All notable changes to **FocusTube** are documented here. Adheres loosely to
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Semver until 1.0: 0.x.

## [2.6.0] - 2026-10-09

### Performance

- **Video, channel and playlist pages now open almost instantly.** Clicking a
  video used to freeze the UI for 3–9 seconds on the main channel: the
  related-videos graph was rebuilt with an O(n²) word-overlap scan on every
  watch-page render (measured **8,835 ms** for the 998-video OnnoRokom catalog).
  It's now built with an inverted index — same result, byte-for-byte — in
  **~190 ms**, computed once per channel and pre-built during idle time at
  startup. A video click now takes ~17 ms of main-thread work (was multi-second).
- **Large grids skip off-screen work.** Video cards use `content-visibility:
  auto`, so the 1000+ card home/channel grids only lay out and paint what's
  visible. Channel page (998 cards) paints in ~250 ms; playlist opens in <80 ms.
- **Flattened catalog lists and graphs are memoized.** `getAllCachedVideos()` /
  `getAllCachedPlaylists()` are cached and the related graph is built once per
  channel, instead of re-spreading 1000+ objects on every click.
- **Background channel refresh no longer stalls the UI.** All Invidious
  instances are now queried in parallel and the first success wins (was a
  sequential 5 × 3.5 s walk = up to 17.5 s of dead waiting); the last working
  instance is remembered. A refresh no longer re-renders the page out from under
  a video you're watching or a playlist you're browsing.
- **Faster playback start.** Hovering/touching a video's facade now prefetches
  the exact embed document, and the player hydrates on `pointerdown` (earlier in
  the gesture) rather than waiting for `click`.
- **Non-blocking font load.** Roboto is loaded via a low-priority stylesheet
  instead of a render-blocking CSS `@import`, so it no longer delays first paint.

## [2.5.1] - 2026-10-09

### Fixed

- Pre-warming a video's facade no longer injects duplicate `preconnect` links
  for `www.youtube.com` / `i.ytimg.com` — URL normalization now matches the
  links already declared in the document head.

## [2.5.0] - 2026-10-09

### Performance

- **Instant video opening with a YouTube facade.** Opening a watch page used to
  embed the YouTube iframe immediately, which downloads YouTube's player scripts
  and stream far before you ever press play — causing the multi-second freeze on
  slower connections. Watch pages (and isolated-view pages) now render a
  lightweight static thumbnail with a play button instead; the real YouTube
  embed is only injected after you click, with `autoplay=1`. Hovering/touching
  the facade pre-warms the connection (preconnect to YouTube, Google, and the
  thumbnail CDN) and prefetches the IFrame API script, so hydration is
  near-instant. The live player survives page re-renders and playlist
  auto-advance is unchanged. Privacy-neutral `youtube-nocookie.com` embeds are
  preserved.

## [2.4.1] - 2026-10-09

### Fixed

- **App aborts at launch on Ubuntu 24.04** with
  `The SUID sandbox helper binary was found, but is not configured correctly`.
  The package's postinstall script probed user namespaces with `unshare --user`
  — which always succeeds when run as root — and kept `chrome-sandbox` at
  mode 0755, but Ubuntu 24.04's AppArmor blocks unprivileged user namespaces at
  runtime, so Chromium needs the setuid helper. The helper is now always
  installed owned by root with mode 4755 on every install/upgrade. Existing
  installs: `sudo chmod 4755 /opt/FocusTube/chrome-sandbox`.

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