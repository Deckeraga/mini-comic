// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote, BrowserWindow } = require('electron');
const currentWindow = remote.getCurrentWindow();
var Unrar = require('unrar');
var temp = require('temp');
var archive = new Unrar('archive.rar');

const LEFT_ARROW = "ArrowLeft";
const RIGHT_ARROW = "ArrowRight";

// Current page
var currentPage = 0;

// List of image references
var pageList = new Array();

temp.track();

// just for testing..
const testFolder = './test_files/';
const fs = require('fs');

fs.readdirSync(testFolder).forEach(file => {
  console.log(file);
  pageList.push(file);
});
//

// Set up drag and drop
(() => {
    var dndTarget = document.getElementById('drag-file');

    dndTarget.ondrop = (e) => {
        e.preventDefault();

        for (let file of e.dataTransfer.files) {
            console.log('Files: ', file.path);

            if (getExtension("cbz")) {
                fs.createReadStream(file.path).pipe(unzip.Extract({ path: '~/Desktop' }));
            }

            if (getExtension("cbr")) {

            }
        }
        return false;
    };
})();

// Utility to retrieve file extension
function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

// Revert to previous page
function nextPage() {
    let newPage = Math.min(pageList.length - 1, currentPage + 1);
    setPage(newPage);
}

// Advance to the next page
function prevPage() {
    let newPage = Math.max(0, currentPage - 1);
    setPage(newPage);
}

// Load current page and update index
function setPage(thePage) {
    currentPage = thePage;
    console.log("setting page: " + pageList[currentPage]);
    document.querySelector('#page').src = "./test_files/" + pageList[currentPage];
    onPageChange();
}

function onPageChange() {
    if (currentWindow !== undefined) {
        const img = document.querySelector("#page");
        currentWindow.setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
    recalculateSize();
}

function recalculateSize() {
    //console.log("resizing");
    //currentWindow.dispatchEvent(new Event('resize'));
}

// Button listeners
document.querySelector('#forward').addEventListener('click', () => {
    nextPage();
});

document.querySelector('#back').addEventListener('click', () => {
    prevPage();
});

// Key listeners
document.addEventListener('keydown', event => {
    switch (event.key) {
        case LEFT_ARROW:
            prevPage();
            break;
        case RIGHT_ARROW:
            nextPage();
            break;
    }
});

setPage(0);

