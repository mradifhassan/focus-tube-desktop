/**
 * FocusTube desktop — Electron main process.
 * Serves the static FocusTube build from a loopback HTTP server so the app has
 * a real http:// origin (YouTube embeds and Invidious/oEmbed fetches rely on
 * that), then opens it in a dedicated window.
 */

const { app, BrowserWindow, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

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

let server = null;
let mainWindow = null;

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
    autoHideMenuBar: true,
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
    } catch (err) {
      console.error('Failed to start FocusTube:', err);
      app.quit();
    }
  });

  app.on('will-quit', () => {
    if (server) server.close();
  });
}