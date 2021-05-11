var images = [];
var imageCount = 0;

var loadImage = function(file) {
    var image = document.createElement("img");
    var loaded = false;
    var loadHandler = function loadHandler() {
        if (loaded) {
            return;
        }
        loaded = true;
        /* your code */
        images.push(this);
        render();
    }
    image.addEventListener('load', loadHandler);
    image.src = window.URL.createObjectURL(file);
    image.style.display = 'block';
    if (image.complete) {
        loadHandler();
    }
};

function render() {
    if (images.length > 0 && images.length === imageCount) {
        var canvas = document.getElementById("myCanvas");
        var ctx = canvas.getContext('2d');
        for (let i = 0; i < imageCount; i++) {
            ctx.drawImage(images[i], 0, 0, images[i].width, images[i].height, 0, 0, canvas.width, canvas.height);
        }
    }
}

function processFiles(files) {
    //check for browser support 
    if(files) {
        //extract FileList as File object
        for(var i=0; i<files.length; i++) {
            loadImage(files[i]);
        }
    }
    else {
        //some message or fallback
    }
}

function updateFiles() {
    let nBytes = 0,
        oFiles = this.files,
        nFiles = oFiles.length;
    for (let nFileId = 0; nFileId < nFiles; nFileId++) {
        nBytes += oFiles[nFileId].size;
    }
    let sOutput = nBytes + " bytes";
    // optional code for multiples approximation
    const aMultiples = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
    for (nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
        sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " (" + nBytes + " bytes)";
    }
    // end of optional code
    document.getElementById("fileNum").innerHTML = nFiles;
    document.getElementById("fileSize").innerHTML = sOutput;

    imageCount += nFiles;
    processFiles(oFiles);
}

window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    document.getElementById("uploadInput").addEventListener("change", updateFiles, false);
});
