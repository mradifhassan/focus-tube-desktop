# Changelog

All notable changes to **FocusTube** are documented here. Adheres loosely to
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Semver until 1.0: 0.x.

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