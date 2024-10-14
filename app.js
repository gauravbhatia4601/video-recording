import { AudioRecorder } from './audio.recording.js'
import { indexDB } from './indexDb.js'
import { Utility } from './Utility.js';
// import { videoRecorder } from './video-recording.js'

class App {
    constructor() {
        this.audioRecorder = new AudioRecorder();
        this.indexDB = new indexDB();
        this.utility = new Utility();
        this.recorderMode = 'video'
        this.init()
    }

    init() {
        this.handleControlEvents()
    }

    handleControlEvents() {
        this.startRecordingButton = document.getElementById('start-recording-btn');
        this.startRecordingButton.addEventListener('click', this.handleRecordingStart.bind(this));

        this.stopRecordingButton = document.getElementById('stop-recording-btn');
        this.stopRecordingButton.addEventListener('click', this.handleRecordingStop.bind(this));
    }

    handleRecordingStart(event) {
        this.startRecordingButton.disabled = true;
        this.startRecordingButton.classList.add('hidden', 'cursor-not-allowed');

        this.stopRecordingButton.disabled = false;
        this.stopRecordingButton.classList.remove('hidden', 'cursor-not-allowed');
        console.log(this.recorderMode)
        if (this.recorderMode == 'audio') {
            this.audioRecorder.handleStartRecording(event)
        }
    }

    handleRecordingStop(event) {

        this.stopRecordingButton.disabled = true;
        this.stopRecordingButton.classList.add('hidden', 'cursor-not-allowed');

        this.startRecordingButton.disabled = false;
        this.startRecordingButton.classList.remove('hidden', 'cursor-not-allowed');
        if (this.recorderMode == 'audio') {
            this.audioRecorder.handleStopRecording(event)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    const videoTab = document.getElementById('videoTab');
    const audioTab = document.getElementById('audioTab');
    const videoContent = document.getElementById('videoContent');
    const audioContent = document.getElementById('audioContent');

    const modal = document.getElementById('modal');
    const modalOverlay = document.getElementById('modalOverlay');

    videoTab.addEventListener('click', () => {
        videoTab.classList.add('bg-white');
        videoTab.classList.remove('bg-transparent', 'border', 'border-purple-600');
        videoContent.classList.remove('hidden');

        audioTab.classList.remove('bg-white');
        audioTab.classList.add('bg-transparent', 'border', 'border-purple-600');
        audioContent.classList.add('hidden');
        app.recorderMode = 'video';
    });

    audioTab.addEventListener('click', () => {
        audioTab.classList.add('bg-white');
        audioTab.classList.remove('bg-transparent', 'border', 'border-purple-600');
        audioContent.classList.remove('hidden');

        videoTab.classList.remove('bg-white');
        videoTab.classList.add('bg-transparent', 'border', 'border-purple-600');
        videoContent.classList.add('hidden');
        app.recorderMode = 'audio';
    });

    async function openModal(callback) {
        modalOverlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        modalOverlay.classList.add('fade-in');
        modal.classList.add('scale-in');

        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('fade-out');
            modal.classList.add('scale-out');
            setTimeout(() => {
                modalOverlay.classList.add('hidden');
                modal.classList.add('hidden');
                modalOverlay.classList.remove('fade-in', 'fade-out');
                modal.classList.remove('scale-in', 'scale-out');
            }, 300);
            callback(document.getElementById('clipName').value)
        })
    }
});