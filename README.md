<div align="center">

# FocusTube

**A free, distraction-free YouTube desktop client for HSC students in Bangladesh.**

[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%C2%B7%20Windows%20%C2%B7%20Android%20%C2%B7%20macOS-lightgrey.svg)](#install)
[![Electron](https://img.shields.io/badge/Electron-33-47848f.svg)](package.json)
[![Build](https://img.shields.io/github/actions/workflow/status/mradifhassan/focus-tube-desktop/build.yml?branch=main&label=build)](https://github.com/mradifhassan/focus-tube-desktop/actions)
[![Release](https://img.shields.io/github/v/release/mradifhassan/focus-tube-desktop)](https://github.com/mradifhassan/focus-tube-desktop/releases)
[![Downloads](https://img.shields.io/github/downloads/mradifhassan/focus-tube-desktop/total)](https://github.com/mradifhassan/focus-tube-desktop/releases)

No ads. No algorithmic recommendations. No comments. Just curated HSC curriculum videos from
[OnnoRokom Pathshala](https://www.youtube.com/@onnorokompathshala), Alchemy, and AloronXYZ — wrapped in a clean desktop window.

*Built with Electron (desktop) and Capacitor (Android). A sibling of the [FocusTube web app](https://github.com/mradifhassan/focus-tube).*

![FocusTube preview](docs/preview.png)

</div>

---

## Features

- **Curated distraction-free catalog** — 998+ hand-picked HSC videos and 60 playlists bundled offline; nothing is algorithmically recommended.
- **Native app everywhere** — installs as a `.deb` (Linux), `.exe` installer (Windows), `.dmg` (macOS), or `.apk` (Android); Debian/Ubuntu launches from the app menu with `Categories=Education`.
- **Privacy shield** — Invidious instances for channel metadata, `youtube-nocookie.com` embeds, no tracking cookies, no account.
- **Playlist autoplay** — a native-style queue with repeat / shuffle / autoplay while you study.
- **Offline-first catalogs** — the full OnnoRokom / Alchemy / AloronXYZ indexes ship with the app and render instantly; only video playback and Live channel fetch need the network.
- **Search & filter** — filter the feed by category (science, technology, recently added) and search the full catalog.
- **Isolated video mode** — open any video truly alone, with no suggestions or feed.

## Install

### Debian / Ubuntu (x64) — APT repository (recommended)

Install **FocusTube** the same way you install any system package — with `apt`. One-time setup adds
the repository and its signing key, then updates install just like everything else:

```bash
# 1) Trust the repository signing key
curl -fsSL https://mradifhassan.github.io/focus-tube-desktop/focustube.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/focustube-keyring.gpg

# 2) Add the repository
echo "deb [signed-by=/usr/share/keyrings/focustube-keyring.gpg] https://mradifhassan.github.io/focus-tube-desktop stable main" \
  | sudo tee /etc/apt/sources.list.d/focustube.list

# 3) Install
sudo apt update
sudo apt install focustube
```

From then on you always stay up to date with the plainest commands:

```bash
sudo apt update && sudo apt upgrade
```

The repository is served from GitHub Pages, signed with the **FocusTube Release Signing** key
([`focustube.asc`](https://mradifhassan.github.io/focus-tube-desktop/focustube.asc)); Snap/PPA users
on Ubuntu find the same experience here.

### Windows (x64) — `.exe` installer with auto-update

1. Download **`FocusTube-Setup-<version>.exe`** from the
   [Releases page](https://github.com/mradifhassan/focus-tube-desktop/releases).
2. Double-click the installer. Choose the default install location or a folder of your own
   (the installer lets you pick either).
3. Launch **FocusTube** from the Start menu or the desktop shortcut.

**Updates install themselves:** on every launch (and every 4 hours while running) FocusTube
checks GitHub for a newer release, shows a prompt when one is available, then downloads and
installs it in the background. Nothing to do — just say "Download & install now".

> The installer is unsigned for now, so Windows SmartScreen may show a
> "Windows protected your PC" prompt. Click **More info → Run anyway**. FocusTube is
> open source (AGPL-3.0) — build it yourself with `npm run build:win` if you prefer.

### macOS (Apple Silicon / Intel) — `.dmg`

1. Download **`FocusTube-<version>-arm64.dmg`** (Apple Silicon) or
   **`FocusTube-<version>.dmg`** (Intel) from the
   [Releases page](https://github.com/mradifhassan/focus-tube-desktop/releases).
2. Double-click the `.dmg` and drag **FocusTube** into your **Applications** folder.
3. First launch only: because the app is not notarized, right-click **FocusTube** in
   Finder → **Open**, then confirm **Open** — Gatekeeper won't block it afterwards.

For updates, use the menu bar **Help → Check for Updates…** — it queries GitHub and opens the
download page when a newer version is out. (Full auto-update isn't possible with free/unpaid
signing; Apple Developer ID signing + notarization would unlock it.)

### Android — native APK (`.apk`)

1. Download **`FocusTube-<version>.apk`** from the
   [Releases page](https://github.com/mradifhassan/focus-tube-desktop/releases).
2. Open the file and tap through Android's "install from unknown sources" prompt.
3. **FocusTube** launches from your launcher with its own icon.

The app itself — catalogs, search, playlist autoplay — is bundled offline. When a new version
is published, an **"update available"** banner appears in the app and opens the download page.

> Prefer the web version on Android? Open
> <https://mradifhassan.github.io/focus-tube/> in Chrome and choose
> **⋮ → Add to Home screen**. That installs with a launcher icon too and updates itself
> automatically, no download needed.

### Manual `.deb`

Download `focus-tube-desktop_<version>_amd64.deb` from the
[Releases page](https://github.com/mradifhassan/focus-tube-desktop/releases), then:

```bash
sudo apt install -f ./focus-tube-desktop_2.2.0_amd64.deb
# or
sudo dpkg -i focus-tube-desktop_2.2.0_amd64.deb && sudo apt install -f
```

Launch **FocusTube** from your application menu, or run `focustube` from a terminal.

> Standard Electron runtime dependencies are declared (`libgtk-3-0`, `libnss3`, `libasound2`, …);
> `apt install -f` will pull any that are missing.

> **Troubleshooting:** if `focustube` exits with *"The SUID sandbox helper binary
> was found, but is not configured correctly"* (Ubuntu 24.04+), the setuid bit on
> the sandbox helper was lost — restore it once with
> `sudo chmod 4755 /opt/FocusTube/chrome-sandbox`.

### AppImage / source

Run everything from source (below), or add more pack targets by extending the `linux.target` array in `package.json`.

## Build from source

**Requirements:** Node.js 20+ and npm. Build on the matching OS for each target —
`npm run build:win` needs Windows (or wine), `npm run build:mac` needs macOS
(Apple's tooling can't cross-compile).

```bash
git clone https://github.com/mradifhassan/focus-tube-desktop.git
cd focus-tube-desktop

# 1) Install the Electron shell dependencies
npm ci

# 2) Install the renderer (web app) build dependencies
npm ci --prefix renderer

# 3) Build the renderer, then package your platform's installer
npm run build        # Linux    → dist/*.deb          (also updates the APT repo)
npm run build:win    # Windows  → dist/FocusTube-Setup-*.exe
npm run build:mac    # macOS    → dist/FocusTube-*-arm64.dmg and dist/FocusTube-*.dmg
# Android: needs JDK 17 + Android SDK
npm run build:renderer && npx cap sync android
cd android && ./gradlew assembleRelease   # → app-release.apk (unsigned without a keystore)
```

That's the exact pipeline GitHub Actions runs. The installer lands in `dist/`. For daily use without packaging:

```bash
npm start        # (after npm run build:renderer)
```

## Project structure

```
focus-tube-desktop/
├── main.js                  # Electron main process — loopback server + window + updaters
├── capacitor.config.ts      # Capacitor config (webDir=app) for the Android app
├── android/                 # Android app project (Gradle) — same bundled renderer
├── scripts/
│   ├── build-renderer.sh    # builds the renderer into app/ (relative asset base)
│   └── apt-repo.sh          # builds + signs the APT repo from dist/*.deb
├── renderer/                # the FocusTube web app source (own package.json)
│   ├── src/                 # views, router, player, catalogs, updater (Android banner)
│   ├── public/              # web manifest, icons, SEO files
│   └── vite.config.ts
├── app/                     # generated renderer build (served at runtime; not committed)
├── apt-repo/                # generated APT repository (published to GitHub Pages)
├── build/icon.png           # 512×512 application icon
└── .github/workflows/       # CI — .deb/.exe/.dmg/.apk builds, releases, APT repo + Pages
```

## How it works under the hood

The Electron main process starts a small loopback HTTP server (`127.0.0.1`) and loads the built
renderer from it. This gives the app a real `http://` origin — required for YouTube embeds and
Invidious/oEmbed fetches, which reject the `file://` "null" origin that a plain
`loadFile()` would produce.

On Linux/Wayland, the renderer is routed through XWayland (`ozone-platform=x11`):
Chromium's native Wayland GPU backend is unstable on some AMD/Intel machines
(app crashed with `GPU process isn't usable. Goodbye`), while the X11/EGL path
is rock-solid — so the app keeps full hardware acceleration and never falls back
to slow software rendering. The renderer is fully offline-capable: Tailwind and
the app bundle are compiled/self-contained, nothing external blocks startup.

## Tech stack

| Layer      | Tech                                                              |
|------------|-------------------------------------------------------------------|
| Shell      | [Electron](https://www.electronjs.org/) 33 (desktop) · [Capacitor](https://capacitorjs.com/) 7 (Android) |
| Renderer   | Vanilla ES modules + Vite, Tailwind CSS (compiled into the bundle), YouTube IFrame API |
| Metadata   | Invidious public instances, YouTube oEmbed                        |
| Packaging  | [electron-builder](https://www.electron.build/) → `.deb` · `.exe` · `.dmg`, Android Gradle → `.apk` |
| Updates    | Windows `electron-updater` (auto) · Debian `apt` · macOS `Check for Updates…` menu · Android in-app banner |
| Distribution | APT repository on GitHub Pages (GPG-signed `dists/stable`) + GitHub Releases (.deb/.exe/.dmg/.apk) |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first —
it covers how to add videos to the bundled catalogs, run checks, and open a proper pull request.
All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Found a vulnerability? Do **not** open a public issue. See [SECURITY.md](SECURITY.md) for how to report it privately.

## License

**FocusTube** is free software under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0) —
the same license used by [FreeTube](https://github.com/FreeTubeApp/FreeTube).

```
Copyright (C) 2026 Radif Hassan

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.
```

---

<div align="center"><sub>Made with ❤️ for HSC students of Bangladesh.</sub></div>
