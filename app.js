import { AudioRecorder } from './audio.recording.js';
import { indexDB } from './indexDb.js';
import { Utility } from './Utility.js';
import { AccessMediaDevice } from './accessMediaDevice.js';
// import { videoRecorder, startVideoRecording, stopVideoRecording, recordingPlayer } from './video-recording.js'
import { VideoRecorder } from './video.js';

class App {

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    |
    | This constructor initializes the App instance, setting up the recorder mode,
    | elements, and application state, and calls the initialization method.
    |
    */
    constructor() {
        this.recorderMode = 'video';
        this.elements = {};
        this.state = '';
        this.init();
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize
    |--------------------------------------------------------------------------
    |
    | This asynchronous method initializes the application by registering events,
    | setting up the indexDB, utility, access media device, and creating instances
    | of audio and video recorders.
    |
    */
    async init() {
        this.registerEvents();

        this.indexDB = new indexDB();

        this.utility = new Utility();

        this.accessMediaDevice = new AccessMediaDevice();

        await this.accessMediaDevice.getEnumerateDevices()

        this.audioRecorder = new AudioRecorder();

        this.videoRecorder = new VideoRecorder(this.mainStream);

    }

    /*
    |--------------------------------------------------------------------------
    | Register Events
    |--------------------------------------------------------------------------
    |
    | This method registers event listeners for switching tabs and handling
    | control events for recording.
    |
    */
    registerEvents() { //register events for switching the tabs

        this.initializeElements();
        this.addTabEventListeners();
        this.handleControlEvents();
    }

    /*
    |--------------------------------------------------------------------------
    | Initialize Elements
    |--------------------------------------------------------------------------
    |
    | This method initializes the UI elements by retrieving them from the DOM
    | and storing them in the elements object for easy access.
    |
    */
    initializeElements() {
        console.log(this.elements)
        const ids = [
            'videoContent', 'audioContent', 'videoTab', 'audioTab',
            'inputVideoDevice', 'inputAudioDevice'
        ];
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }

    getVideoInputs() {
        return {
            videoId: this.elements.inputVideoDevice.value,
            audioId: this.elements.inputAudioDevice.value
        };
    }

    addTabEventListeners() {
        this.elements.videoTab.addEventListener('click', () => this.handleTabSwitch('video'));
        this.elements.audioTab.addEventListener('click', () => this.handleTabSwitch('audio'));
        this.elements.inputAudioDevice.addEventListener('change', (event) => this.handleInputSwitch(event, 'audioInput'));
        this.elements.inputVideoDevice.addEventListener('change', (event) => this.handleInputSwitch(event, 'videoInput'));
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Tab Switch
    |--------------------------------------------------------------------------
    |
    | This method handles the switching between video and audio recording modes,
    | updating the UI and initializing the appropriate media streams.
    |
    */
    handleTabSwitch(mode) {
        const isVideo = mode === 'video';
        this.recorderMode = mode;

        this.updateTabStyles(isVideo);
        this.toggleContentVisibility(isVideo);
        this.toggleDeviceListVisibility(isVideo);

        if (isVideo) {
            this.stopStream(this.audioRecorder.stream); //stop audio stream
            this.videoRecorder.init() //initialize video stream
        } else {
            this.videoRecorder.clearVideoSource(); //stop video stream
            console.log(this.elements.inputAudioDevice.value)
            this.audioRecorder.init(this.elements.inputAudioDevice.value); //initialize the audio stream
        }
    }

    updateTabStyles(isVideo) {
        const activeTab = isVideo ? 'videoTab' : 'audioTab';
        const inactiveTab = isVideo ? 'audioTab' : 'videoTab';

        this.elements[activeTab].classList.add('bg-white', 'text-black-600');
        this.elements[activeTab].classList.remove('text-white');

        this.elements[inactiveTab].classList.remove('text-black-600', 'bg-white');
        this.elements[inactiveTab].classList.add('text-white');
    }

    toggleContentVisibility(isVideo) {
        this.elements.videoContent.classList.toggle('hidden', !isVideo);
        this.elements.audioContent.classList.toggle('hidden', isVideo);
    }

    toggleDeviceListVisibility(isVideo) {
        // this.elements.inputVideoDevice.classList.toggle('hidden', !isVideo);
    }

    stopStream(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Control Events
    |--------------------------------------------------------------------------
    |
    | This method sets up event listeners for the start and stop recording buttons,
    | enabling the user to control the recording process.
    |
    */
    handleControlEvents() {
        this.startRecordingButton = document.getElementById('start-recording-btn');
        this.startRecordingButton.addEventListener('click', this.handleRecordingStart.bind(this));

        this.stopRecordingButton = document.getElementById('stop-recording-btn');
        this.stopRecordingButton.addEventListener('click', this.handleRecordingStop.bind(this));
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Recording Start
    |--------------------------------------------------------------------------
    |
    | This method handles the start of the recording process, updating the UI
    | and invoking the appropriate recording method based on the current mode.
    |
    */
    handleRecordingStart(event) {
        this.startRecordingButton.disabled = true;
        this.startRecordingButton.classList.add('hidden', 'cursor-not-allowed');

        this.stopRecordingButton.disabled = false;
        this.stopRecordingButton.classList.remove('hidden', 'cursor-not-allowed');
        
        if (this.recorderMode == 'audio') {
            this.audioRecorder.handleStartRecording(event)
        } else {
            this.videoRecorder.startVideoRecording(event)
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Recording Stop
    |--------------------------------------------------------------------------
    |
    | This asynchronous method handles the stopping of the recording process,
    | updating the UI and invoking the appropriate stop method based on the
    | current mode.
    |
    */
    async handleRecordingStop(event) {

        this.stopRecordingButton.disabled = true;
        this.stopRecordingButton.classList.add('hidden', 'cursor-not-allowed');

        this.startRecordingButton.disabled = false;
        this.startRecordingButton.classList.remove('hidden', 'cursor-not-allowed');
        if (this.recorderMode == 'audio') {
            this.audioRecorder.handleStopRecording(event)
        } else {
            await this.videoRecorder.stopVideoRecording(event)
            this.videoRecorder.init()
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Open Modal
    |--------------------------------------------------------------------------
    |
    | This static method opens a modal dialog for user input, returning a promise
    | that resolves with the input value when the modal is closed.
    |
    */
    static openModal() {
        return new Promise((resolve, reject) => {
            const input = document.getElementById('clipName')
            input.value = '';
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
                resolve(input.value)
            })
        })
    }

    /*
    |--------------------------------------------------------------------------
    | Handle Input Switch
    |--------------------------------------------------------------------------
    |
    | This method handles the switching of input devices for audio or video,
    | updating the recorder with the new device ID.
    |
    */
    handleInputSwitch(event, inputType) {
        const deviceId = event.target?.value;

        if (!deviceId) return;

        const recorder = inputType == 'audioInput' && this.recorderMode == 'audio' ? this.audioRecorder : this.videoRecorder;

        recorder.changeInputDevice(deviceId, inputType)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});

export { App };
