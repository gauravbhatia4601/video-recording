//this file contains the code to record audio elements

export class AudioRecorder {

    recordedChunks = [];
    
    mediaRecorderMimeTypes = [
        'audio/ogg; codecs=opus',
        "audio/webm; codecs=opus"
    ];

    constructor() {
        if (!navigator.mediaDevices) {
            console.log('Media Device are not available');
            alert('Media Device are not available');
            return;
        }

        this.supportedMimeType = this.mediaRecorderMimeTypes.filter((type) => { return MediaRecorder.isTypeSupported(type) })

        if (this.supportedMimeType.length === 0) {
            alert('Mime type not supported!');
            return;
        }

        this.canvas = document.getElementById('audio-wave')
        this.init().then(() => this.registerEvents())

    }

    async init() {
        return navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => this.handleGetUserMedia(stream))
            .then(() => this.getEnumerateDevices())
            .catch((error) => {
                console.error(error?.message)
                alert(error?.message)
            });
    }

    async getEnumerateDevices() {
        return navigator.mediaDevices.enumerateDevices()
            .then((devices) => this.populateDeviceMenus(devices))
    }

    registerEvents() { //register events to start and stop recording
        // document.getElementById('start-audio-recording').addEventListener('click', this.handleStartRecording.bind(this))
        // document.getElementById('stop-audio-recording').addEventListener('click', this.handleStopRecording.bind(this))
    }

    handleGetUserMedia(stream) {
        const options = {
            mimeType: this.supportedMimeType,
            audioBitsPerSecond: 128000
        }
        this.mediaRecorder = new MediaRecorder(stream, options)
        this.mediaRecorder.onstart = this.handleMediaRecorderStart.bind(this)
        this.mediaRecorder.onstop = this.handleMediaRecorderStop.bind(this)
        this.mediaRecorder.ondataavailable = this.handleRecorderChunks.bind(this)

        this.setupCanvasVisualizer(stream)
    }

    setupCanvasVisualizer(stream) {

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();

        // Source node from the stream
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        // Assuming you have a canvas element referenced by this.canvas
        const canvasCtx = this.canvas.getContext('2d');

        analyser.fftSize = 256; // Adjust for frequency resolution
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const WIDTH = this.canvas.width;
        const HEIGHT = this.canvas.height;

        const drawVisualizer = () => {
            requestAnimationFrame(drawVisualizer);

            analyser.getByteTimeDomainData(dataArray);

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

    handleStartRecording(event) { //handle start recording button event
        this.mediaRecorder.start()
        console.log(event, 'starting recording')
    }

    handleStopRecording(event) { //handle stop recording button event
        this.mediaRecorder.stop()
        console.log(event, 'stopping recording')
    }

    handleRecorderChunks(event) { //handle recorder media chunks
        this.recordedChunks.push(event.data)
        console.log(event, 'chunks')
    }

    handleMediaRecorderStart(event) { //handle media recorder start
        console.log(event, 'recording started')
    }

    handleMediaRecorderStop(stream) {
        console.log(stream, 'recording stopped');

        const clipName = prompt("Enter a name for your sound clip") || 'Untitled Clip';

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

        mainContainer.appendChild(clipContainer);

        const blob = new Blob(this.recordedChunks, { type: this.supportedMimeType });
        this.recordedChunks = [];
        const audioURL = URL.createObjectURL(blob);
        audio.src = audioURL;

        console.log("recorder stopped");

        deleteButton.onclick = (e) => {
            const clipToRemove = e.target.closest('.bg-white');
            clipToRemove.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                mainContainer.removeChild(clipToRemove);
            }, 300); // Match this with the transition duration
        };
    }

    populateDeviceMenus(devices) {
        const audioMenu = document.getElementsByClassName("inputAudioDevice");
        const videoMenu = document.getElementsByClassName("inputVideoDevice");
        if (!audioMenu) {
            console.warn('One or more menu elements are missing from the DOM');
            return;
        }

        devices.forEach(device => {
            switch (device.kind) {
                case 'audioinput':
                    for (const [key, menu] of Object.entries(audioMenu)) {
                        this.createDeviceOption(device, menu)
                    }
                    break;
                case 'videoinput':
                    for (const [key, menu] of Object.entries(videoMenu)) {
                        this.createDeviceOption(device, menu)
                    }
                    break;
                default:
                    console.log(device.label)
            }
        })
    }

    createDeviceOption(device, menu) {
        const option = document.createElement("option");
        option.textContent = device.label || `Device ${device.deviceId}`;
        option.value = device.deviceId;
        menu.appendChild(option);
    }
}