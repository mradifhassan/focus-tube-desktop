/**
 * @file updater.js
 * Looks for new FocusTube releases. Only active inside the native Android app
 * (Capacitor); on desktop (Electron) and plain web this module is a no-op —
 * Windows auto-updates via electron-updater, Debian users run `apt upgrade`,
 * and macOS has a "Check for Updates…" menu item in the main process.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const REPO = 'mradifhassan/focus-tube-desktop';

export const UPDATE_BANNER = 'focustube-update-banner';

export function initNativeUpdateChecker() {
  if (!Capacitor.isNativePlatform()) return;

  Promise.all([getLatestRelease(), App.getInfo()])
    .then(([release, info]) => {
      const latest = String(release.tag_name || '').replace(/^v/i, '');
      const current = String(info.versionName || '').replace(/^v/i, '');
      if (latest && isNewerThan(latest, current)) {
        showBanner(`FocusTube v${latest} is available`, release.html_url);
      }
    })
    .catch(() => {
      // Offline / GitHub errors — stay quiet, never block the app.
    });
}

function getLatestRelease() {
  return fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  }).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

function parseVersion(v) {
  return String(v || '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
}

function isNewerThan(tag, current) {
  const a = parseVersion(tag);
  const b = parseVersion(current);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

function showBanner(text, url) {
  if (document.getElementById(UPDATE_BANNER)) return;

  let box = document.createElement('div');
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

  button.addEventListener('click', () => Browser.open({ url }));
  dismiss.addEventListener('click', () => box.remove());

  box.appendChild(label);
  box.appendChild(button);
  box.appendChild(dismiss);
  document.body.appendChild(box);
}