export class Canvas {
    constructor(recordingPlayer) {
        this.recordingPlayer = recordingPlayer;
        this.videoCanvas = document.querySelector('#video-canvas');
        this.ctx = this.videoCanvas.getContext('2d');
        this.audioContext, this.audioSource, this.audioDestination = null;
        this.lastDrawTime = 0;
        this.isDrawing = false;
        this.frameInterval = 1000 / 30;
    }

    setCanvasSize() {
        return new Promise((resolve) => {
            const dpr = window.devicePixelRatio || 1;
            this.videoCanvas.width = this.recordingPlayer.videoWidth * dpr;
            this.videoCanvas.height = this.recordingPlayer.videoHeight * dpr;
            this.ctx.imageSmoothingEnabled = false;
            resolve();
        })
    }

    captureCanvasStream(stream) {
        return new Promise((resolve, reject) => {
            // Set up audio
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioDestination = this.audioContext.createMediaStreamDestination();
            this.audioSource.connect(this.audioDestination);

            // Combine video and audio
            const canvasStream = this.videoCanvas.captureStream(30);
            const tracks = [...canvasStream.getVideoTracks(), ...this.audioDestination.stream.getAudioTracks()];

            const combinedStream = new MediaStream(tracks);
            if (combinedStream) {
                resolve(combinedStream);
            }
            else {
                reject('Failed to start stream')
            }
        })
    }

    draw(timestamp) {
        if (!this.isDrawing) return;

        if (!timestamp) timestamp = performance.now();

        if (timestamp - this.lastDrawTime >= this.frameInterval) {
            this.drawCanvas();
            this.lastDrawTime = timestamp;
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    async drawCanvas() {

        // Only redraw if the video is actually playing
        if (this.recordingPlayer.paused || this.recordingPlayer.ended) return;

        // Ensure the canvas size is correct
        if (this.videoCanvas.width !== this.recordingPlayer.videoWidth || this.videoCanvas.height !== this.recordingPlayer.videoHeight) {
            await this.setCanvasSize();
        }
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.recordingPlayer, -this.videoCanvas.width, 0, this.videoCanvas.width, this.videoCanvas.height);
        this.ctx.restore();
    }
}