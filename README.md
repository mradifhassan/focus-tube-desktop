<div align="center">

# FocusTube

**A free, distraction-free YouTube desktop client for HSC students in Bangladesh.**

[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux--x64-lightgrey.svg)](#install)
[![Electron](https://img.shields.io/badge/Electron-33-47848f.svg)](package.json)
[![Build](https://img.shields.io/github/actions/workflow/status/mradifhassan/focus-tube-desktop/build.yml?branch=main&label=build)](https://github.com/mradifhassan/focus-tube-desktop/actions)
[![Release](https://img.shields.io/github/v/release/mradifhassan/focus-tube-desktop)](https://github.com/mradifhassan/focus-tube-desktop/releases)
[![Downloads](https://img.shields.io/github/downloads/mradifhassan/focus-tube-desktop/total)](https://github.com/mradifhassan/focus-tube-desktop/releases)

No ads. No algorithmic recommendations. No comments. Just curated HSC curriculum videos from
[OnnoRokom Pathshala](https://www.youtube.com/@onnorokompathshala), Alchemy, and AloronXYZ — wrapped in a clean desktop window.

*Built with Electron on Linux. A sibling of the [FocusTube web app](https://github.com/mradifhassan/focus-tube).*

![FocusTube preview](docs/preview.png)

</div>

---

## Features

- **Curated distraction-free catalog** — 998+ hand-picked HSC videos and 60 playlists bundled offline; nothing is algorithmically recommended.
- **Native desktop window** — packaged as a Debian `.deb`, installed to `/opt/FocusTube`, launches from your app menu with `Categories=Education`.
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

### Manual `.deb`

Download `focus-tube-desktop_<version>_amd64.deb` from the
[Releases page](https://github.com/mradifhassan/focus-tube-desktop/releases), then:

```bash
sudo apt install -f ./focus-tube-desktop_2.1.1_amd64.deb
# or
sudo dpkg -i focus-tube-desktop_2.1.1_amd64.deb && sudo apt install -f
```

Launch **FocusTube** from your application menu, or run `focustube` from a terminal.

> Standard Electron runtime dependencies are declared (`libgtk-3-0`, `libnss3`, `libasound2`, …);
> `apt install -f` will pull any that are missing.

### AppImage / source

Run everything from source (below), or add more pack targets by extending the `linux.target` array in `package.json`.

## Build from source

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/mradifhassan/focus-tube-desktop.git
cd focus-tube-desktop

# 1) Install the Electron shell dependencies
npm ci

# 2) Install the renderer (web app) build dependencies
npm ci --prefix renderer

# 3) Build the renderer, then package the .deb
npm run build
```

That's the exact pipeline GitHub Actions runs. The `.deb` lands in `dist/`. For daily use without packaging:

```bash
npm start        # (after npm run build:renderer)
```

## Project structure

```
focus-tube-desktop/
├── main.js                  # Electron main process — loopback server + window
├── scripts/
│   ├── build-renderer.sh    # builds the renderer into app/ (relative asset base)
│   └── apt-repo.sh          # builds + signs the APT repo from dist/*.deb
├── renderer/                # the FocusTube web app source (own package.json)
│   ├── src/                 # views, router, player, catalogs (OnnoRokom, Alchemy, AloronXYZ)
│   ├── public/              # web manifest, icons, SEO files
│   └── vite.config.ts
├── app/                     # generated renderer build (served at runtime; not committed)
├── apt-repo/                # generated APT repository (published to GitHub Pages)
├── build/icon.png           # 512×512 application icon
└── .github/workflows/       # CI — .deb, releases, and the APT repository
```

## How it works under the hood

The Electron main process starts a small loopback HTTP server (`127.0.0.1`) and loads the built
renderer from it. This gives the app a real `http://` origin — required for YouTube embeds and
Invidious/oEmbed fetches, which reject the `file://` "null" origin that a plain
`loadFile()` would produce.

## Tech stack

| Layer      | Tech                                                              |
|------------|-------------------------------------------------------------------|
| Shell      | [Electron](https://www.electronjs.org/) 33                        |
| Renderer   | Vanilla ES modules + Vite, Tailwind CSS (via CDN), YouTube IFrame API |
| Metadata   | Invidious public instances, YouTube oEmbed                        |
| Packaging  | [electron-builder](https://www.electron.build/) → `.deb`                                 |
| Distribution | APT repository on GitHub Pages (GPG-signed `dists/stable`) + GitHub Releases          |

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