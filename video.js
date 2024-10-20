import { App } from './app.js'
import { Canvas } from './canvas.js'
import { MediaStreamRecorder } from './MediaStreamRecorder.js';
import { RecorderType } from './RecorderType.js';
import { Utility } from './Utility.js';

export class VideoRecorder {
    stream = null

    constructor() {
        this.initializeVariables()
        this.canvas = new Canvas(this.recordingPlayer);
        this.recorderType = new RecorderType()
        this.init()
    }

    initializeVariables() {
        this.startRecording = document.querySelector('#start-recording-btn');
        this.stopRecording = document.querySelector('#stop-recording-btn');
        this.saveRecording = document.querySelector('.save-recording-btn');
        this.recordingPlayer = document.createElement('video');
        this.recordingPlayer.addEventListener('play', this.startCanvasDrawing.bind(this));
        this.recordingPlayer.addEventListener('stop', this.stopCanvasDrawing.bind(this));
        this.videoConstraints = {
            video: {
                width: 1280,
                height: 720,
                facingMode: 'user'
            },
            audio: true
        }

    }

    async init() {
        try {
            // Capture user media
            const stream = await this.captureUserMedia();

            // Set the stream to both the recording player and the class property`
            this.stream = stream;

            // Configure recording player attributes for immediate playback
            await this.setupRecordingPlayer(stream)

            // Wait for canvas to be ready with proper sizing
            await this.canvas.setCanvasSize();

            // // Capture stream from canvas and update the stream
            const canvasStream = await this.canvas.captureCanvasStream(this.stream);
            this.stream = canvasStream;

            // Use requestAnimationFrame for smoother updates instead of requestVideoFrameCallback
            // which might not be supported everywhere or might be deprecated in future
            // this.startCanvasDrawing();

        } catch (e) {
            this.handleError(e)
        }
    }

    startCanvasDrawing() {
        this.canvas.isDrawing = true;
        this.canvas.draw();
    }

    stopCanvasDrawing() {
        this.canvas.isDrawing = false;
    }

    captureUserMedia() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(this.videoConstraints)
                .then(async stream => {
                    resolve(stream);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    // startCanvasDrawing() {
    //     const draw = () => {
    //         this.canvas.drawCanvas();
    //         this.recordingPlayer.requestVideoFrameCallback(draw);
    //     };
    //     this.recordingPlayer.requestVideoFrameCallback(draw);
    // }

    handleError(error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access the camera or microphone. Please check permissions.');
    }

    setupRecordingPlayer(stream) {
        this.recordingPlayer.srcObject = stream;
        this.recordingPlayer.volume = 1;
        this.recordingPlayer.muted = true;
        this.recordingPlayer.playsinline = true;
        this.recordingPlayer.autoplay = true;
        return this.recordingPlayer.play();
    }

    clearVideoSource() {
        // Set the srcObject to null and stop all tracks in stream
        this.recordingPlayer.srcObject.getTracks().forEach(track => track.stop());
        this.recordingPlayer.srcObject = null;
    }

    //event listener for start recording
    async startVideoRecording(event) {

        if (!this.mediaRecorder) {
            this.setupMediaRecord()
        } else {
            this.mediaRecorder.clearRecordedData()
            // this.mediaRecorder.record()
        }

        console.log(this.mediaRecorder)

        //start recording
        this.mediaRecorder.record();
    }

    async setupMediaRecord() {

        this.recorder = MediaStreamRecorder; //await this.recorderType.getRecorderType(this.stream, this.config) || MediaStreamRecorder;

        this.config = {
            type: 'video',
            disableLogs: false,
            mimeType: 'video/webm;codecs=vp9,opus',
            canvas: {
                width: 1280,
                height: 720
            },
            frameInterval: 20
        };

        // button.mediaCapturedCallback = function () {
        this.mediaRecorder = new this.recorder(this.stream, this.config)
    }

    stopVideoRecording() {
        if (!this.mediaRecorder || !this.stream) {
            return;
        }

        this.mediaRecorder.stop(
            (recordedBlob) => {
                console.log(recordedBlob)
                if (!recordedBlob) {
                    throw 'recording failed';
                }

                this.stream = null;

                if (!this.config.disableLogs) {
                    console.log('Stopped recording ' + this.config.type + ' stream.');
                }

                if (!this.config.disableLogs) {
                    console.log(recordedBlob.type, '->', Utility.bytesToSize(recordedBlob.size));
                }

                this.handleStopRecording(recordedBlob)
            })
    }

    handleStopRecording(blob) {
        this.recordingPlayer.src = null;
        this.recordingPlayer.srcObject = null;
        this.appendMediaElement(blob)
    }

    appendMediaElement(blob) {
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
}