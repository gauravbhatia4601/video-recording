export class RecorderType {
    constructor() {
        // this.detectBrowser();
    }

    getRecorderType(mediaStream, config) {
        return new Promise((resolve, reject) => {
            var recorderType;
            if (this.isChrome || this.isFirefox || this.isOpera) {
                recorderType = new StereoAudioRecorder();
            }

            if (typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype && !this.isChrome) {
                recorderType = new MediaStreamRecorder();
            }

            if (config.type === 'video' && (isChrome || isOpera)) {
                recorderType = new WhammyRecorder();

                if (typeof WebAssemblyRecorder !== 'undefined' && typeof ReadableStream !== 'undefined') {
                    recorderType = new WebAssemblyRecorder();
                }
            }

            if (this.isMediaRecorderCompatible() && typeof MediaRecorder !== 'undefined' && 'requestData' in MediaRecorder.prototype) {
                if (this.getTracks(mediaStream, 'video').length || getTracks(mediaStream, 'audio').length) {
                    // audio-only recording
                    if (config.type === 'audio') {
                        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/webm')) {
                            recorderType = new MediaStreamRecorder();
                        }
                    } else {
                        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('video/webm')) {
                            recorderType = new MediaStreamRecorder();
                        }
                    }
                }
            }

            if (mediaStream instanceof Array && mediaStream.length) {
                recorderType = new MultiStreamRecorder();
            }

            if (config.recorderType) {
                recorderType = config.recorderType;
            }

            if (!recorderType && this.isSafari) {
                recorderType = new MediaStreamRecorder();
            }

            if (!config.disableLogs && !!recorderType && !!recorderType.name) {
                console.log('Using recorderType:', recorderType.name || recorderType.constructor.name);
            }

            resolve(recorderType);

        }).catch(e => {
            console.log(e)
            reject(e?.message)
        })
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

    isMediaRecorderCompatible() {
        if (this.isFirefox || this.isSafari || this.isEdge) {
            return true;
        }

        // var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var fullVersion = '' + parseFloat(nAgt);
        var majorVersion = parseInt(nAgt, 10);
        var nameOffset, verOffset, ix;

        if (this.isChrome || this.isOpera) {
            verOffset = nAgt.indexOf('Chrome');
            fullVersion = nAgt.substring(verOffset + 7);
        }

        // trim the fullVersion string at semicolon/space if present
        if ((ix = fullVersion.indexOf(';')) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        if ((ix = fullVersion.indexOf(' ')) !== -1) {
            fullVersion = fullVersion.substring(0, ix);
        }

        majorVersion = parseInt('' + fullVersion, 10);

        if (isNaN(majorVersion)) {
            fullVersion = '' + parseFloat(nAgt);
            majorVersion = parseInt(nAgt, 10);
        }

        return majorVersion >= 49;
    }

    getTracks(stream, kind) {
        if (!stream || !stream.getTracks) {
            return [];
        }

        return stream.getTracks().filter(function (t) {
            return t.kind === (kind || 'audio');
        })
    }

}