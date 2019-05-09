const {app, BrowserWindow, Menu, dialog} = require('electron')
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    titleBarStyle: 'customButtonsOnHover', 
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
  })

  mainWindow.loadFile('index.html');
  
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

// Template for the application menu
const template = [
  {
     label: 'mini-comic',
     submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { type: 'separator' },
        { role: 'quit' }
     ]
  },
  {
     label: 'File',
     submenu: [
      {
        label: 'Open Comic...',
        click: openFileDialog,
        accelerator: 'CommandOrControl+O'
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

function openFileDialog() {
  dialog.showOpenDialog({
    properties: [ 'openFile'], 
    filters: [{ name: 'comic', extensions: ['cbr', 'cbz'] }],
  }, 
  (files) => {
    if (files !== undefined && files.length > 0) {
        mainWindow.webContents.send('open-file', files[0]);
    }
  });
};
