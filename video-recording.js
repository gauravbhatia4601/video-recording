const startRecording = document.querySelector('.start-recording-btn');
const stopRecording = document.querySelector('.stop-recording-btn');
const saveRecording = document.querySelector('.save-recording-btn');
var recordingPlayer = document.querySelector('.video-display');
// First, define the video constraints
const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: 'user',
    // This is the key part to fix the inversion
    advanced: [{ facingMode: { exact: 'user' } }]
};
(function () {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }

    var match, search = window.location.search;
    while (match = r.exec(search.substring(1))) {
        params[d(match[1])] = d(match[2]);

        if (d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }
    }

    window.params = params;

    captureUserMedia({ video: videoConstraints, audio: true }, function (audioVideoStream) {
        recordingPlayer.srcObject = audioVideoStream;
    }, function (error) {
        alert(error);
        return false;
    });
})();



var count = 0;
var button;
//event listener for start recording
startRecording.addEventListener('click', async function () {
    button = this;
    recordingPlayer.muted = 1;
    recordingPlayer.controls = false;

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
            }

        },
        onMediaCapturingFailed: function (error) {
            if (error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
                alert(error);
            }

            commonConfig.onMediaStopped();
        }
    };

    await captureAudioPlusVideo(commonConfig);

    button.mediaCapturedCallback = function () {
        button.recordRTC = RecordRTC(button.stream, {
            type: 'video',
            disableLogs: params.disableLogs || false,
            mimeType: 'video/webm;codecs=vp9,opus',
            canvas: {
                width: params.canvas_width || 320,
                height: params.canvas_height || 240
            },
            frameInterval: typeof params.frameInterval !== 'undefined' ? parseInt(params.frameInterval) : 20 // minimum time between pushing frames to Whammy (in milliseconds)
        });


        button.recordingEndedCallback = function (url) {
            recordingPlayer.controls = true;
            recordingPlayer.src = null;
            recordingPlayer.srcObject = null;
            //recordingPlayer.remove();
            appendMediaElement(button.recordRTC.blob)
        };
        //start recording function
        button.recordRTC.startRecording();
    };

});

async function appendMediaElement(blob) {
    await openModal((clipName) => {
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
        mediaElement.src = URL.createObjectURL(blob);

        clipContainer.appendChild(clipHeader);
        clipContainer.appendChild(mediaElement);

        mainContainer.appendChild(clipContainer);

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
stopRecording.addEventListener('click', function () {
    //change stop recording button
    this.disabled = true;
    this.classList.add('hidden', 'cursor-not-allowed');

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
});

function captureAudioPlusVideo(config) {
    captureUserMedia({ video: videoConstraints, audio: true }, function (audioVideoStream) {
        recordingPlayer.srcObject = audioVideoStream;

        config.onMediaCaptured(audioVideoStream);

        audioVideoStream.onended = function () {
            config.onMediaStopped();
        };
    }, function (error) {
        config.onMediaCapturingFailed(error);
    });
}

function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
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
