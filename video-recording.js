const startRecording = document.querySelector('.start-recording-btn');
const stopRecording = document.querySelector('.stop-recording-btn');
const saveRecording = document.querySelector('.save-recording-btn');
var recordingPlayer = document.querySelector('.video-display');

//get userMedia on opening of modal
jQuery('#video-record-modal').on('show.bs.modal',function(){
    captureUserMedia({video: true, audio: true}, function(audioVideoStream) {
        recordingPlayer.srcObject = audioVideoStream;        
    }, function(error) {
        alert(error);
        return false;
    });
});


(function() {
    var params = {},
        r = /([^&=]+)=?([^&]*)/g;

    function d(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '));
    }

    var match, search = window.location.search;
    while (match = r.exec(search.substring(1))) {
        params[d(match[1])] = d(match[2]);

        if(d(match[2]) === 'true' || d(match[2]) === 'false') {
            params[d(match[1])] = d(match[2]) === 'true' ? true : false;
        }
    }

    window.params = params;
})();



var count = 0;
var button;
//event listener for start recording
startRecording.addEventListener('click',async function(){
    button = this;
    recordingPlayer.muted = 1;
    recordingPlayer.controls = false;

    var commonConfig = {
        onMediaCaptured: function(stream) {
            button.stream = stream;
            if(button.mediaCapturedCallback) {
                button.mediaCapturedCallback();
            }
            button.disabled = true;
            stopRecording.disabled = false;
            saveRecording.disabled = true;
        },
        onMediaStopped: function() {   
            if(!button.disableStateWaiting) {
                button.disabled = false;
            }
        },
        onMediaCapturingFailed: function(error) {
            if(error.name === 'PermissionDeniedError' && !!navigator.mozGetUserMedia) {
                alert(error);
            }
    
            commonConfig.onMediaStopped();
        }
    };



    await captureAudioPlusVideo(commonConfig);


    button.mediaCapturedCallback = function() {
        button.recordRTC = RecordRTC(button.stream, {
            type: 'video',
            disableLogs: params.disableLogs || false,
            canvas: {
                width: params.canvas_width || 320,
                height: params.canvas_height || 240
            },
            frameInterval: typeof params.frameInterval !== 'undefined' ? parseInt(params.frameInterval) : 20 // minimum time between pushing frames to Whammy (in milliseconds)
        });
        
        
        button.recordingEndedCallback = function(url) {
            recordingPlayer.controls = true;
            recordingPlayer.src = null;
            recordingPlayer.srcObject = null;
            recordingPlayer.remove();
            let videoElement = document.createElement('video');
            videoElement.setAttribute("class","video-display");
            videoElement.autoplay = true;
            videoElement.controls = true;
            videoElement.volume = 1;
            videoElement.playsInline = true;
            videoElement.muted = 1;
            videoElement.style.width = '100%';
            document.querySelector('.modal-body').append(videoElement);
            recordingPlayer = videoElement;
            recordingPlayer.src = url;
            recordingPlayer.onended = function() {
                recordingPlayer.pause();
                recordingPlayer.src = URL.createObjectURL(button.recordRTC.blob);
            };
        };
        //start recording function
        button.recordRTC.startRecording();
    };

});

//stop recording listener
stopRecording.addEventListener('click',function(){
    this.disabled = true;
    startRecording.disabled = false;
    saveRecording.disabled = false;
    function stopStream() {
        if(button.stream && button.stream.stop) {
            button.stream.stop();
            button.stream = null;
        }
    }

    if(button.recordRTC) {
        if(button.recordRTC.length) {
            button.recordRTC[0].stopRecording(function(url) {
                if(!button.recordRTC[1]) {
                    button.recordingEndedCallback(url);
                    stopStream();
                    saveVideo(button.recordRTC);
                    return;
                }

                button.recordRTC[1].stopRecording(function(url) {
                    button.recordingEndedCallback(url);
                    stopStream();
                });
            });
        }
        else {
            button.recordRTC.stopRecording(function(url) {
                button.recordingEndedCallback(url);
                stopStream();
                saveVideo(button.recordRTC);
            });
        }
    }
});

function captureAudioPlusVideo(config) {
    captureUserMedia({video: true, audio: true}, function(audioVideoStream) {
        recordingPlayer.srcObject = audioVideoStream;

        config.onMediaCaptured(audioVideoStream);

        audioVideoStream.onended = function() {
            config.onMediaStopped();
        };
    }, function(error) {
        config.onMediaCapturingFailed(error);
    });
}

function captureUserMedia(mediaConstraints, successCallback, errorCallback) {
    navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback).catch(errorCallback);
}



function saveVideo(recordRTC){
    saveRecording.addEventListener('click',function(e){
        this.disabled = true;
        startRecording.disabled = true;
        stopRecording.disabled = true;
        jQuery('.progress').removeClass('d-none');
        uploadToServer(recordRTC, function(progress, fileURL) {
            if(progress === 'ended') {
                    
                return;
            }
        });
    });
}

function uploadToServer(recordRTC,callback){
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
    makeXMLHttpRequest(upload_url, formData, function(progress) {
        if (progress !== 'upload-ended') {
            callback(progress);
            return;
        }

        // callback('ended', upload_directory + fileName); 
    });
}

function makeXMLHttpRequest(url, data, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function(result) {
        if (request.readyState == 4 && request.status == 200) {
            let response = JSON.parse(this.responseText);
            if(response.status == 'OK'){
                jQuery('.upload-status').text(response.message);
            }else if(response.hasOwnProperty('error')){
                jQuery('.upload-status').text(response.error);
            }
            callback('upload-ended');
        }
    };

    request.upload.onloadstart = function() {
        callback('Upload started...');
    };

    request.upload.onprogress = function(event) {
        jQuery('.progress-bar').css("width",Math.round(event.loaded / event.total * 100) + "%");
        jQuery('.upload-status').text(Math.round(event.loaded / event.total * 100) + "%");
        jQuery('.progress-bar').attr("aria-valuenow",Math.round(event.loaded / event.total * 100));
    };

    request.upload.onload = function() {
        callback('progress-about-to-end');
    };

    request.upload.onload = function() {
        callback('progress-ended');
    };

    request.upload.onerror = function(error) {
        callback('Failed to upload to server');
        console.error('XMLHttpRequest failed', error);
    };

    request.upload.onabort = function(error) {
        callback('Upload aborted.');
        console.error('XMLHttpRequest aborted', error);
    };

    request.open('POST', url, true);
    request.send(data);
}
