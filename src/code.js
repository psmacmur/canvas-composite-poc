const images = [];
let imageCount = 0;
let imageMetadata = [];
let currentImage = 0;

const createMetaData = function createMetaData() {
    return {
        scale: 1,
        tx: 0,
        ty: 0,
    };
};

const loadImage = function (file, i) {
    var image = document.createElement("img");
    var loaded = false;
    var loadHandler = function loadHandler() {
        if (!loaded) {
            loaded = true;
            images[i] = this;
            imageMetadata[i] = createMetaData();
        }
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
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageCount; i++) {
        if (images[i]) {
            ctx.drawImage(images[i], 0, 0, images[i].width, images[i].height,
                imageMetadata[i].tx, imageMetadata[i].ty,
                images[i].width * imageMetadata[i].scale, images[i].height * imageMetadata[i].scale);
        }
    }
}

function processFiles(oFiles) {
    //check for browser support 
    // sort by name
    if (oFiles) {
        const files = [];
        for (var i = 0; i < oFiles.length; i++) {
            files.push(oFiles[i]);
        }
        files.sort((a, b) => {
            var nameA = a.name.toUpperCase(); // ignore upper and lowercase
            var nameB = b.name.toUpperCase(); // ignore upper and lowercase
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }

            // names must be equal
            return 0;
        });
        //extract FileList as File object
        for (var i = 0; i < files.length; i++) {
            loadImage(files[i], imageCount + i);
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

    processFiles(oFiles);

    imageCount += nFiles;
    currentImage = imageCount - 1; // image to move / scale
}

function over_handler(event) { }
function enter_handler(event) { }

// pointer (mouse & touch) tracking
let isPointerDown = false;
let startX = 0;
let startY = 0;

function down_handler(event) {
    isPointerDown = true;
    for (let i = imageCount - 1; i >= 0; i--) {
        if (event.x >= imageMetadata[i].tx && event.y >= imageMetadata[i].ty &&
            event.x <= images[i].width * imageMetadata[i].scale + imageMetadata[i].tx && 
            event.y <= images[i].height * imageMetadata[i].scale + imageMetadata[i].ty) {
            currentImage = i;
            break;
        }
    }
    startX = event.x - imageMetadata[currentImage].tx;
    startY = event.y - imageMetadata[currentImage].ty;
}

function move_handler(event) {
    if (isPointerDown) {
        imageMetadata[currentImage].tx = event.x - startX;
        imageMetadata[currentImage].ty = event.y - startY;
        render();
    }
}
function up_handler(event) {
    isPointerDown = false;
}
function cancel_handler(event) {
    isPointerDown = false;
}
function out_handler(event) { }
function leave_handler(event) { }
function gotcapture_handler(event) { }
function lostcapture_handler(event) { }

let scale = 1;
function zoom(event) {
    event.preventDefault();

    scale += event.deltaY * -0.01;

    // Restrict scale
    scale = Math.min(Math.max(.125, scale), 4);

    // Apply scale transform
    imageMetadata[currentImage].scale = scale;
    render();
}

function init(event) {
    console.log('DOM fully loaded and parsed');
    document.getElementById("uploadInput").addEventListener("change", updateFiles, false);

    var el = document.getElementById("myCanvas");
    // Register pointer event handlers
    el.onpointerover = over_handler;
    el.onpointerenter = enter_handler;
    el.onpointerdown = down_handler;
    el.onpointermove = move_handler;
    el.onpointerup = up_handler;
    el.onpointercancel = cancel_handler;
    el.onpointerout = out_handler;
    el.onpointerleave = leave_handler;
    el.gotpointercapture = gotcapture_handler;
    el.lostpointercapture = lostcapture_handler;
    el.onwheel = zoom;
}

window.addEventListener('DOMContentLoaded', init);
