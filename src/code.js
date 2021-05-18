// Log events flag
var logEvents = false;

const images = [];
let imageCount = 0;
let imageMetadata = [];
let currentImage = -1;
let nextImage = -1;
let scale = 1;

// Global vars to cache event state for pinch scale
var evCache = new Array();
var prevDiff = -1;

function remove_event(ev) {
    // Remove this event from the target's cache
    for (var i = 0; i < evCache.length; i++) {
        if (evCache[i].pointerId == ev.pointerId) {
            evCache.splice(i, 1);
            break;
        }
    }
}

// Logging/debugging functions
function enableLog(ev) {
    logEvents = logEvents ? false : true;
}

function log(prefix, ev) {
    if (!logEvents) return;
    // var o = document.getElementsByTagName('output')[0];
    var s = prefix + ": pointerID = " + ev.pointerId +
        " ; pointerType = " + ev.pointerType +
        " ; isPrimary = " + ev.isPrimary;
    // o.innerHTML += s + "";
    console.log(s);
}

function clearLog(event) {
    var o = document.getElementsByTagName('output')[0];
    o.innerHTML = "";
}

const createMetaData = function createMetaData() {
    return {
        scale: scale,
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
            const w = images[i].width * imageMetadata[i].scale;
            const h = images[i].height * imageMetadata[i].scale;
            ctx.drawImage(images[i], 0, 0, images[i].width, images[i].height,
                imageMetadata[i].tx, imageMetadata[i].ty, w, h);
            if (i === currentImage) {
                ctx.strokeStyle = 'red';
                ctx.strokeRect(imageMetadata[i].tx, imageMetadata[i].ty, w, h);
            } else if (i === nextImage) {
                ctx.strokeStyle = 'yellow'
                ctx.strokeRect(imageMetadata[i].tx, imageMetadata[i].ty, w, h);
            }
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

function pick(event) {
    const x = event.offsetX;
    const y = event.offsetY;
    for (let i = imageCount - 1; i >= 0; i--) {
        const w = images[i].width * imageMetadata[i].scale;
        const h = images[i].height * imageMetadata[i].scale;

        if (x >= imageMetadata[i].tx && y >= imageMetadata[i].ty &&
            x <= w + imageMetadata[i].tx &&
            y <= h + imageMetadata[i].ty) {
            return i;
        }
    }

    return -1;
}

function down_handler(event) {
    log("pointerDown", event);
    event.preventDefault();

    isPointerDown = true;

    const i = pick(event);
    if (currentImage !== i) {
        currentImage = i;
        nextImage = -1;
        render();
        if (currentImage > -1) {
            scale = imageMetadata[currentImage].scale;
            updateScaleLabel();
        }
    }

    if (currentImage >= 0) {
        startX = event.x - imageMetadata[currentImage].tx;
        startY = event.y - imageMetadata[currentImage].ty;
        // The pointerdown event signals the start of a touch interaction.
        // This event is cached to support 2-finger gestures
        evCache.push(event);
    }
}

function move_handler(ev) {
    log("pointerMove", ev);
    // ev.target.style.border = "dashed";

    if (isPointerDown) {
        ev.preventDefault();
        // Find this event in the cache and update its record with this event
        for (var i = 0; i < evCache.length; i++) {
            if (ev.pointerId == evCache[i].pointerId) {
                evCache[i] = ev;
                break;
            }
        }

        // If two pointers are down, check for pinch gestures
        if (evCache.length == 2) {
            // Calculate the distance between the two pointers
            var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

            if (prevDiff > 0) {
                const ds = (curDiff - prevDiff) * 1.01;
                if (curDiff > prevDiff) {
                    // The distance between the two pointers has increased
                    log("Pinch moving OUT -> Zoom in", ev);
                    scale += ds;
                    // ev.target.style.background = "pink";
                }
                if (curDiff < prevDiff) {
                    // The distance between the two pointers has decreased
                    log("Pinch moving IN -> Zoom out", ev);
                    // ev.target.style.background = "lightblue";
                    scale -= ds;
                }
                render();
            }

            // Cache the distance for the next move event
            prevDiff = curDiff;
        } else if (currentImage >= 0) {
            imageMetadata[currentImage].tx = ev.x - startX;
            imageMetadata[currentImage].ty = ev.y - startY;
        }
        render();
    } else {
        const i = pick(ev);
        if (i !== nextImage) {
            nextImage = i;
            render();
        }
    }
}

function up_handler(ev) {
    isPointerDown = false;
    log(ev.type, ev);
    // Remove this pointer from the cache and reset the target's
    // background and border
    remove_event(ev);
    // ev.target.style.background = "white";
    // ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) {
        prevDiff = -1;
    }
}

function cancel_handler(event) {
    isPointerDown = false;
}

function clearSelection() {
    if (nextImage > -1) {
        nextImage = -1;
        render();
    }
    evCache = [];
}

function out_handler(event) { clearSelection(); }
function leave_handler(event) { clearSelection(); }

function gotcapture_handler(event) { }
function lostcapture_handler(event) { }

function updateScaleLabel() {
    const uiScale = Math.round(scale * 50);
    document.getElementById('fader').value = uiScale;
    document.querySelector('#volume').value = uiScale;
}

function scaleCurrentImage() {
    // Restrict scale
    scale = Math.min(Math.max(.125, scale), 4);

    // Apply scale transform
    imageMetadata[currentImage].scale = scale;
    render();
    updateScaleLabel();
}

function zoom(event) {
    if (currentImage >= 0) {
        event.preventDefault();

        scale += event.deltaY * -0.01;
        scaleCurrentImage();
    }
}

function arraySwap(arr, old_index, new_index) {
    const swap = arr[old_index];
    arr[old_index] = arr[new_index];
    arr[new_index] = swap;
    return arr; // for testing
};

function adjustZ(event, offset) {
    if (currentImage >= 0) {
        const new_index = Math.max(0, Math.min(imageCount - 1, currentImage + offset));
        if (new_index !== currentImage) {
            arraySwap(images, currentImage, new_index);
            arraySwap(imageMetadata, currentImage, new_index);
            currentImage = new_index;
            nextImage = -1;
            render();
        }
    }
}

function onSlider(value) {
    if (currentImage >= 0) {
        scale = value / 50;
        scaleCurrentImage();
    }
}

function fix_dpi(canvas) {
    //get DPI
    let dpi = window.devicePixelRatio;

    //get CSS height
    //the + prefix casts it to an integer
    //the slice method gets rid of "px"let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);//get CSS width
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);//scale the canvascanvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
    render();
}

function onResize(element, callback) {
    var elementHeight = element.height,
        elementWidth = element.width;
    setInterval(function () {
        if (element.height !== elementHeight || element.width !== elementWidth) {
            elementHeight = element.height;
            elementWidth = element.width;
            callback();
        }
    }, 300);
}

function preventBehavior(e) {
    e.preventDefault();
};

function init(event) {
    console.log('DOM fully loaded and parsed');
    document.getElementById("uploadInput").addEventListener("change", updateFiles, false);

    var canvas = document.getElementById("myCanvas");
    var canvasHost = document.getElementById("canvasHost");

    // Register pointer event handlers
    canvas.onpointerover = over_handler;
    canvas.onpointerenter = enter_handler;
    canvas.onpointerdown = down_handler;
    canvas.onpointermove = move_handler;
    canvas.onpointerup = up_handler;
    canvas.onpointercancel = cancel_handler;
    canvas.onpointerout = out_handler;
    canvas.onpointerleave = leave_handler;
    canvas.gotpointercapture = gotcapture_handler;
    canvas.lostpointercapture = lostcapture_handler;
    canvas.onwheel = zoom;

    document.getElementById("fileNum").innerHTML = "";
    document.getElementById("fileSize").innerHTML = "";

    var _savedWidth = canvas.clientWidth;
    var _savedHeight = canvas.clientHeight;
    function isResized() {
        canvas.width = canvasHost.clientWidth;
        canvas.height = canvasHost.clientHeight;
        if (_savedWidth != canvasHost.clientWidth ||
            _savedHeight != canvasHost.clientHeight) {
            _savedWidth = canvasHost.clientWidth;
            _savedHeight = canvasHost.clientHeight;
            onResize(canvas, () => fix_dpi(canvas));
        }
    }
    canvas.addEventListener("touchmove", preventBehavior, { passive: false });
    window.addEventListener("resize", isResized);
    isResized();
}

window.addEventListener('DOMContentLoaded', init);
