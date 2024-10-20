export class AccessMediaDevice {
    constructor() {
        // this.getEnumerateDevices()
        this.registerEvents()
        this.audioMenu = document.getElementById("inputAudioDevice");
        this.videoMenu = document.getElementById("inputVideoDevice");
    }

    async getEnumerateDevices() {
        return navigator.mediaDevices.enumerateDevices()
            .then((devices) => this.populateDeviceMenus(devices))
            .catch(err => {
                console.error('Error enumerating devices:', err);
            });
    }

    registerEvents() {
        navigator.mediaDevices.addEventListener('devicechange', this.getEnumerateDevices.bind(this));
    }

    populateDeviceMenus(devices) {
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