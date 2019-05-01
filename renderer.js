// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { remote, BrowserWindow } = require('electron');
const currentWindow = remote.getCurrentWindow();

// Set up Dnd
(function () {
    var dndTarget = document.getElementById('drag-file');

    dndTarget.ondrop = (e) => {
        e.preventDefault();

        for (let file of e.dataTransfer.files) {
            console.log('Files: ', file.path)
            fs.createReadStream(file.path).pipe(unzip.Extract({ path: '~/Desktop' }));
        }

        return false;
    };
})();

document.querySelector('#single-page').addEventListener('click', () => {
    document.querySelector('#page-two').style.display = 'none';
    currentWindow.setAspectRatio(9/16);
});

document.querySelector('#double-page').addEventListener('click', () => {
    document.querySelector('#page-two').style.display = '';
    currentWindow.setAspectRatio(21/16);
});

