const remote = require('electron').remote;
const currentWindow = remote.getCurrentWindow();
var Unrar = require('unrar');
var temp = require('temp');
const unzip = require('unzip');
const fs = require('fs');

const LEFT_ARROW = "ArrowLeft";
const RIGHT_ARROW = "ArrowRight";

const MODES = {
    READER : 'reader',
    NOCOMIC : 'nocomic'
};

// Current page
var currentPage = 0;

// List of image references
var pageList = new Array();

temp.track();

// Directory for unzipped/rar'd comics
var tempDirectory = temp.mkdirSync()

// Sub Directory
var aSubDirectory = '';

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
    document.querySelector('#page').src = tempDirectory + aSubDirectory + '/' + pageList[currentPage];
    onPageChange();
    updatePageStatus();
}

function onPageChange() {
    const img = document.querySelector("#page");
    try{
        currentWindow.setAspectRatio(img.naturalWidth / img.naturalHeight);
    } catch{

    }
}

// Run on startup
function init() {
    currentWindow.setSize(375, 210);
    setMode(MODES.NOCOMIC);

    // Drag handler
    document.ondragover = document.ondrop = (e) => {
        e.preventDefault()
    }

    // Drop handler
    document.body.ondrop = (e) => {
        e.preventDefault();
        for (let file of e.dataTransfer.files) {
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
}

// Update the page status indicator
function updatePageStatus() {
    document.querySelector('#page-status').textContent = (currentPage + 1) + " / " + (pageList.length);
}

// Set application mode
function setMode(mode) {
    console.log("mode: " + mode);
    switch(mode) {
        case MODES.READER:
            document.querySelector('#no-comic').style.display = "none";
            document.querySelector('#page-holder').style.display = "";
            document.querySelector('#button-holder').style.display = "";
            break;
        case MODES.NOCOMIC:
            document.querySelector('#no-comic').style.display = "";
            document.querySelector('#page-holder').style.display = "none";
            document.querySelector('#button-holder').style.display = "none";
            break;
    }
}

// Initialize and load a new comic
function loadComic(file) {
    if (file != undefined)
    {
        const filepath = file.path;
        const filename = file.name;

        // Handle .cbz (zipped comics)
        if (getExtension(filepath) == '.cbz') {
            aSubDirectory = '/' + filename.replace('.cbz', '');
            const aDirectory = tempDirectory + aSubDirectory;

            debugger;

            if (fs.existsSync(aDirectory)) {
                fs.rmdirSync(aDirectory);
            }

            fs.mkdirSync(aDirectory);
            fs.createReadStream(filepath).pipe(unzip.Extract({ path: tempDirectory + "/"}));

            pageList = [];
            fs.readdirSync(aDirectory).forEach(file => {
                console.log(file);
                pageList.push(file);
            });
            setPage(0);
        }

        // Handle .cbr (rarred comics)
        if (getExtension(filepath) == '.cbr') {
            // var archive = new Unrar(filepath);

            // archive.list( (err, items) => {
            //     pageList = [];
            //     pageList = items;
            //     setPage(0);
            // });
        }
        setMode(MODES.READER);
    }
}

init();


