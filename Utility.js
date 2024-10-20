export class Utility {

    constructor() {
        this.detectBrowser();
    }

    detectBrowser() {
        this.isEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveBlob || !!navigator.msSaveOrOpenBlob);
        this.isOpera = !!window.opera || navigator.userAgent.indexOf('OPR/') !== -1;
        this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && ('netscape' in window) && / rv:/.test(navigator.userAgent);
        this.isChrome = (!this.isOpera && !this.isEdge && !!navigator.webkitGetUserMedia) || this.isElectron() || navigator.userAgent.toLowerCase().indexOf('chrome/') !== -1;
        this.isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function' || navigator.userAgent.includes('Brave') || navigator.userAgent.includes('brave')
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        if (this.isSafari && !this.isChrome && navigator.userAgent.indexOf('CriOS') !== -1) {
            this.isSafari = false;
            this.isChrome = true;
        }
    }

    log(message) {
        console.log(message)
    }

    static bytesToSize(bytes) {
        var k = 1000;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) {
            return '0 Bytes';
        }
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }

    isElectron() {
        // Renderer process
        if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
            return true;
        }

        // Main process
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
            return true;
        }

        // Detect the user agent when the `nodeIntegration` option is set to true
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }

        return false;
    }
}