# Security Policy

## Supported versions

Security fixes are applied to the latest release. Old releases receive fixes only when the
issue is critical and a backport is practical.

| Version | Supported          |
|---------|--------------------|
| latest  | :white_check_mark: |
| older   | :x:                |

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.** An issue makes the flaw
visible to everyone before it is patched.

Instead, report privately via one of the following channels:

- **GitHub private vulnerability reporting** — the preferred route:
  <https://github.com/mradifhassan/focus-tube-desktop/security/advisories>
- **Email** — to the maintainer via their GitHub profile (mradifhassan) if the above is unavailable.

Please include:

1. The version affected and how you installed it (`.deb`, source).
2. A short description and the **impact** you observed.
3. Steps to reproduce (a minimal, self-contained example if possible).

You should receive an acknowledgement within a few days. Do not disclose the issue publicly until
it has been addressed and a release is available.

## Scope

- This repository: the Electron shell (`main.js`) and the bundled renderer (`renderer/src`).
- The runtime data flow: the loopback HTTP server, Invidious/oEmbed fetches, and YouTube embeds.

Out of scope: the upstream projects this app fetches from (YouTube, Invidious instances),
third-party npm dependencies.

## Security-relevant design notes

- `nodeIntegration` is disabled, `contextIsolation` enabled, and the renderer runs sandboxed.
- The embedded HTTP server binds **only** to `127.0.0.1` and rejects path-traversal
  attempts; unknown paths fall back to the SPA `index.html`.
- External `target="_blank"` links are opened in your system browser, never in the app window.