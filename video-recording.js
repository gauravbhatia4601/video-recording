import { App } from './app.js'

const startRecording = document.querySelector('#start-recording-btn');
const stopRecording = document.querySelector('#stop-recording-btn');
const saveRecording = document.querySelector('.save-recording-btn');
var recordingPlayer = document.createElement('video');
const canvas = document.querySelector('#video-canvas');
const ctx = canvas.getContext('2d');
let audioContext, audioSource, audioDestination;

var button;
var videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user',
    mirror: false,
    advanced: [{ facingMode: { exact: 'user' } }]
}

class videoRecorder {

    stream = null

    constructor() {
        this.init()
    }

    init() {
        // this.recordingPlayer = document.querySelector('.video-display')
        captureUserMedia({ video: videoConstraints, audio: true })
            .then(stream => {
                this.stream = stream;
                captureCanvasStream(stream)
                    .then(() => {
                        recordingPlayer.requestVideoFrameCallback(draw)
                    })
            })
            .catch(error => {
                console.error('Error accessing media devices:', error);
                alert('Could not access the camera or microphone. Please check permissions.');
            });
    }
}


function setCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = recordingPlayer.videoWidth * dpr;
    canvas.height = recordingPlayer.videoHeight * dpr;
    ctx.imageSmoothingEnabled = false;
}

function captureCanvasStream(stream) {
    setCanvasSize()
    return new Promise((resolve, reject) => {
        recordingPlayer.srcObject = stream;
        recordingPlayer.volume = true;
        recordingPlayer.muted = true;
        recordingPlayer.playsinline = true;
        recordingPlayer.autoplay = true;
        recordingPlayer.play()

        // Set up audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioSource = audioContext.createMediaStreamSource(stream);
        audioDestination = audioContext.createMediaStreamDestination();
        audioSource.connect(audioDestination);

        // Combine video and audio
        const canvasStream = canvas.captureStream(30);
        const tracks = [...canvasStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()];

        const combinedStream = new MediaStream(tracks);

        resolve(combinedStream);
    })
}

function draw() {
    console.log('drawing canvas')
    // Ensure the canvas size is correct
    if (canvas.width !== recordingPlayer.videoWidth || canvas.height !== recordingPlayer.videoHeight) {
        setCanvasSize();
    }
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(recordingPlayer, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
    recordingPlayer.requestVideoFrameCallback(draw)
}

var commonConfig = {
    onMediaCaptured: function (stream) {
        button.stream = stream;

        if (button.mediaCapturedCallback) {
            button.mediaCapturedCallback();
        }

        button.disabled = true;
        button.classList.add('hidden', 'cursor-not-allowed');

        stopRecording.disabled = false;
        stopRecording.classList.remove('hidden', 'cursor-not-allowed');
    },
    onMediaStopped: function () {
        if (!button.disableStateWaiting) {
            button.disabled = false;
            button.classList.remove('hidden', 'cursor-not-allowed');
            stopRecording.disabled = true;
            stopRecording.classList.add('hidden', 'cursor-not-allowed');
            button.stream = null
        }
    },
    onMediaCapturingFailed: function (error) {
        if (error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
            alert(error);
        }
        console.log(error)
        commonConfig.onMediaStopped();
    }
};

//event listener for start recording
async function startVideoRecording(event) {
    button = event.target;
    recordingPlayer.muted = 1;

    captureAudioPlusVideo(commonConfig);

    button.mediaCapturedCallback = function () {
        button.recordRTC = RecordRTC(button.stream, {
            type: 'video',
            disableLogs: false,
            mimeType: 'video/webm;codecs=vp9,opus',
            canvas: {
                width: 320,
                height: 240
            },
            frameInterval: 20 // minimum time between pushing frames to Whammy (in milliseconds)
        });


        button.recordingEndedCallback = function (url) {
            recordingPlayer.src = null;
            recordingPlayer.srcObject = null;
            appendMediaElement(button.recordRTC.blob)
        };
        //start recording function
        button.recordRTC.startRecording();
    };
}

function appendMediaElement(blob) {
    App.openModal()
        .then((clipName) => {
            const mainContainer = document.querySelector("#main-container");

            const clipContainer = document.createElement("div");
            clipContainer.className = "bg-white rounded-lg shadow-md p-4 mb-4 transition-all hover:shadow-lg";

            const clipHeader = document.createElement("div");
            clipHeader.className = "flex justify-between items-center mb-2";

            const clipLabel = document.createElement("h3");
            clipLabel.className = "text-lg font-semibold text-gray-800";
            clipLabel.textContent = clipName;

            const deleteButton = document.createElement("button");
            deleteButton.className = "text-red-500 hover:text-red-700 focus:outline-none transition-colors";
            deleteButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        `;

            clipHeader.appendChild(clipLabel);
            clipHeader.appendChild(deleteButton);

            const mediaElement = document.createElement("video");
            mediaElement.className = "w-full mt-2";
            mediaElement.setAttribute("controls", "");
            mediaElement.playsinline = 1;
            mediaElement.autoplay = 1;
            mediaElement.muted = 1;
            mediaElement.volume = 1;
            mediaElement.src = URL.createObjectURL(blob);

            clipContainer.appendChild(clipHeader);
            clipContainer.appendChild(mediaElement);

            mainContainer.prepend(clipContainer);

            deleteButton.onclick = async (e) => {
                const clipToRemove = e.target.closest('.bg-white');
                clipToRemove.classList.add('scale-95', 'opacity-0');
                setTimeout(async () => {
                    mainContainer.removeChild(clipToRemove);
                    // Remove from IndexedDB (assuming we've stored the ID somehow)
                    // await mediaStorage.deleteMedia(id);
                }, 300);
            };
        });
}

//stop recording listener
// stopRecording.addEventListener('click', 
function stopVideoRecording(event) {
    //change stop recording button
    event.target.disabled = true;
    event.target.classList.add('hidden', 'cursor-not-allowed');

    //change start recording button
    startRecording.disabled = false;
    startRecording.classList.remove('hidden', 'cursor-not-allowed');
    function stopStream() {
        if (button.stream && button.stream.stop) {
            button.stream.stop();
            button.stream = null;
        }
    }

    if (button.recordRTC) {
        if (button.recordRTC.length) {
            button.recordRTC[0].stopRecording(function (url) {
                if (!button.recordRTC[1]) {
                    button.recordingEndedCallback(url);
                    stopStream();
                    saveVideo(button.recordRTC);
                    return;
                }

                button.recordRTC[1].stopRecording(function (url) {
                    button.recordingEndedCallback(url);
                    stopStream();
                });
            });
        }
        else {
            button.recordRTC.stopRecording(function (url) {
                button.recordingEndedCallback(url);
                stopStream();
                saveVideo(button.recordRTC);
            });
        }
    }
}

function captureAudioPlusVideo(config) {
    captureUserMedia({ video: videoConstraints, audio: true })
        .then(stream => {
            captureCanvasStream(stream)
                .then((stream) => {
                    config.onMediaCaptured(stream);
                    stream.onended = function () {
                        config.onMediaStopped();
                    };
                })

        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
            config.onMediaCapturingFailed(error);
        });
}

function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then(async stream => {
                resolve(stream);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function saveVideo(recordRTC) {
    saveRecording.addEventListener('click', function (e) {
        this.disabled = true;
        startRecording.disabled = true;
        startRecording.addClass('text-grey-600', 'bg-grey')
        startRecording.remove();
        stopRecording.disabled = true;
        jQuery('.progress').removeClass('d-none');
        uploadToServer(recordRTC, function (progress, fileURL) {
            if (progress === 'ended') {
                return;
            }
        });
    });
}

function uploadToServer(recordRTC, callback) {
    var blob = recordRTC instanceof Blob ? recordRTC : recordRTC.blob;
    var fileType = blob.type.split('/')[0] || 'video';
    var fileName = (Math.random() * 1000).toString().replace('.', '');
    fileName += '.webm';
    // create FormData
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append(fileType + '-blob', blob);

    callback('Uploading ' + fileType + ' recording to server.');
    var upload_url = 'save.php';
    makeXMLHttpRequest(upload_url, formData, function (progress) {
        if (progress !== 'upload-ended') {
            callback(progress);
            return;
        }

        // callback('ended', upload_directory + fileName); 
    });
}

function makeXMLHttpRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function (result) {
        if (request.readyState == 4 && request.status == 200) {
            let response = JSON.parse(this.responseText);
            if (response.status == 'OK') {
                jQuery('.upload-status').text(response.message);
            } else if (response.hasOwnProperty('error')) {
                jQuery('.upload-status').text(response.error);
            }
            callback('upload-ended');
        }
    };

    request.upload.onloadstart = function () {
        callback('Upload started...');
    };

    request.upload.onprogress = function (event) {
        jQuery('.progress-bar').css("width", Math.round(event.loaded / event.total * 100) + "%");
        jQuery('.upload-status').text(Math.round(event.loaded / event.total * 100) + "%");
        jQuery('.progress-bar').attr("aria-valuenow", Math.round(event.loaded / event.total * 100));
    };

    request.upload.onload = function () {
        callback('progress-about-to-end');
    };

    request.upload.onload = function () {
        callback('progress-ended');
    };

    request.upload.onerror = function (error) {
        callback('Failed to upload to server');
        console.error('XMLHttpRequest failed', error);
    };

    request.upload.onabort = function (error) {
        callback('Upload aborted.');
        console.error('XMLHttpRequest aborted', error);
    };

    request.open('POST', url, true);
    request.send(data);
}

export { videoRecorder, startVideoRecording, stopVideoRecording, recordingPlayer }