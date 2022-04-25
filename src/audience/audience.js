/*
A Few Deep Breaths
CultureHub & LaMaMa ETC, May 2022










*/

const { io } = require("socket.io-client");
import { Lobby } from "./lobby";

let url = "localhost:5000";
let socket;
let mediasoupPeer;
let currentScene = 0;
let localCam;

let peers = {};
window.peers = peers;

window.onload = () => {
    console.log("~~~~~~~~~~~~~~~~~");
    socket = io(url, {
        path: "/socket.io"
    });

    socket.on("clients", (ids) => {
        console.log("Got initial clients!");
        for (const id of ids) {
            if (!(id in peers)) {
                console.log("Client conencted: ", id);
                peers[id] = {};
                mediasoupPeer.connectToPeer(id);
            }
        }
    });

    socket.on("clientConnected", (id) => {
        console.log("Client conencted: ", id);
        peers[id] = {};
        mediasoupPeer.connectToPeer(id);
    });

    socket.on("clientDisconnected", (id) => {
        console.log("Client disconencted:", id);
        delete peers[id];
    });

    socket.on('positions')

    mediasoupPeer = new SimpleMediasoupPeer(socket);
    mediasoupPeer.on('track', gotTrack);
}

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    getDevices();
    startButton.disabled = true;
}, false);


let lobby = new Lobby();

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

function gotTrack(track, id, label) {
    console.log(`Got track of kind ${label} from ${id}`);



    let el = document.getElementById(id + '_' + label);
    if (track.kind === 'video') {
        if (el == null) {
            console.log('Creating video element for client with ID: ' + id);
            el = document.createElement('video');
            el.style.position = "absolute";
            el.style.width = "200px";
            el.style.borderRadius = "100px";
            el.id = id + '_' + label;
            el.autoplay = true;
            el.muted = true;
            // el.style = 'visibility: hidden;';
            el.setAttribute('playsinline', true);
            document.body.appendChild(el);
            peers[id].videoEl = el;
        }

        // TODO only update tracks if the track is different
        // console.log('Updating video source for client with ID: ' + id);
        el.srcObject = null;
        el.srcObject = new MediaStream([track]);

        el.onloadedmetadata = (e) => {
            el.play().catch((e) => {
                console.log('Play video error: ' + e);
            });
        };
    }
    if (track.kind === 'audio') {
        if (el == null) {
            console.log('Creating audio element for client with ID: ' + id);
            el = document.createElement('audio');
            el.id = id + '_' + label;
            document.body.appendChild(el);
            el.setAttribute('playsinline', true);
            el.setAttribute('autoplay', true);
            peers[id].audioEl = el;
        }

        // console.log('Updating <audio> source object for client with ID: ' + id);
        el.srcObject = null;
        el.srcObject = new MediaStream([track]);
        el.volume = 0;

        el.onloadedmetadata = (e) => {
            el.play().catch((e) => {
                console.log('Play audio error: ' + e);
            });
        };
    }
}



//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// user media

const videoElement = document.getElementById('localVideo');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoInputSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoInputSelect];

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

audioInputSelect.addEventListener('change', startStream);
videoInputSelect.addEventListener('change', startStream);
audioOutputSelect.addEventListener('change', changeAudioDestination);

async function getDevices() {
    let devicesInfo = await navigator.mediaDevices.enumerateDevices();
    gotDevices(devicesInfo);
    await startStream();
}

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map((select) => select.value);
    selectors.forEach((select) => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoInputSelect.length + 1}`;
            videoInputSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}

function gotStream(stream) {
    localCam = stream; // make stream available to console

    if ('srcObject' in videoElement) {
        videoElement.srcObject = stream;
    } else {
        videoElement.src = window.URL.createObjectURL(stream);
    }

    const videoTrack = localCam.getVideoTracks()[0];
    const audioTrack = localCam.getAudioTracks()[0];
    mediasoupPeer.addTrack(videoTrack, 'video');
    mediasoupPeer.addTrack(audioTrack, 'audio');

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element
            .setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch((error) => {
                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}

function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value;
    attachSinkId(videoElement, audioDestination);
}

async function startStream() {
    console.log('getting local stream');
    if (localCam) {
        localCam.getTracks().forEach((track) => {
            track.stop();
        });
    }

    const audioSource = audioInputSelect.value;
    const videoSource = videoInputSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined, width: { ideal: 320 }, height: { ideal: 240 } },
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

// function getCamPausedState() {
//     return webcamVideoPaused;
// }

// function getMicPausedState() {
//     return webcamAudioPaused;
// }

// function getScreenPausedState() {
//     return screenShareVideoPaused;
// }

// function getScreenAudioPausedState() {
//     return screenShareAudioPaused;
// }

// async function toggleWebcamVideoPauseState() {
//     if (!localCam) return;
//     if (getCamPausedState()) {
//         // resumeProducer(camVideoProducer);
//         localCam.getVideoTracks()[0].enabled = true;
//     } else {
//         // pauseProducer(camVideoProducer);
//         localCam.getVideoTracks()[0].enabled = false;
//     }
//     webcamVideoPaused = !webcamVideoPaused;
//     toggleWebcamImage();
// }

// async function toggleWebcamAudioPauseState() {
//     if (!localCam) return;
//     if (getMicPausedState()) {
//         // resumeProducer(camAudioProducer);
//         localCam.getAudioTracks()[0].enabled = true;
//     } else {
//         // pauseProducer(camAudioProducer);
//         localCam.getAudioTracks()[0].enabled = false;
//     }
//     webcamAudioPaused = !webcamAudioPaused;
//     toggleMicrophoneImage();
// }