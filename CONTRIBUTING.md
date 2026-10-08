# Contributing to FocusTube

Thanks for taking the time to contribute! FocusTube is free software built for HSC students in
Bangladesh, and every contribution — code, videos, docs, translations, bug reports — makes it better.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. All participants are
expected to follow it.

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Repository layout](#repository-layout)
- [Setting up for development](#setting-up-for-development)
- [Adding or updating videos in the catalog](#adding-or-updating-videos-in-the-catalog)
- [Code style and checks](#code-style-and-checks)
- [Commit messages](#commit-messages)
- [Opening an issue](#opening-an-issue)
- [Opening a pull request](#opening-a-pull-request)

## Ways to contribute

- **Content** — the bundled HSC catalogs are the heart of the app. Adding a missing OnnoRokom,
  Alchemy, or AloronXYZ video/playlist helps every user.
- **Code** — bug fixes, performance, accessibility, new app features.
- **Docs** — README, in-app strings, translation of the English/Bengali UI.
- **Review** — test pull requests and report back on real hardware (especially mobile-class devices).

## Repository layout

```
main.js                  Electron main process (loopback server + window)
renderer/                The FocusTube web app source — all UI lives here
  src/data/*.js          Curated video catalogs (OnnoRokom, Alchemy, AloronXYZ)
scripts/                 renderer build helper
build/                   packaging icons
.github/workflows/       CI: Linux .deb build + tagged releases
```

## Setting up for development

```bash
git clone https://github.com/mradifhassan/focus-tube-desktop.git
cd focus-tube-desktop

npm ci                                # Electron shell dependencies
npm ci --prefix renderer              # renderer (web app) dependencies

# Build the renderer into app/, then launch the app
npm run build:renderer
npm start
```

### HMR / live edit (renderer only)

If you are working on UI code, you can run the renderer standalone with Vite:

```bash
cd renderer
npm run dev        # opens http://localhost:3000
```

The full desktop shell is only needed when testing the packaged integration.

## Adding or updating videos in the catalog

The curated catalogs live in `renderer/src/data/`:

- `catalog-onnorokom.js` — OnnoRokom Pathshala videos/playlists (the largest index)
- `catalog-alchemy.js` — Alchemy videos/playlists
- `catalog-aloronxyz.js` — AloronXYZ videos/playlists

**Rules (strict — the build enforces these):**

1. Every video object has this shape:

   ```js
   { id: '12-char-videoId', title: 'Title', duration: '13m 27s', views: '1.2M views', thumbnail: 'https://i.ytimg.com/vi/VIDEOID/hqdefault.jpg' }
   ```

2. Every playlist object references videos by `id` **that already exist in the same file**.
   Playlist `videoCount` must equal the number of item ids in `videos`.
3. `id`s must be globally unique within a catalog file.
4. The `CATALOG_VERSION` counter in `renderer/src/config.js` is bumped whenever a catalog file
   changes — bump the version and note the change in `CHANGELOG.md`.

When in doubt, copy an existing nearby entry — do not invent metadata. If you cannot confirm an
exact duration, mark it conservatively rather than guessing.

## Code style and checks

- ES modules, 2-space indentation, single quotes, semicolons — match the surrounding file.
- No formatting tool beyond consistency; keep diffs small and reviewable.
- Before pushing, run:

  ```bash
  npm run build:renderer   # proves the renderer still builds
  ```

- The pull request is expected to pass the repository CI (renderer build + `.deb` packaging).

## Commit messages

- Follow [Conventional Commits](https://www.conventionalcommits.org/) loosely:
  `fix:`, `feat:`, `chore:`, `docs:`, `ci:`, `refactor:`.
- Keep the subject short (< 72 chars) and the body explaining **why**, not just **what**.
- Reference issues with `Closes #123`.

Examples:

```
fix: honor privacy shield for related-video embeds

Closes #42

feat(catalog): add OnnoRokom chemistry playlist v15
```

## Opening an issue

Use the issue templates if they apply (bug report / feature request). Good bug reports contain:

- OS and version, and how the app was installed (`.deb` vs source).
- A minimal set of steps to reproduce.
- What you expected vs what actually happened.
- Any console output (`focustube` from a terminal captures renderer logs).

**Security issues are handled privately — see [SECURITY.md](SECURITY.md). Do not file them as issues.**

## Opening a pull request

1. Fork the repository and create a branch from `main`: `git checkout -b fix/foo`.
2. Make your change; keep it focused. Add tests/verification where reasonable.
3. Update `CHANGELOG.md` under "Unreleased" if the change is user-visible.
4. Push and open a **pull request** against `main`.
5. In the PR description, briefly explain the problem and the solution, and how you verified it.

Maintainers will review, may request changes, and will merge once CI is green.

---

*FocusTube is AGPL-3.0 — code you contribute becomes part of a free project, available to everyone.*