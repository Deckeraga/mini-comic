// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const remote = require('electron').remote;
const currentWindow = remote.getCurrentWindow();
var Unrar = require('unrar');
var temp = require('temp');
const unzip = require('unzip');
const fs = require('fs');

const LEFT_ARROW = "ArrowLeft";
const RIGHT_ARROW = "ArrowRight";

// Current page
var currentPage = 0;

// List of image references
var pageList = new Array();

temp.track();

// just for testing..
//const testFolder = './test_files/';
var aDirectory = '';

document.ondragover = document.ondrop = (e) => {
    e.preventDefault()
}

document.body.ondrop = (e) => {
    e.preventDefault();
    console.log("dropped");
    for (let file of e.dataTransfer.files) {
        console.log("loopin");
        loadComic(file);
        break;
    }
}

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
    document.querySelector('#page').src = aDirectory + '/' + pageList[currentPage];
    onPageChange();
}

function onPageChange() {
    const img = document.querySelector("#page");
    try{
        currentWindow.setAspectRatio(img.naturalWidth / img.naturalHeight);
    } catch{

    }
    updatePageStatus();
}

// Button listeners
document.querySelector('#forward').addEventListener('click', () => {
    nextPage();
});

document.querySelector('#back').addEventListener('click', () => {
    prevPage();
});

// Keyboard listeners
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

// Update the page status indicator
function updatePageStatus() {
    document.querySelector('#page-status').textContent = (currentPage + 1) + " / " + (pageList.length);
}

// Initialize a comic
function loadComic(file) {
    if (file != undefined)
    {
        const filepath = file.path;
        const filename = file.name;

        aDirectory = '/Users/alexanderdecker/Dev/electron-quick-start/temp/' + filename;

        if (getExtension(filepath) == '.cbz') {
            aDirectory = '/Users/alexanderdecker/Dev/electron-quick-start/temp/' + filename.replace('.cbz', '');
            fs.createReadStream(filepath).pipe(unzip.Extract({ path: '/Users/alexanderdecker/Dev/electron-quick-start/temp/'}))
        }

        if (getExtension(filepath) == '.cbr') {
            var archive = new Unrar(filepath);
        }

        fs.readdirSync(aDirectory).forEach(file => {
            console.log(file);
            pageList.push(file);
        });
        setPage(0);
    }
}

//loadComic();

const img = document.querySelector("#page");



