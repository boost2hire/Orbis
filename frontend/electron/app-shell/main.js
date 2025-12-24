const { app, BrowserWindow, session } = require("electron");
const path = require("path");

// Disable all background throttling so music continues playing
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

// Required flags for camera
app.commandLine.appendSwitch("use-fake-ui-for-media-stream"); // auto-allow
app.commandLine.appendSwitch("enable-features", "MediaCapture");

function createWindow() {
  console.log("🔵 MAIN LOADED");

  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,

      // REQUIRED for camera access
      webSecurity: false,
      allowRunningInsecureContent: true,
      media: true,

      // 🔥 Keeps audio + JS running even when not focused
      backgroundThrottling: false
    }
  });

  // Camera permission
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media") {
      console.log("⚡ Camera permitted");
      callback(true);
    } else {
      callback(false);
    }
  });

  win.loadURL("http://localhost:8080");

  win.webContents.on("did-finish-load", () => {
    console.log("🔵 Renderer Loaded");
  });
}

app.whenReady().then(createWindow);
