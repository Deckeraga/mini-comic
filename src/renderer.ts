import { remote } from "electron";
import temp = require("temp");
import unrar = require("node-unrar");
import unzip = require("unzip");
import * as fs from "fs";

const currentWindow = remote.getCurrentWindow();

// Constants for keyboard events
const LEFT_ARROW = "ArrowLeft";
const RIGHT_ARROW = "ArrowRight";

// Reader modes
enum Mode {
  READER,
  NOCOMIC
}

// Current page
let myCurrentPage = 0;

// List of image references
let myPageList = new Array();

// Track temp directory
temp.track();

// Directory for unzipped/rar'd comics
const kTempDirectory = temp.mkdirSync();

// Sub Directory
let mySubDirectory = "";

// Previous aspect ratio
let myLastRatio = 0;

/**
 * Get the temp drectory where the currently loaded comic is stored
 */
function getComicDirectory(): string {
  return kTempDirectory + mySubDirectory.replace(/:$/, "");
}

/**
 * Utility to retrieve file extension
 */
function getExtension(aFileName: string): string {
  const i = aFileName.lastIndexOf(".");
  return i < 0 ? "" : aFileName.substr(i);
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
 * Set the current page and load it
 * @param thePage
 */
function setPage(thePage: number): void {
  myCurrentPage = thePage;
  const aPage: HTMLImageElement = getPage();
  aPage.src = getComicDirectory() + "/" + myPageList[myCurrentPage];
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

  currentWindow.setAspectRatio(aImg.naturalWidth / aImg.naturalHeight, undefined);

  if (myLastRatio !== aImg.naturalWidth / aImg.naturalHeight) {
    currentWindow.setSize(aImg.width, aImg.height);
    myLastRatio = aImg.naturalWidth / aImg.naturalHeight;
  }
}

/**
 * Initialize the application
 */
function init(): void {
  currentWindow.setSize(300, 300);
  setMode(Mode.NOCOMIC);

  // Drag handler
  document.ondragover = document.ondrop = (e: DragEvent) => {
    e.preventDefault();
  };

  // Drop handler
  document.body.ondrop = (e: DragEvent) => {
    e.preventDefault();
    for (const file of e.dataTransfer.files) {
      loadComic(file);
      break;
    }
  };

  // Button listeners
  document.querySelector("#forward").addEventListener("click", () => {
    nextPage();
  });

  document.querySelector("#back").addEventListener("click", () => {
    prevPage();
  });

  // Keyboard listeners
  document.addEventListener("keydown", (event: KeyboardEvent) => {
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
 * Update the page indicator
 */
function updatePageStatus(): void {
  document.querySelector("#page-status").textContent =
    myCurrentPage + 1 + " / " + myPageList.length;
}

/**
 * Set and initialize the application mode
 * @param theMode
 */
function setMode(theMode: Mode): void {
  switch (theMode) {
    case Mode.READER:
      getNoComic().style.display = "none";
      getPageHolder().style.display = "";
      getButtonHolder().style.display = "";
      break;
    case Mode.NOCOMIC:
      getNoComic().style.display = "";
      getPageHolder().style.display = "none";
      getButtonHolder().style.display = "none";
      break;
  }
}

/**
 * Retrieve the currently displayed image
 */
function getPage(): HTMLImageElement {
  return document.querySelector("#page");
}

/**
 * Retrieve element displayed when no comic is being displayed
 */
function getNoComic(): HTMLElement {
  return document.querySelector("#no-comic");
}

/**
 * Retrieve page container element
 */
function getPageHolder(): HTMLElement {
  return document.querySelector("#page-holder");
}

/**
 * Retrieve control button container element
 */
function getButtonHolder(): HTMLElement {
  return document.querySelector("#button-holder");
}

/**
 * Initialize a fresh directory for the newly loaded comic
 * @param theSubDirectory the sub directory name
 */
function initComicDirectory(theSubDirectory: string): string {
  mySubDirectory = "/" + theSubDirectory;

  const aDir = getComicDirectory();

  if (fs.existsSync(aDir)) {
    fs.rmdirSync(aDir);
  }
  fs.mkdirSync(aDir);

  return aDir;
}

/**
 * Load and initialize a new comic from a file
 * @param theFile
 */
function loadComic(theFile): void {
  if (theFile !== undefined) {
    const filepath = theFile.path;
    const filename = theFile.name;

    myPageList = [];

    // Handle .cbz (zipped comics)
    if (getExtension(filepath) === ".cbz") {
      const dir = initComicDirectory(filename.replace(".cbz", ""));

      fs.createReadStream(filepath)
        .pipe(unzip.Extract({ path: kTempDirectory + "/" }))
        .on("close", () => {
          fs.readdirSync(dir).forEach(f => myPageList.push(f));
          setPage(0);
        });
    }

    // Handle .cbr (rarred comics)
    if (getExtension(filepath) === ".cbr") {
      const dir = initComicDirectory(filename.replace(".cbr", ""));

      const archive = new unrar(filepath);

      archive.extract(dir, null, () => {
        fs.readdirSync(dir).forEach(f => myPageList.push(f));
        setPage(0);
      });
    }
    setMode(Mode.READER);
  }
}

init();
