import { remote } from 'electron';
import temp from 'temp';
import unrar from 'unrar';
import unzip from 'unzip';
import * as fs from 'fs';

const currentWindow = remote.getCurrentWindow();

const LEFT_ARROW = "ArrowLeft";
const RIGHT_ARROW = "ArrowRight";

enum Mode {
    READER,
    NOCOMIC
}

// Current page
let currentPage = 0;

// List of image references
let pageList = new Array();

temp.track();

// Directory for unzipped/rar'd comics
const tempDirectory = temp.mkdirSync()

// Sub Directory
let aSubDirectory = '';

// Utility to retrieve file extension
function getExtension(filename: string): string {
    const i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

// Revert to previous page
function nextPage(): void {
    const newPage = Math.min(pageList.length - 1, currentPage + 1);
    setPage(newPage);
}

// Advance to the next page
function prevPage(): void {
    const newPage = Math.max(0, currentPage - 1);
    setPage(newPage);
}

// Load current page and update index
function setPage(thePage): void {
    currentPage = thePage;
    const page: HTMLImageElement = document.querySelector('#page')
    page.src = tempDirectory + aSubDirectory + '/' + pageList[currentPage];
    onPageChange();
    updatePageStatus();
}

function onPageChange(): void {
    const img: HTMLImageElement = document.querySelector("#page");
    try{
        currentWindow.setAspectRatio(img.naturalWidth / img.naturalHeight, undefined);
    } catch {
        console.log("error");
    }
}

// Run on startup
function init(): void {
    currentWindow.setSize(375, 210);
    setMode(Mode.NOCOMIC);

    // Drag handler
    document.ondragover = document.ondrop = (e: DragEvent) => {
        e.preventDefault()
    }

    // Drop handler
    document.body.ondrop = (e: DragEvent) => {
        e.preventDefault();
        for (const file of e.dataTransfer.files) {
            loadComic(file);
            break;
        }
    }

    // Button listeners
    document.querySelector('#forward').addEventListener('click', () => {
        nextPage();
    });

    document.querySelector('#back').addEventListener('click', () => {
        prevPage();
    });

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

// Update the page status indicator
function updatePageStatus(): void {
    document.querySelector('#page-status').textContent = (currentPage + 1) + " / " + (pageList.length);
}

// Set application mode
function setMode(mode : Mode): void {
    switch(mode) {
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

function getNoComic() : HTMLElement {
    return document.querySelector('#no-comic');
}

function getPageHolder() : HTMLElement {
    return document.querySelector('#page-holder');
}

function getButtonHolder() : HTMLElement {
    return document.querySelector('#button-holder');
}

// Initialize and load a new comic
function loadComic(file): void {
    if (file !== undefined) {
        const filepath = file.path;
        const filename = file.name;

        // Handle .cbz (zipped comics)
        if (getExtension(filepath) === '.cbz') {
            aSubDirectory = '/' + filename.replace('.cbz', '');
            const aDirectory = tempDirectory + aSubDirectory;

            if (fs.existsSync(aDirectory)) {
                fs.rmdirSync(aDirectory);
            }

            fs.mkdirSync(aDirectory);
            fs.createReadStream(filepath).pipe(unzip.Extract({ path: tempDirectory + "/"}));

            pageList = [];
            fs.readdirSync(aDirectory).forEach(pageList.push);
            setPage(0);
        }

        // Handle .cbr (rarred comics)
        if (getExtension(filepath) === '.cbr') {
            // var archive = new Unrar(filepath);

            // archive.list( (err, items) => {
            //     pageList = [];
            //     pageList = items;
            //     setPage(0);
            // });
        }
        setMode(Mode.READER);
    }
}

init();


