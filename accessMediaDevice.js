export class AccessMediaDevice {
    constructor() {
        // this.getEnumerateDevices()
        this.registerEvents()
        this.audioMenu = document.getElementById("inputAudioDevice");
        this.videoMenu = document.getElementById("inputVideoDevice");
    }

    async getEnumerateDevices() {
        // First, get user media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .catch((error) => {
                handleError(error)
            });

        // Then enumerate devices
        await navigator.mediaDevices.enumerateDevices()
            .then((devices) => this.populateDeviceMenus(devices))
            .catch(error => {
                handleError(error)
            });

        return stream;
    }

    handleError(error) {
        console.error('Error in getEnumerateDevices:', error);

        if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
            throw new Error('Permission to access media devices was denied. Please grant permission and try again.');
        } else if (error?.name === 'NotFoundError') {
            throw new Error('No media devices found. Please ensure a camera and microphone are connected.');
        } else if (error?.name === 'AbortError') {
            throw new Error('The operation was aborted. This might be due to a hardware error or a timeout.');
        } else {
            throw new Error('An unexpected error occurred');
        }
    }

    registerEvents() {
        navigator.mediaDevices.addEventListener('devicechange', this.getEnumerateDevices.bind(this));
    }

    populateDeviceMenus(devices) {
        console.log(devices)
        if (!this.audioMenu) {
            console.warn('One or more menu elements are missing from the DOM');
            return;
        }
        this.audioMenu.innerHTML = '';
        this.videoMenu.innerHTML = '';

        devices.forEach(device => {
            switch (device.kind) {
                case 'audioinput':
                    this.createDeviceOption(device, this.audioMenu)
                    break;
                case 'videoinput':
                    this.createDeviceOption(device, this.videoMenu)
                    break;
                default:
                    console.log(device.label)
            }
        })
    }

    createDeviceOption(device, menu) {
        if (device.deviceId == 'default') return;
        const option = document.createElement("option");
        option.textContent = device.label || `Device ${device.deviceId}`;
        option.value = device.deviceId;
        menu.appendChild(option);
    }
}