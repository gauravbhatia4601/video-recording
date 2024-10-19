import { Utility } from "./Utility.js";

export class MediaStreamRecorder {

    constructor(mediaStream, config = {}) {

        if (typeof mediaStream === 'undefined') {
            throw 'First argument "MediaStream" is required.';
        }

        if (typeof MediaRecorder === 'undefined') {
            throw 'Your browser does not support the Media Recorder API. Please try other modules e.g. WhammyRecorder or StereoAudioRecorder.';
        }

        this.mediaStream = mediaStream;

        this.arrayOfBlobs = [];

        this.allStates = [];

        /**
         * @property {Blob} blob - Recorded data as "Blob" object.
         * @memberof MediaStreamRecorder
         * @example
         * recorder.stop(function() {
         *     var blob = recorder.blob;
         * });
         */
        this.blob = null;

        /**
        * @property {Array} timestamps - Array of time stamps
        * @memberof MediaStreamRecorder
        * @example
        * console.log(recorder.timestamps);
        */
        this.timestamps = [];

        this.config = config || {
            // bitsPerSecond: 256 * 8 * 1024,
            mimeType: 'video/webm',
            type: 'video'
        };

        // if any Track within the MediaStream is muted or not enabled at any time, 
        // the browser will only record black frames 
        // or silence since that is the content produced by the Track
        // so we need to stopRecording as soon as any single track ends.
        if (typeof this.config?.checkForInactiveTracks === 'undefined') {
            this.config.checkForInactiveTracks = false; // disable to minimize CPU usage
        }

        this.looper();
    }

    setMimeType() {
        if (this.config.type === 'audio') {
            if (getTracks(this.mediaStream, 'video').length && getTracks(this.mediaStream, 'audio').length) {
                var stream;
                if (!!navigator.mozGetUserMedia) {
                    stream = new MediaStream();
                    stream.addTrack(this.getTracks(this.mediaStream, 'audio')[0]);
                } else {
                    // webkitMediaStream
                    stream = new MediaStream(this.getTracks(this.mediaStream, 'audio'));
                }
                this.mediaStream = stream;
            }
            if (!this.config.mimeType || this.config.mimeType.toString().toLowerCase().indexOf('audio') === -1) {
                this.config.mimeType = Utility.isChrome ? 'audio/webm' : 'audio/ogg';
                // this.config.mimeType = 'audio/webm';
            }
            if (this.config.mimeType && this.config.mimeType.toString().toLowerCase() !== 'audio/ogg' && !!navigator.mozGetUserMedia) {
                // forcing better codecs on Firefox (via #166)
                this.config.mimeType = 'audio/ogg';
            }
        }
    }

    /**
     * This method returns array of blobs. Use only with "timeSlice". Its useful to preview recording anytime, without using the "stop" method.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * var arrayOfBlobs = recorder.getArrayOfBlobs();
     * @returns {Array} Returns array of recorded blobs.
     */
    getArrayOfBlobs() {
        return this.arrayOfBlobs;
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    record() {
        //clear old recorded data
        this.clearRecordedData();

        this.recorderHints = this.config;

        if (!this.config.disableLogs) {
            console.log('Passing following config over MediaRecorder API.', this.recorderHints);
        }
        if (this.mediaRecorder && Utility.isFirefox) {
            // mandatory to make sure Firefox doesn't fails to record streams 3-4 times without reloading the page.
            this.mediaRecorder = null;
        }

        if (Utility.isChrome && !isMediaRecorderCompatible()) {
            // to support video-only recording on stable
            this.recorderHints.mimeType = 'video/vp8';
        }

        if (typeof MediaRecorder.isTypeSupported === 'function' && this.recorderHints.mimeType) {
            if (!MediaRecorder.isTypeSupported(this.recorderHints.mimeType)) {
                if (!this.config.disableLogs) {
                    console.warn('MediaRecorder API seems unable to record mimeType:', this.recorderHints.mimeType);
                }
                this.recorderHints.mimeType = this.config.type === 'audio' ? 'audio/webm' : 'video/webm';
            }
        }
        // using MediaRecorder API here
        try {
            this.mediaRecorder = new MediaRecorder(this.mediaStream, this.recorderHints);
            // reset
            this.config.mimeType = this.recorderHints.mimeType;
        } catch (e) {
            // chrome-based fallback
            this.mediaRecorder = new MediaRecorder(this.mediaStream, this.recorderHints);
        }
        // old hack?
        if (this.recorderHints.mimeType && !MediaRecorder.isTypeSupported && 'canRecordMimeType' in this.mediaRecorder && this.mediaRecorder.canRecordMimeType(this.recorderHints.mimeType) === false) {
            if (!this.config.disableLogs) {
                console.warn('MediaRecorder API seems unable to record mimeType:', this.recorderHints.mimeType);
            }
        }
        this.mediaRecorder.ondataavailable = this.handleRecordedChunks.bind(this)

        this.mediaRecorder.onstart = () => {
            this.allStates.push('started');
        };

        this.mediaRecorder.onpause = () => {
            this.allStates.push('paused');
        };

        this.mediaRecorder.onresume = () => {
            this.allStates.push('resumed');
        };

        this.mediaRecorder.onstop = () => {
            this.allStates.push('stopped');
        };

        this.mediaRecorder.onerror = (error) => {
            if (!error) {
                return;
            }
            if (!error.name) {
                error.name = 'UnknownError';
            }
            this.allStates.push('error: ' + error);
            if (!this.config.disableLogs) {
                // via: https://w3c.github.io/mediacapture-record/MediaRecorder.html#exception-summary
                if (error.name.toString().toLowerCase().indexOf('invalidstate') !== -1) {
                    console.error('The MediaRecorder is not in a state in which the proposed operation is allowed to be executed.', error);
                } else if (error.name.toString().toLowerCase().indexOf('notsupported') !== -1) {
                    console.error('MIME type (', this.recorderHints.mimeType, ') is not supported.', error);
                } else if (error.name.toString().toLowerCase().indexOf('security') !== -1) {
                    console.error('MediaRecorder security error', error);
                }
                // older code below
                else if (error.name === 'OutOfMemory') {
                    console.error('The UA has exhausted the available memory. User agents SHOULD provide as much additional information as possible in the message attribute.', error);
                } else if (error.name === 'IllegalStreamModification') {
                    console.error('A modification to the stream has occurred that makes it impossible to continue recording. An example would be the addition of a Track while recording is occurring. User agents SHOULD provide as much additional information as possible in the message attribute.', error);
                } else if (error.name === 'OtherRecordingError') {
                    console.error('Used for an fatal error other than those listed above. User agents SHOULD provide as much additional information as possible in the message attribute.', error);
                } else if (error.name === 'GenericError') {
                    console.error('The UA cannot provide the codec or recording option that has been requested.', error);
                } else {
                    console.error('MediaRecorder Error', error);
                }
            }

            (function (looper) {
                if (!this.manuallyStopped && this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
                    delete this.config.timeslice;
                    // 10 minutes, enough?
                    mediaRecorder.start(10 * 60 * 1000);
                    return;
                }
                setTimeout(looper, 1000);
            })();

            if (this.mediaRecorder.state !== 'inactive' && this.mediaRecorder.state !== 'stopped') {
                this.mediaRecorder.stop();
            }
        };

        if (typeof this.config.timeSlice === 'number') {
            this.updateTimeStamp();
            this.mediaRecorder.start(this.config.timeSlice);
        } else {
            // default is 60 minutes; enough?
            // use config => {timeSlice: 1000} otherwise
            this.mediaRecorder.start(3.6e+6);
        }

        if (this.config.initCallback) {
            this.config.initCallback(); // old code
        }
    }

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    stop(callback) {

        callback = callback || function () { };

        this.manuallyStopped = true; // used inside the mediaRecorder.onerror

        if (!this.mediaRecorder) {
            return;
        }

        this.recordingCallback = callback;

        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        // Object.keys(this.mediaRecorder).forEach((key) => {
        //     if (typeof this.mediaRecorder[key] === 'function') {
        //         return;
        //     }

        //     self[key] = this.mediaRecorder[key];
        // });

        if (typeof this.config.timeSlice === 'number') {
            setTimeout(() => {
                this.blob = new Blob(this.arrayOfBlobs, {
                    type: this.getMimeType(this.config)
                });
                this.recordingCallback(this.blob);
            }, 100);
        }
    }

    handleRecordedChunks(e) {

        //when data is available push state to allStates array
        if (e.data) {
            this.allStates.push('ondataavailable: ' + Utility.bytesToSize(e.data.size));
        }

        //if configuration contains timeSlice to use push all data to array of blobs
        // and use that array later to create blob
        if (typeof this.config.timeSlice === 'number') {
            if (e.data && e.data.size && e.data.size > 100) {
                this.arrayOfBlobs.push(e.data);
                this.updateTimeStamp();
                if (typeof this.config.ondataavailable === 'function') {
                    // intervals based blobs
                    var blob = this.config.getNativeBlob ? e.data : new Blob([e.data], {
                        type: this.getMimeType(this.recorderHints)
                    });
                    this.config.ondataavailable(blob);
                }
            }
            return;
        }

        if (!e.data || !e.data.size || e.data.size < 100 || this.blob) {
            // make sure that stopRecording always getting fired
            // even if there is invalid data
            if (this.recordingCallback) {
                this.recordingCallback(new Blob([], {
                    type: this.getMimeType(this.recorderHints)
                }));
                this.recordingCallback = null;
            }
            return;
        }

        this.blob = this.config.getNativeBlob ? e.data : new Blob([e.data], {
            type: this.getMimeType(this.recorderHints)
        });

        if (this.recordingCallback) {
            console.log('called callback function')
            this.recordingCallback(this.blob);
            this.recordingCallback = null;
        }
    }

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    pause() {
        if (!this.mediaRecorder) {
            return;
        }
        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    resume() {
        if (!this.mediaRecorder) {
            return;
        }
        if (this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    };

    getMimeType(secondObject) {
        if (this.mediaRecorder && this.mediaRecorder.mimeType) {
            return this.mediaRecorder.mimeType;
        }
        return secondObject.mimeType || 'video/webm';
    }

    updateTimeStamp() {
        this.timestamps.push(new Date().getTime());
        if (typeof this.config.onTimeStamp === 'function') {
            this.config.onTimeStamp(this.timestamps[this.timestamps.length - 1], this.timestamps);
        }
    }

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.clearRecordedData();
     */
    clearRecordedData() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.stop(this.clearRecordedDataCB);
        }
        this.clearRecordedDataCB();
    }

    clearRecordedDataCB() {
        this.arrayOfBlobs = [];
        this.mediaRecorder = null;
        this.timestamps = [];
        this.blob = null;
        this.allStates = [];
    }

    /**
     * Access to native MediaRecorder API
     * @method
     * @memberof MediaStreamRecorder
     * @instance
     * @example
     * var internal = recorder.getInternalRecorder();
     * internal.ondataavailable = function() {}; // override
     * internal.stream, internal.onpause, internal.onstop, etc.
     * @returns {Object} Returns internal recording object.
     */
    getInternalRecorder() {
        return this.mediaRecorder;
    }

    /**
     * Check if Media stream is active
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * var isMediaStreamActive = recorder.isMediaStreamActive()
     * @returns {Boolean}
     */
    isMediaStreamActive() {
        if ('active' in this.mediaStream) {
            if (!this.mediaStream.active) {
                return false;
            }
        } else if ('ended' in this.mediaStream) { // old hack
            if (this.mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get MediaRecorder readonly state.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * var state = recorder.getState();
     * @returns {String} Returns recording state.
     */
    getState() {
        if (!this.mediaRecorder) {
            return 'inactive';
        }
        return this.mediaRecorder.state || 'inactive';
    };

    /**
     * Get MediaRecorder all recording states.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * var allStates = recorder.getAllStates();
     * @returns {Array} Returns all recording states
     */
    getAllStates() {
        return allStates;
    };


    // this method checks if media stream is stopped
    // or if any track is ended.
    looper() {
        if (!this.mediaRecorder || this.config.checkForInactiveTracks === false) {
            return;
        }
        if (this.isMediaStreamActive() === false) {
            if (!this.config.disableLogs) {
                console.log('MediaStream seems stopped.');
            }
            this.stop();
            return;
        }
        setTimeout(this.looper, 1000); // check every second
    }
}