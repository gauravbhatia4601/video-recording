//this file contains the code to record audio elements

import { App } from './app.js'

/*
|--------------------------------------------------------------------------
| AudioRecorder Class
|--------------------------------------------------------------------------
|
| This class provides functionality for recording audio using the MediaRecorder
| API. It manages the audio input stream, handles recording operations, and
| processes recorded audio data. The class includes methods for starting and
| stopping recordings, managing audio visualizations, and changing input devices.
| It also provides utilities for handling recorded audio chunks and controlling
| audio playback.
|
| Example usage:
| const audioRecorder = new AudioRecorder();
| audioRecorder.init(deviceId);
| audioRecorder.handleStartRecording(event);
| audioRecorder.handleStopRecording(event);
|
*/

export class AudioRecorder {

    /*
    |--------------------------------------------------------------------------
    | Stream
    |--------------------------------------------------------------------------
    |
    | This property holds the media stream for recording audio from the user's
    | microphone or other audio input devices.
    |
    */
    stream = null;

    /*
    |--------------------------------------------------------------------------
    | Audio Context
    |--------------------------------------------------------------------------
    |
    | This property holds the AudioContext instance used for processing audio
    | data and managing audio nodes for visualization and effects.
    |
    */
    audioContext = null;

    /*
    |--------------------------------------------------------------------------
    | Supported MIME Types
    |--------------------------------------------------------------------------
    |
    | This array contains the MIME types supported for audio recording, allowing
    | the class to select the appropriate format based on browser capabilities.
    |
    */
    mediaRecorderMimeTypes = [
        'audio/ogg;codecs=opus',
        "audio/webm;codecs=opus",
        "audio/wav",
        "audio/mpeg",
        "audio/mp4"
    ];

    /*
    |--------------------------------------------------------------------------
    | Recorded Chunks
    |--------------------------------------------------------------------------
    |
    | This array holds the chunks of audio data recorded during the recording
    | session, which can be processed and converted into a Blob for playback.
    |
    */
    recordedChunks = [];

    /*
    |--------------------------------------------------------------------------
    | Supported MIME Type
    |--------------------------------------------------------------------------
    |
    | This property holds the filtered list of supported MIME types based on
    | the browser's capabilities, ensuring that the selected format is valid
    | for recording.
    |
    */
    supportedMimeType = [];

    /*
    |--------------------------------------------------------------------------
    | Gain Node
    |--------------------------------------------------------------------------
    |
    | This property holds the gain node used for controlling the volume of the
    | audio output during playback.
    |
    */
    gainNode = null;

    /*
    |--------------------------------------------------------------------------
    | Noise Cancellation
    |--------------------------------------------------------------------------
    |
    | This boolean property indicates whether noise cancellation is enabled or
    | disabled for the audio input stream.
    |
    */
    noiseCancellation = false;

    /*
    |--------------------------------------------------------------------------
    | Canvas Element
    |--------------------------------------------------------------------------
    |
    | This property holds a reference to the canvas element used for visualizing
    | the audio waveform during recording.
    |
    */
    canvas = null;

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    |
    | This constructor initializes the AudioRecorder instance, checks for
    | the availability of media devices, and sets up supported MIME types
    | for audio recording. It also initializes properties related to audio
    | processing and visualization.
    |
    */
    constructor() {
        this.recordedChunks = [];
        if (!navigator.mediaDevices) {
            console.log('Media Device are not available');
            alert('Media Device are not available');
            return;
        }

        this.supportedMimeType = this.mediaRecorderMimeTypes.filter((type) => { return MediaRecorder.isTypeSupported(type) });

        if (this.supportedMimeType.length === 0) {
            alert('Mime type not supported!!');
            return;
        }

        this.gainNode = null;
        this.noiseCancellation = false;
        this.canvas = document.getElementById('audio-wave');
        // this.init().then(() => this.registerEvents())
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize
    |--------------------------------------------------------------------------
    |
    | This asynchronous method initializes the audio recording by requesting
    | access to the user's audio devices and handling the resulting media stream.
    |
    */
    async init(deviceId) {
        console.log(deviceId);
        return navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                deviceId: { exact: deviceId }
            }
        })
            .then((stream) => this.handleStream(stream))
            .catch((error) => {
                console.error(error?.message);
                alert(error?.message);
            });
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Stream
    |--------------------------------------------------------------------------
    |
    | This method processes the media stream obtained from the user's audio
    | devices, setting up the MediaRecorder and initializing the canvas visualizer.
    |
    */
    handleStream(stream) {
        this.stream = stream;
        console.log(stream);
        const options = {
            mimeType: Array.isArray(this.supportedMimeType) && this.supportedMimeType.length > 0
                ? this.supportedMimeType[0]
                : this.supportedMimeType,
            audioBitsPerSecond: 128000
        };
        this.mediaRecorder = new MediaRecorder(stream, options);
        this.mediaRecorder.onstart = this.handleMediaRecorderStart.bind(this);
        this.mediaRecorder.onstop = this.handleMediaRecorderStop.bind(this);
        this.mediaRecorder.ondataavailable = this.handleRecorderChunks.bind(this);

        this.setupCanvasVisualizer();
    }

    /*
    |--------------------------------------------------------------------------
    | Clear Recorded Data
    |--------------------------------------------------------------------------
    |
    | This method clears the previously recorded audio chunks, preparing for
    | a new recording session.
    |
    */
    clearRecordedData() {
        this.recordedChunks = [];
        console.log('old record data cleared');
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Start Recording
    |--------------------------------------------------------------------------
    |
    | This method handles the user's interaction to start recording audio,
    | clearing any previous recorded data and starting the MediaRecorder.
    |
    */
    handleStartRecording(event) {
        this.clearRecordedData();
        this.mediaRecorder.start(10);
        console.log(event, 'starting recording');
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Stop Recording
    |--------------------------------------------------------------------------
    |
    | This method handles the user's interaction to stop recording audio,
    | stopping the MediaRecorder and processing the recorded audio.
    |
    */
    handleStopRecording(event) {
        console.log('recording stop');
        this.mediaRecorder.stop();
        console.log(event, 'stopping recording');
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Recorder Chunks
    |--------------------------------------------------------------------------
    |
    | This method pushes the recorded audio chunks into an array when data
    | is available from the MediaRecorder.
    |
    */
    handleRecorderChunks(event) {
        this.recordedChunks.push(event.data);
        console.log(event, 'chunks');
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Media Recorder Start
    |--------------------------------------------------------------------------
    |
    | This method handles the event when the MediaRecorder starts recording,
    | logging the event for debugging purposes.
    |
    */
    handleMediaRecorderStart(event) {
        console.log(event, 'recording started');
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Media Recorder Stop
    |--------------------------------------------------------------------------
    |
    | This method processes the recorded audio when the MediaRecorder stops,
    | creating a new audio element and appending it to the DOM for playback.
    |
    */
    handleMediaRecorderStop(stream) {
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

                const audio = document.createElement("audio");
                audio.className = "w-full mt-2";
                audio.setAttribute("controls", "");

                clipContainer.appendChild(clipHeader);
                clipContainer.appendChild(audio);

                mainContainer.prepend(clipContainer);

                const blob = new Blob(this.recordedChunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(blob);
                audio.src = audioURL;

                console.log("recorder stopped");

                deleteButton.onclick = (e) => {
                    const clipToRemove = e.target.closest('.bg-white');
                    clipToRemove.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => {
                        mainContainer.removeChild(clipToRemove);
                    }, 300);
                };
            });
    }

    /*
    |--------------------------------------------------------------------------
    | Set Volume
    |--------------------------------------------------------------------------
    |
    | This method sets the volume level of the audio output using the gain node.
    |
    */
    setVolume(level) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Toggle Noise Cancellation
    |--------------------------------------------------------------------------
    |
    | This method toggles the noise cancellation feature on or off.
    |
    */
    toggleNoiseCancellation() {
        this.noiseCancellation = !this.noiseCancellation;
        // Implement noise cancellation logic here
    }

    /*
    |--------------------------------------------------------------------------
    | Setup Canvas Visualizer
    |--------------------------------------------------------------------------
    |
    | This method initializes the audio visualizer, creating an audio context
    | and connecting the audio stream to a canvas for visual representation.
    |
    */
    setupCanvasVisualizer() {
        const audioContent = this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;

        // Create a gain node for volume control
        this.gainNode = this.audioContext.createGain();

        // Source node from the stream
        this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
        this.sourceNode.connect(this.analyser);

        // Assuming you have a canvas element referenced by this.canvas
        const canvasCtx = this.canvas.getContext('2d');

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const WIDTH = this.canvas.width;
        const HEIGHT = this.canvas.height;

        const drawVisualizer = () => {
            requestAnimationFrame(drawVisualizer);

            this.analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();

            const sliceWidth = WIDTH * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(WIDTH, HEIGHT / 2);
            canvasCtx.stroke();
        };

        drawVisualizer(); // Start the visualization
    }

    /*
    |--------------------------------------------------------------------------
    | Change Input Device
    |--------------------------------------------------------------------------
    |
    | This asynchronous method changes the input device for audio recording,
    | updating the media stream and reconnecting the audio context as necessary.
    |
    */
    async changeInputDevice(deviceId) {
        console.log(deviceId);
        console.log(this.recordedChunks);

        const currentState = this.mediaRecorder?.state || null;
        // Temporarily pause recording
        if (currentState === 'recording') {
            this.mediaRecorder.pause();
        } else {
            return;
        }

        // Capture new stream
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
        this.stream = newStream;

        const oldSourceNode = this.sourceNode;

        // Reconnect the new stream to the audio context
        this.sourceNode = this.audioContext.createMediaStreamSource(newStream);
        this.sourceNode.connect(this.analyser);

        // Update the stream for the recorder without stopping it
        const audioTrack = newStream.getAudioTracks()[0];
        this.stream.removeTrack(this.stream.getAudioTracks()[0]);
        this.stream.addTrack(audioTrack);

        // If we're currently recording, we need to handle the transition
        if (currentState === 'recording') {
            // Create a new MediaRecorder with the updated stream
            await this.init(deviceId);

            // Resume recording with the new recorder
            this.mediaRecorder.start(10);
            console.log(this.recordedChunks);
        }

        oldSourceNode.disconnect();
    }
}
