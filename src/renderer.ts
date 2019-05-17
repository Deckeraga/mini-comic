import { remote, ipcRenderer } from 'electron';
import rimraf = require('rimraf');
import temp = require('temp');
import unrar = require('electron-unrar-js');
import unzip = require('unzipper');
import path = require('path');
import * as fs from 'fs';

// Reference to application window
const kCurrentWindow = remote.getCurrentWindow();

// Constants for keyboard events
const LEFT_ARROW = 'ArrowLeft';
const RIGHT_ARROW = 'ArrowRight';

// Reader modes
enum Mode {
  READER,
  NOCOMIC
}

// Current page
let myCurrentPage = 0;

// List of image references
let myPageList = new Array<string>();

// Track temp directory
temp.track();

// Directory for unzipped/rar'd comics
const kTempDirectory = temp.mkdirSync();

// Sub Directory for currently loaded comic
let mySubDirectory = '';

// Previous aspect ratio
let myLastRatio = 0;

/**
 * Initialize the application
 */
function init(): void {
  kCurrentWindow.setSize(300, 300);
  setMode(Mode.NOCOMIC);

  // Drag handler
  document.ondragover = document.ondrop = (e: DragEvent) => {
    e.preventDefault();
  };

  // Drop handler
  document.body.ondrop = (e: DragEvent) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
      loadComic(file.path);
      break;
    }
  };

  // Button listeners
  getForwardButton().addEventListener('click', nextPage);
  getBackButton().addEventListener('click', prevPage);

  getCurrentPageElement().onchange = () => setPage(parseInt(getCurrentPageElement().value, 10) - 1);
  getCurrentPageElement().onkeydown = e => e.stopPropagation();

  getCurrentPageElement().onclick = () => {
    getCurrentPageElement().focus();
    getCurrentPageElement().select();
  };

  // Keyboard listeners
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    switch (event.key) {
      case LEFT_ARROW:
        prevPage();
        break;
      case RIGHT_ARROW:
        nextPage();
        break;
    }
  });
}

/**
 * Set and initialize the application mode
 * @param theMode
 */
function setMode(theMode: Mode): void {
  switch (theMode) {
    case Mode.READER:
      getNoComic().style.display = 'none';
      getPageHolder().style.display = '';
      getButtonHolder().style.display = '';
      break;
    case Mode.NOCOMIC:
      getNoComic().style.display = '';
      getPageHolder().style.display = 'none';
      getButtonHolder().style.display = 'none';
      break;
  }
}

/**
 * Load and initialize a new comic from a file
 * @param theFilePath
 */
function loadComic(theFilePath: string): void {
  const aFileName = path.basename(theFilePath);
  myPageList = [];

  // Handle .cbz (zipped comics)
  if (getExtension(theFilePath) === '.cbz') {
    const dir = initComicDirectory(aFileName.replace('.cbz', ''));

    fs.createReadStream(theFilePath)
      .pipe(unzip.Extract({ path: kTempDirectory + '/' }))
      .on('close', () => {
        fs.readdirSync(dir).forEach(f => myPageList.push(f));
        setPage(0);
      });
  }

  // Handle .cbr (rarred comics)
  if (getExtension(theFilePath) === '.cbr') {
    const dir = initComicDirectory(aFileName.replace('.cbr', ''));

    const extractor = unrar.createExtractorFromFile(theFilePath, kTempDirectory);
    extractor.extractAll();

    fs.readdirSync(dir).forEach(f => myPageList.push(f));
    setPage(0);
  }
  setMode(Mode.READER);
}

/**
 * Set the current page and load it
 * @param thePage
 */
function setPage(thePage: number): void {
  myCurrentPage = Math.min(Math.max(thePage, 0), myPageList.length - 1);
  const aPage: HTMLImageElement = getPage();
  aPage.src = getComicDirectory() + '/' + myPageList[myCurrentPage];
  aPage.onload = () => {
    adjustWindowSize();
    updatePageStatus();
  };
}

/**
 * Calculate the proper window size and apply it
 */
function adjustWindowSize(): void {
  const aImg: HTMLImageElement = getPage();

  kCurrentWindow.setAspectRatio(aImg.naturalWidth / aImg.naturalHeight, undefined);

  if (myLastRatio !== aImg.naturalWidth / aImg.naturalHeight) {
    kCurrentWindow.setSize(aImg.width, aImg.height);
    myLastRatio = aImg.naturalWidth / aImg.naturalHeight;
  }
}

/**
 * Initialize a fresh directory for the newly loaded comic
 * @param theSubDirectory the sub directory name
 */
function initComicDirectory(theSubDirectory: string): string {
  mySubDirectory = '/' + theSubDirectory;

  const aDir = getComicDirectory();

  if (fs.existsSync(aDir)) {
    rimraf.sync(aDir);
  }
  fs.mkdirSync(aDir);

  return aDir;
}

/**
 * Get the temp drectory where the currently loaded comic is stored
 */
function getComicDirectory(): string {
  return kTempDirectory + mySubDirectory.replace(/:$/, '');
}

/**
 * Update the page indicator
 */
function updatePageStatus(): void {
  getCurrentPageElement().setAttribute('min', '' + (myCurrentPage + 1));
  getCurrentPageElement().setAttribute('max', '' + myPageList.length);
  getCurrentPageElement().value = '' + (myCurrentPage + 1);

  getTotalPageElement().textContent = '' + myPageList.length;
}

/**
 * Navigate to the next page
 */
function nextPage(): void {
  const aNewPage = Math.min(myPageList.length - 1, myCurrentPage + 1);
  setPage(aNewPage);
}

/**
 * Navigate to the previous page
 */
function prevPage(): void {
  const aNewPage = Math.max(0, myCurrentPage - 1);
  setPage(aNewPage);
}

/**
 * Utility to retrieve file extension
 * @param theFileName
 */
function getExtension(theFileName: string): string {
  const i = theFileName.lastIndexOf('.');
  return i < 0 ? '' : theFileName.substr(i);
}

/**
 * Retrieve current page status element
 */
function getCurrentPageElement(): HTMLInputElement {
  return document.querySelector('#current-page');
}

/**
 * Retrieve total page status element
 */
function getTotalPageElement(): HTMLElement {
  return document.querySelector('#total-page');
}

/**
 * Retrieve the forward button element
 */
function getForwardButton(): HTMLElement {
  return document.querySelector('#forward');
}

/**
 * Retrieve the back button element
 */
function getBackButton(): HTMLElement {
  return document.querySelector('#back');
}

/**
 * Retrieve the currently displayed image
 */
function getPage(): HTMLImageElement {
  return document.querySelector('#page');
}

/**
 * Retrieve element displayed when no comic is being displayed
 */
function getNoComic(): HTMLElement {
  return document.querySelector('#no-comic');
}

/**
 * Retrieve page container element
 */
function getPageHolder(): HTMLElement {
  return document.querySelector('#page-holder');
}

/**
 * Retrieve control button container element
 */
function getButtonHolder(): HTMLElement {
  return document.querySelector('#button-holder');
}

/**
 * Handle file from File -> Open menu
 */
ipcRenderer.on('open-file', (_: any, theFilePath: string) => {
  loadComic(theFilePath);
});

init();
