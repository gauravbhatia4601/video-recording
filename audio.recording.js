//this file contains the code to record audio elements

import { App } from './app.js'

export class AudioRecorder {

    stream = null

    audioContext = null

    mediaRecorderMimeTypes = [
        'audio/ogg;codecs=opus',
        "audio/webm;codecs=opus",
        "audio/wav"
    ];

    constructor() {
        this.recordedChunks = [];
        if (!navigator.mediaDevices) {
            console.log('Media Device are not available');
            alert('Media Device are not available');
            return;
        }

        this.supportedMimeType = this.mediaRecorderMimeTypes.filter((type) => { return MediaRecorder.isTypeSupported(type) })

        if (this.supportedMimeType.length === 0) {
            alert('Mime type not supported!!');
            return;
        }

        this.gainNode = null;
        this.noiseCancellation = false;
        this.canvas = document.getElementById('audio-wave');
        // this.init().then(() => this.registerEvents())
    }

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
            // .then(() => this.handleStartRecording())
            .catch((error) => {
                console.error(error?.message)
                alert(error?.message)
            });
    }

    //handle the stream generated from media devices
    handleStream(stream) {
        this.stream = stream;
        console.log(stream)
        const options = {
            mimeType: this.supportedMimeType,
            audioBitsPerSecond: 128000
        }
        this.mediaRecorder = new MediaRecorder(stream, options)
        this.mediaRecorder.onstart = this.handleMediaRecorderStart.bind(this)
        this.mediaRecorder.onstop = this.handleMediaRecorderStop.bind(this)
        this.mediaRecorder.ondataavailable = this.handleRecorderChunks.bind(this)

        this.setupCanvasVisualizer()
    }

    clearRecordedData() {
        // this.recordedChunks = [];
        console.log('old record data cleared')
    }

    //handle user start recording interaction
    handleStartRecording(event) {
        this.clearRecordedData();
        this.mediaRecorder.start(10)
        console.log(event, 'starting recording')
    }

    //handle user stop recording interaction
    handleStopRecording(event) {
        console.log('recording stop')
        this.mediaRecorder.stop()
        console.log(event, 'stopping recording')
    }

    //Push the chunks to array when available using ondataavailable event of MediaRecorder interface.
    handleRecorderChunks(event) {
        this.recordedChunks.push(event.data)
        console.log(event, 'chunks')
    }

    handleMediaRecorderStart(event) { //handle media recorder start
        console.log(event, 'recording started')
    }

    //handle recording stop and generate the new HTML audio element to stream the recorded media and append it to DOM.
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
            })
    }

    setVolume(level) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(level, this.audioContext.currentTime);
        }
    }

    toggleNoiseCancellation() {
        this.noiseCancellation = !this.noiseCancellation;
        // Implement noise cancellation logic here
    }

    //display sine wave when audio is input
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

    async changeAudioInputDevice(deviceId) {
        console.log(deviceId)
        console.log(this.recordedChunks)
        // if (this.stream) {
        //     this.stream.getTracks().forEach(track => track.stop());
        // }
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
        this.stream = newStream;
        // // Reconnect the new stream to the audio context
        // const source = this.audioContext.createMediaStreamSource(newStream);
        // source.connect(this.analyser);

        const oldSourceNode = this.sourceNode;

        this.sourceNode = this.audioContext.createMediaStreamSource(newStream);
        this.sourceNode.connect(this.analyser);

        // Update the stream for the recorder without stopping it
        const audioTrack = newStream.getAudioTracks()[0];
        this.stream.removeTrack(this.stream.getAudioTracks()[0]);
        this.stream.addTrack(audioTrack);

        // If we're currently recording, we need to handle the transition
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            // Temporarily pause recording
            this.mediaRecorder.pause();

            // Create a new MediaRecorder with the updated stream
            await this.init(deviceId);

            // Resume recording with the new recorder
            this.mediaRecorder.start();
            console.log(this.recordedChunks)
        }

        oldSourceNode.disconnect();
    }
}