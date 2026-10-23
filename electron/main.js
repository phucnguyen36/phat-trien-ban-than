import { app, BrowserWindow, shell, ipcMain, screen, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let miniTimerWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'DeepFocus',
    icon: path.join(__dirname, '../public/deepfocus-app-icon-512.png'),
    backgroundColor: '#07070a',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
    },
  });

  // Load production dist/index.html or dev server URL
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
      miniTimerWindow.close();
    }
  });
}

// 100% Frameless Always-On-Top Floating Mini Timer Window
function createMiniTimerWindow() {
  if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
    miniTimerWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const winWidth = 280;
  const winHeight = 82;

  // Position at bottom-right corner with 24px padding
  const posX = Math.round(workArea.x + workArea.width - winWidth - 24);
  const posY = Math.round(workArea.y + workArea.height - winHeight - 24);

  miniTimerWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: posX,
    y: posY,
    frame: false,                 // NO Windows titlebar or borders!
    transparent: true,             // Translucent glass rounded corners!
    alwaysOnTop: true,             // Floats above Slack, Premiere, etc.!
    resizable: false,
    skipTaskbar: true,             // Doesn't clutter the taskbar
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    miniTimerWindow.loadURL(`${devServerUrl}?mini=true`);
  } else {
    miniTimerWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      query: { mini: 'true' }
    });
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('mini-timer-status', true);
  }

  miniTimerWindow.on('closed', () => {
    miniTimerWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mini-timer-status', false);
    }
  });
}

// IPC Listeners for Mini Timer & Desktop Notifications
ipcMain.on('open-mini-timer', () => {
  createMiniTimerWindow();
});

ipcMain.on('close-mini-timer', () => {
  if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
    miniTimerWindow.close();
  }
});

ipcMain.on('toggle-mini-timer', () => {
  if (miniTimerWindow && !miniTimerWindow.isDestroyed()) {
    miniTimerWindow.close();
  } else {
    createMiniTimerWindow();
  }
});

ipcMain.on('show-notification', (_event, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: title || 'DeepFocus',
        body: body || '',
        icon: path.join(__dirname, '../public/deepfocus-app-icon-512.png'),
        urgency: 'critical',
      });
      notif.show();
      notif.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      });
    }
  } catch (err) {
    console.error('Failed to show native desktop notification:', err);
  }
});

app.whenReady().then(() => {
  // Set App User Model ID on Windows so desktop notifications work in Action Center
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.deepfocus.app');
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
