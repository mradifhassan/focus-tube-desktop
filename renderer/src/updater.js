/**
 * @file updater.js
 * Looks for new FocusTube releases and shows an in-app banner when one is
 * available. Works on every platform:
 *   - Android (Capacitor): version comes from App.getInfo(), tap opens the APK.
 *   - Linux / macOS (Electron): version comes from the local shell, tap opens
 *     the Releases page (apt/dnf/pacman users then run their package manager).
 *   - Windows (Electron): electron-updater already handles the native install
 *     prompt; this banner is a harmless secondary surface.
 *
 * IMPORTANT: we query the releases LIST and pick the highest valid `vX.Y.Z`
 * tag rather than /releases/latest — the repo also publishes a rolling release
 * literally tagged `latest`, which hijacks the "latest" endpoint and would make
 * version comparison silently fail.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const REPO = 'mradifhassan/focus-tube-desktop';

export const UPDATE_BANNER = 'focustube-update-banner';

export function initNativeUpdateChecker() {
  Promise.all([getLatestVersionedRelease(), getCurrentVersion()])
    .then(([release, current]) => {
      if (!release || !current) return;
      const latest = String(release.tag || '').replace(/^v/i, '');
      if (latest && isNewerThan(latest, current)) {
        showBanner(`FocusTube v${latest} is available`, release.url);
      }
    })
    .catch(() => {
      // Offline / GitHub errors — stay quiet, never block the app.
    });
}

// Resolve the app's current version across platforms.
async function getCurrentVersion() {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo();
      return String(info.versionName || '').replace(/^v/i, '');
    } catch (_) {
      return '';
    }
  }
  // Desktop (Electron) / web: injected at load time. main.js sets
  // window.__FOCUSTUBE_VERSION__, vite injects __FOCUSTUBE_VERSION__ for web.
  if (typeof window !== 'undefined' && window.__FOCUSTUBE_VERSION__) {
    return String(window.__FOCUSTUBE_VERSION__).replace(/^v/i, '');
  }
  try {
    if (typeof __FOCUSTUBE_VERSION__ !== 'undefined') {
      return String(__FOCUSTUBE_VERSION__).replace(/^v/i, '');
    }
  } catch (_) {
    /* not defined in this build */
  }
  return '';
}

// The repo publishes a rolling release tagged `latest`; ignore anything that
// isn't a real `vX.Y.Z` tag and return the highest one.
function getLatestVersionedRelease() {
  return fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((releases) => {
      if (!Array.isArray(releases)) return null;
      let best = null;
      let bestParts = null;
      for (const r of releases) {
        if (!r || r.draft || r.prerelease) continue;
        const tag = String(r.tag_name || '');
        if (!/^v?\d+\.\d+\.\d+$/.test(tag)) continue;
        const parts = parseVersion(tag);
        if (!bestParts || isNewerParts(parts, bestParts)) {
          best = { tag, url: r.html_url };
          bestParts = parts;
        }
      }
      return best;
    });
}

function parseVersion(v) {
  return String(v || '')
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewerParts(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

function isNewerThan(tag, current) {
  return isNewerParts(parseVersion(tag), parseVersion(current));
}

function showBanner(text, url) {
  if (document.getElementById(UPDATE_BANNER)) return;

  const box = document.createElement('div');
  box.id = UPDATE_BANNER;
  box.setAttribute('role', 'status');
  box.style.cssText =
    'position:fixed;bottom:16px;right:16px;z-index:9999;background:#1f1f1f;' +
    'color:#e8e8e8;border:1px solid #3a3a3a;border-radius:10px;padding:12px 16px;' +
    'font:13px/1.45 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.5);' +
    'display:flex;align-items:center;gap:12px;max-width:320px;';

  const label = document.createElement('span');
  label.textContent = text;

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Download';
  button.style.cssText =
    'background:#3ea6ff;color:#0b0b0b;border:0;border-radius:6px;' +
    'padding:7px 12px;font:600 13px system-ui,sans-serif;cursor:pointer;';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = '✕';
  dismiss.setAttribute('aria-label', 'Dismiss update banner');
  dismiss.style.cssText =
    'background:none;border:0;color:#9a9a9a;font:14px system-ui,sans-serif;cursor:pointer;';

  button.addEventListener('click', () => {
    if (Capacitor.isNativePlatform()) {
      Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener');
    }
  });
  dismiss.addEventListener('click', () => box.remove());

  box.appendChild(label);
  box.appendChild(button);
  box.appendChild(dismiss);
  document.body.appendChild(box);
}
