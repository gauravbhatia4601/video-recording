import { App } from './app.js'
import { Canvas } from './canvas.js'
import { MediaStreamRecorder } from './MediaStreamRecorder.js';
// import { RecorderType } from './RecorderType.js';
import { Utility } from './Utility.js';

export class VideoRecorder {

    /*
    |--------------------------------------------------------------------------
    | Media Stream
    |--------------------------------------------------------------------------
    |
    | This property holds the media stream for recording video and audio.
    |
    */
    stream = null;

    /*
    |--------------------------------------------------------------------------
    | Supported MIME Types
    |--------------------------------------------------------------------------
    |
    | This array contains the MIME types supported for media recording.
    |
    */
    mediaRecorderMimeTypes = [
        'video/webm',
        'video/webm;codecs=vp8',
        'video/webm;codecs=daala',
        'video/webm;codecs=h264',
        'video/mpeg',
        'video/mp4',
        'video/mp4;codecs=h264,aac',
    ];

    /*
    |--------------------------------------------------------------------------
    | Input Video Device
    |--------------------------------------------------------------------------
    |
    | This property holds the reference to the input video device element.
    |
    */
    inputVideoDevice = document.getElementById('inputVideoDevice');

    /*
    |--------------------------------------------------------------------------
    | Input Audio Device
    |--------------------------------------------------------------------------
    |
    | This property holds the reference to the input audio device element.
    |
    */
    inputAudioDevice = document.getElementById('inputAudioDevice');

    /*
    |--------------------------------------------------------------------------
    | Recording Player
    |--------------------------------------------------------------------------
    |
    | This property creates a video element for playback of the recorded media.
    |
    */
    recordingPlayer = document.createElement('video');

    /*
    |--------------------------------------------------------------------------
    | Video Constraints
    |--------------------------------------------------------------------------
    |
    | This object defines the constraints for video and audio capture.
    |
    */
    videoConstraints = {
        video: {
            width: 1280,
            height: 720,
            facingMode: 'user',
            deviceId: { exact: this.inputVideoDevice.value || null }
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            deviceId: { exact: this.inputAudioDevice.value || null }
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Supported MIME Type
    |--------------------------------------------------------------------------
    |
    | This property holds the filtered list of supported MIME types based on
    | the browser's capabilities.
    |
    */
    supportedMimeType = this.mediaRecorderMimeTypes.filter((type) => { return MediaRecorder.isTypeSupported(type) });

    /*
    |--------------------------------------------------------------------------
    | Recorder
    |--------------------------------------------------------------------------
    |
    | This property holds the instance of the MediaStreamRecorder used for
    | recording the media stream.
    |
    */
    recorder = MediaStreamRecorder;

    /*
    |--------------------------------------------------------------------------
    | Configuration
    |--------------------------------------------------------------------------
    |
    | This object contains the configuration settings for the media recorder,
    | including type, logging options, MIME type, canvas dimensions, and frame
    | interval.
    |
    */
    config = {
        type: 'video',
        disableLogs: false,
        mimeType: '', // Will be set based on browser
        canvas: {
            width: 1280,
            height: 720
        },
        frameInterval: 20
    };

    /*
    |--------------------------------------------------------------------------
    | Media Recorder Instance
    |--------------------------------------------------------------------------
    |
    | This property holds the instance of the media recorder created with the
    | specified configuration.
    |
    */
    mediaRecorder = null;

    /*
    |--------------------------------------------------------------------------
    | Canvas Instance
    |--------------------------------------------------------------------------
    |
    | This property holds the instance of the Canvas class used for drawing
    | the video stream.
    |
    */
    canvas = new Canvas(this.recordingPlayer);

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    |
    | This constructor initializes the VideoRecorder instance with the provided
    | media stream and sets up necessary event listeners and configurations.
    |
    */
    constructor(stream) {
        try {
            this.stream = stream;
            this.initializeVariables();
            this.canvas = new Canvas(this.recordingPlayer);
            // this.recorderType = new RecorderType();

            if (this.supportedMimeType.length === 0) {
                alert('Mime type not supported!!');
                return;
            }

            this.init()
                .catch(e => {
                    console.error(e)
                    alert('Failed to capture media: ' + e.message);
                });
        } catch (e) {
            console.error(e);
            alert('Failed to capture media: ' + e.message);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize Variables
    |--------------------------------------------------------------------------
    |
    | This method sets up event listeners for the recording player to handle
    | play and stop events for canvas drawing.
    |
    */
    initializeVariables() {
        this.recordingPlayer.addEventListener('play', this.startCanvasDrawing.bind(this));
        this.recordingPlayer.addEventListener('stop', this.stopCanvasDrawing.bind(this));
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize Media Recording
    |--------------------------------------------------------------------------
    |
    | This asynchronous method initializes the media recording process by
    | capturing user media, setting up the recording player, and preparing
    | the canvas for drawing.
    |
    */
    async init(mediaStream = null) {
        try {
            // Capture user media
            console.log('captureUserMedia before')
            const stream = mediaStream || await this.captureUserMedia();
            console.log('captureUserMedia')
            // Set the stream to both the recording player and the class property
            this.stream = stream;

            console.log('setupRecordingPlayer before')
            // Configure recording player attributes for immediate playback
            await this.setupRecordingPlayer(stream);

            console.log('setupRecordingPlayer')

            // Wait for canvas to be ready with proper sizing
            await this.canvas.setCanvasSize();

            console.log('setCanvasSize')

            // Capture stream from canvas and update the stream
            const canvasStream = await this.canvas.captureCanvasStream(this.stream);
            console.log('captureCanvasStream')
            this.stream = canvasStream;
        } catch (e) {
            this.handleError(e)
            alert('Failed to capture media: ' + e.message);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Start Canvas Drawing
    |--------------------------------------------------------------------------
    |
    | This method starts the canvas drawing process by setting the drawing
    | flag to true and invoking the draw method on the canvas instance.
    |
    */
    startCanvasDrawing() {
        this.canvas.isDrawing = true;
        this.canvas.draw();
    }

    /*
    |--------------------------------------------------------------------------
    | Stop Canvas Drawing
    |--------------------------------------------------------------------------
    |
    | This method stops the canvas drawing process by setting the drawing
    | flag to false.
    |
    */
    stopCanvasDrawing() {
        this.canvas.isDrawing = false;
    }

    /*
    |--------------------------------------------------------------------------
    | Capture User Media
    |--------------------------------------------------------------------------
    |
    | This asynchronous method requests access to the user's media devices
    | and returns a promise that resolves with the media stream.
    |
    */
    async captureUserMedia() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(this.videoConstraints)
                .then(async stream => {
                    resolve(stream);
                })
                .catch(error => {
                    reject(error); // Handle the error here
                });
        }).catch((reason) => {
            console.error(reason);
            // Handle the error appropriately, e.g., alert the user
            alert('Failed to capture media: ' + reason.message);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Error
    |--------------------------------------------------------------------------
    |
    | This method handles errors related to accessing media devices and
    | alerts the user about permission issues.
    |
    */
    handleError(error) {
        console.error('Error accessing media devices:', error);
        alert('Could not access the camera or microphone. Please check permissions.');
    }

    /*
    |--------------------------------------------------------------------------
    | Setup Recording Player
    |--------------------------------------------------------------------------
    |
    | This asynchronous method configures the recording player with the
    | provided media stream and attempts to start playback.
    |
    */
    async setupRecordingPlayer(stream) {
        this.recordingPlayer.srcObject = stream;
        this.recordingPlayer.volume = 1;
        this.recordingPlayer.muted = true;
        this.recordingPlayer.playsinline = true;
        this.recordingPlayer.autoplay = false;
        try {
            await this.recordingPlayer.play();
            console.log('Media playback started successfully');
        } catch (error) {
            console.error('Error playing the recording player:', error);
            alert('Failed to capture media: ' + error.message);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Clear Video Source
    |--------------------------------------------------------------------------
    |
    | This method clears the video source of the recording player and stops
    | all tracks in the media stream.
    |
    */
    clearVideoSource() {
        // Set the srcObject to null and stop all tracks in stream
        this.recordingPlayer.srcObject.getTracks().forEach(track => track.stop());
        this.recordingPlayer.srcObject = null;
    }

    /*
    |--------------------------------------------------------------------------
    | Setup Media Record
    |--------------------------------------------------------------------------
    |
    | This asynchronous method configures the media recorder instance based
    | on the detected browser and initializes the recording configuration.
    |
    */
    async setupMediaRecord() {
        const utility = new Utility(); // Create an instance of Utility to check the browser

        // Set the MIME type based on the detected browser
        let mimeType;
        if (utility.isChrome || utility.isBrave) {
            mimeType = 'video/webm; codecs=vp9,opus'; // Chrome and Brave support VP9
        } else if (utility.isFirefox) {
            mimeType = 'video/webm; codecs=vp8,opus'; // Firefox supports VP8
        } else if (utility.isSafari) {
            mimeType = 'video/mp4'; // Safari supports H.264
        } else if (utility.isEdge) {
            mimeType = 'video/webm; codecs=vp9,opus'; // Edge supports VP9
        } else {
            mimeType = 'video/webm'; // Default fallback
        }

        this.recorder = MediaStreamRecorder; //await this.recorderType.getRecorderType(this.stream, this.config) || MediaStreamRecorder;

        this.config = {
            type: 'video',
            disableLogs: false,
            mimeType: mimeType,
            canvas: {
                width: 1280,
                height: 720
            },
            frameInterval: 20
        };

        // button.mediaCapturedCallback = function () {
        this.mediaRecorder = new this.recorder(this.stream, this.config)
    }

    /*
    |--------------------------------------------------------------------------
    | Start Video Recording
    |--------------------------------------------------------------------------
    |
    | This asynchronous method starts the video recording process by
    | initializing the media recorder and beginning the recording.
    |
    */
    async startVideoRecording() {
        if (!this.mediaRecorder) {
            this.setupMediaRecord()
        } else {
            this.mediaRecorder.clearRecordedData()
        }

        console.log(this.mediaRecorder)

        // Start recording
        this.mediaRecorder.record();
    }

    /*
    |--------------------------------------------------------------------------
    | Stop Video Recording
    |--------------------------------------------------------------------------
    |
    | This asynchronous method stops the video recording process and
    | resolves a promise once the recording has been successfully stopped
    | and processed.
    |
    */
    async stopVideoRecording() {
        return new Promise(async (resolve, reject) => { // Changed to async

            if (!this.mediaRecorder || !this.stream) {
                return;
            }

            this.mediaRecorder.stop(async (recordedBlob) => {
                console.log(recordedBlob)
                if (!recordedBlob) {
                    reject('recording failed');
                }

                this.stream = null;

                if (!this.config.disableLogs) {
                    console.log('Stopped recording ' + this.config.type + ' stream.');
                }

                if (!this.config.disableLogs) {
                    console.log(recordedBlob.type, '->', Utility.bytesToSize(recordedBlob.size));
                }

                await this.handleStopRecording(recordedBlob); // Ensure this completes

                resolve(); // Resolve after handleStopRecording
            });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Stop Recording
    |--------------------------------------------------------------------------
    |
    | This asynchronous method processes the recorded blob by clearing the
    | video player sources and appending the media element to the DOM.
    |
    */
    handleStopRecording = async (blob) => { // Changed to async
        this.recordingPlayer.src = null;
        this.recordingPlayer.srcObject = null;
        await this.appendMediaElement(blob); // Ensure this completes
    }

    /*
    |--------------------------------------------------------------------------
    | Append Media Element
    |--------------------------------------------------------------------------
    |
    | This asynchronous method creates and appends a media element to the
    | main container in the DOM, allowing the user to play back the recorded
    | media.
    |
    */
    async appendMediaElement(blob) {
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
              </svg>`;

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

    /*
    |--------------------------------------------------------------------------
    | Change Input Device
    |--------------------------------------------------------------------------
    |
    | This asynchronous method changes the input device for audio or video
    | based on the provided device ID and input type, re-initializing the
    | recording process if necessary.
    |
    */
    async changeInputDevice(deviceId, inputType) {
        console.log(deviceId, inputType)
        if (inputType === 'audioInput') {
            this.handleAudioInputChange(deviceId)
        } else {
            this.handleVideoInputChange(deviceId)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Audio Input Change
    |--------------------------------------------------------------------------
    |
    | This asynchronous method updates the audio input device and captures
    | a new media stream, re-initializing the recording process if it was
    | active.
    |
    */
    async handleAudioInputChange(deviceId) {
        // Update the video constraints
        const oldVideoConstraints = this.videoConstraints.video;

        this.videoConstraints.audio.deviceId = { exact: deviceId };
        this.videoConstraints.video = false;

        const currentState = this.mediaRecorder?.getState();

        console.log(currentState)

        // If recorder is in recording state
        if (currentState === 'recording') {
            console.log('recording paused')
            this.mediaRecorder.pause();
        }

        // Save the current video track
        const videoTrack = this.stream.getVideoTracks()[0];

        // Stop the current stream
        // this.stream.getTracks().forEach(track => track.stop());

        // Capture new stream with updated video constraints
        const newStream = await this.captureUserMedia().catch(e => {
            console.error(e);
            alert('Failed to capture media: ' + e.message);
        });

        newStream.addTrack(videoTrack);

        this.stream = newStream;

        this.videoConstraints.video = oldVideoConstraints

        if (currentState === 'recording') {
            console.log('recording started again')
            await this.init()
            this.startVideoRecording()
            console.log(this.mediaRecorder?.getState())
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Video Input Change
    |--------------------------------------------------------------------------
    |
    | This asynchronous method updates the video input device and captures
    | a new media stream, re-initializing the recording process if it was
    | active.
    |
    */
    async handleVideoInputChange(deviceId) {
        const oldAudioConstraints = this.videoConstraints.audio;
        // Update the video constraints
        this.videoConstraints.video.deviceId = { exact: deviceId };
        // this.videoConstraints.audio = false;

        const currentState = this.mediaRecorder?.getState() || null;

        // If recorder is in recording state
        if (currentState === 'recording') {
            this.mediaRecorder.pause();
        }

        // Stop the current stream
        this.stream.getTracks().forEach(track => track.stop());

        // Capture new stream with updated video constraints
        const newStream = await this.captureUserMedia().catch(e => {
            console.error(e);
            alert('Failed to capture media: ' + e.message);
            return;
        });

        // Check if the new stream has the expected video track
        if (newStream.getVideoTracks().length > 0) {
            console.log('New video stream is set properly.');
        } else {
            console.error('Failed to set the new video stream.');
            return;
        }

        this.stream = newStream;

        this.videoConstraints.audio = oldAudioConstraints

        if (currentState === 'recording') {
            await this.init()
            this.startVideoRecording()
        }
    }
}
