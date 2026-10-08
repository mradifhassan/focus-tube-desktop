/**
 * FocusTube desktop — Electron main process.
 * Serves the static FocusTube build from a loopback HTTP server so the app has
 * a real http:// origin (YouTube embeds and Invidious/oEmbed fetches rely on
 * that), then opens it in a dedicated window.
 */

const { app, BrowserWindow, dialog, Menu, shell } = require('electron');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');

// The GPU/compositor process is unreliable on some Linux/Wayland setups and
// crashes shortly after launch ("GPU process isn't usable. Goodbye"), taking
// the whole app with it. Software rendering is plenty for a video-viewer UI.
app.disableHardwareAcceleration();

const DEFAULT_PORT = 18732;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const APP_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'app')
  : path.join(__dirname, 'app');

const GITHUB_REPO = 'mradifhassan/focus-tube-desktop';

let server = null;
let mainWindow = null;

// ---------------------------------------------------------------- updater ---
// Windows: electron-updater pulls the new release from GitHub, prompts, and
// installs it (NSIS). macOS/Linux: no auto-install (Apple requires paid signing
// for that, and Debian users run `apt upgrade`), so a "Check for Updates…" menu
// item surfaces new versions and opens the Releases page instead.

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'FocusTube',
          Accept: 'application/vnd.github+json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

function parseVersion(v) {
  return String(v || '')
    .replace(/^v/i, '')
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

async function checkForUpdatesFromMenu() {
  try {
    const release = await fetchJson(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );
    const latest = String(release.tag_name || '').replace(/^v/i, '');
    const current = app.getVersion();
    const dialogOpts = {
      type: 'info',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: 'FocusTube',
      message: 'You are up to date.',
      detail: `FocusTube ${current} is the latest version.`,
    };
    if (latest && isNewerThan(latest, current)) {
      dialogOpts.message = `Update available — FocusTube ${latest}`;
      dialogOpts.detail = `You are running ${current}. Open the download page?`;
      const { response } = await dialog.showMessageBox(
        mainWindow || undefined,
        dialogOpts
      );
      if (response === 0 && release.html_url) shell.openExternal(release.html_url);
    } else {
      await dialog.showMessageBox(mainWindow || undefined, dialogOpts);
    }
  } catch (err) {
    console.error('Update check failed:', err.message);
    dialog.showMessageBox(mainWindow || undefined, {
      type: 'error',
      title: 'FocusTube',
      message: 'Could not check for updates',
      detail: 'Please try again later.',
    });
  }
}

function setupWinAutoUpdater() {
  if (!app.isPackaged || process.platform !== 'win32') return;

  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    const v = (info && (info.version || info.releaseName)) || '';
    dialog
      .showMessageBox(mainWindow || undefined, {
        type: 'info',
        title: 'Update available',
        message: `FocusTube ${v} is available`,
        detail: 'Would you like to download and install it now?',
        buttons: ['Download & install', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.downloadUpdate();
      });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(mainWindow || undefined, {
        type: 'info',
        title: 'Update ready',
        message: 'FocusTube has been updated',
        detail: 'Restart now to apply the update.',
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err && err.message);
  });

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}

function buildAppMenu() {
  const helpMenu = {
    label: 'Help',
    role: 'help',
    submenu: [
      { label: 'Check for Updates…', click: () => checkForUpdatesFromMenu() },
      { type: 'separator' },
      { role: 'about' },
    ],
  };
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    ...(process.platform === 'darwin' ? [{ role: 'windowMenu' }] : []),
    helpMenu,
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function handleRequest(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  } catch (err) {
    urlPath = '/';
  }
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const rel = urlPath.replace(/^\/+/, '');
  const filePath = path.join(APP_DIR, rel);

  // Block path traversal.
  if (filePath !== APP_DIR && !filePath.startsWith(APP_DIR + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — any unknown deep path renders the app shell.
      fs.readFile(path.join(APP_DIR, 'index.html'), (err2, idx) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(idx);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000',
    });
    res.end(data);
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer(handleRequest);
    const onError = (err) => {
      if (err.code === 'EADDRINUSE') {
        srv.removeListener('listening', onListening);
        srv.listen(0, '127.0.0.1', onListening);
        return;
      }
      reject(err);
    };
    const onListening = () => {
      srv.removeListener('error', onError);
      server = srv;
      resolve(srv.address().port);
    };
    srv.on('error', onError);
    srv.once('listening', onListening);
    srv.listen(DEFAULT_PORT, '127.0.0.1');
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: '#0f0f0f',
    title: 'FocusTube',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}/`);

  // Any link that opens a new window (target=_blank) goes to the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer();
      createWindow(port);
      buildAppMenu();
      setupWinAutoUpdater();
    } catch (err) {
      console.error('Failed to start FocusTube:', err);
      app.quit();
    }
  });

  app.on('will-quit', () => {
    if (server) server.close();
  });
}