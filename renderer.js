// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote, BrowserWindow } = require('electron');
const currentWindow = remote.getCurrentWindow();
var Unrar = require('unrar');
var archive = new Unrar('archive.rar');

// Set up Dnd
(function () {
    var dndTarget = document.getElementById('drag-file');

    dndTarget.ondrop = (e) => {
        e.preventDefault();

        for (let file of e.dataTransfer.files) {
            console.log('Files: ', file.path)
            if (getExtension("cbz"))
            {
                fs.createReadStream(file.path).pipe(unzip.Extract({ path: '~/Desktop' }));
            }

            if (getExtension("cbr"))
            {

            }
        }

        return false;
    };
})();

function getExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
}

function nextPage() {
    // TODO
}

function prevPage() {
    // TODO
}

document.querySelector('#forward').addEventListener('click', () => {
    nextPage();
});

document.querySelector('#back').addEventListener('click', () => {
    prevPage();
});

