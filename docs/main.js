let frames = [];
let maxFrames = 30;
let video = document.querySelector("video");
let source = document.querySelector("source");
let canvasRead = document.querySelector("#canvasRead");
let ctxRead = canvasRead.getContext('2d', {willReadFrequently: true});
let canvasWrite = document.querySelector("#canvasWrite");
let ctxWrite = canvasWrite.getContext('2d');
let lastDisplayedFrame = -1;
let seek = document.querySelector('#seek');
let nframes = document.querySelector('#nframes');
let fileInput = document.querySelector('#file');

let requested = false;
canvasWrite.onpointermove = (e) => {
    if (requested) return;
    requested = true;
    requestAnimationFrame(() => {
        requested = false;
        let percent = Math.min(Math.max(0, e.offsetX) / e.target.width, 1);
        if (frames.length == 0) return;
        let i = Math.min(Math.floor(percent * frames.length), frames.length - 1);
        if (i == lastDisplayedFrame) return;
        let {mediaTime, frame} = frames[i];
        ctxWrite.putImageData(frame, 0, 0);
        lastDisplayedFrame = i;
    });
};

nframes.onchange = (e) => {
    maxFrames = nframes.valueAsNumber;
};

fileInput.onchange = (e) => {
    if (fileInput.files.length === 0) return;
    let file = fileInput.files[0];
    let source = video.querySelector('source');
    if (source === null) {
        source = document.createElement('source');
        video.appendChild(source);
    } else if (source.src !== '') {
        URL.revokeObjectURL(source.src);
    }
    source.src = URL.createObjectURL(file);
    video.load();
    video.parentElement.classList.remove('hide');
    canvasWrite.parentElement.classList.add('hide');
    seek.value = 0;
    lastDisplayedFrame = -1;
};

let seeking = false;
seek.onchange = (e) => {
    seeking = false;
    frames = [];
    video.requestVideoFrameCallback(frameCb);
    video.play();
};
let seekRequested = false;
seek.oninput = (e) => {
    if (!seeking) {
        video.pause();
        video.parentElement.classList.remove('hide');
        canvasWrite.parentElement.classList.add('hide');
        seeking = true;
    }
    if (seekRequested) return;
    seekRequested = true;
    requestAnimationFrame(() => {
        video.currentTime = video.duration * (seek.valueAsNumber / 100);
        seekRequested = false;
    });
};

function frameCb(now, metadata) {
    if (frames.length >= maxFrames) {
        video.pause();
        lastDisplayedFrame = 0;
        let bb = video.getBoundingClientRect();
        canvasWrite.parentElement.classList.remove('hide');
        canvasWrite.width = bb.width;
        canvasWrite.height = bb.height;
        ctxWrite.putImageData(frames[frames.length - 1].frame, 0, 0);
        video.parentElement.classList.add('hide');
        return;
    }
    let {mediaTime} = metadata;
    let bb = video.getBoundingClientRect();
    let width = bb.width;
    let height = bb.height;
    canvasRead.width = width;
    canvasRead.height = height;

    ctxRead.drawImage(video, 0, 0, width, height);
    let frame = ctxRead.getImageData(0, 0, width, height);
    frames.push({mediaTime, frame});
    video.requestVideoFrameCallback(frameCb);
}

fileInput.onchange(null);
