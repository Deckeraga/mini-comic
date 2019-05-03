const {app, BrowserWindow} = require('electron')

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    minHeight: 500,
    minWidth: 500,
    titleBarStyle: 'customButtonsOnHover', 
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
  })

  mainWindow.loadFile('index.html')

  mainWindow.setAspectRatio(9/16);
  
  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})
