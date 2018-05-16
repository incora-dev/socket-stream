function convertFloat32ToInt16(buffer) {
    l = buffer.length;
    buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l])*0x7FFF;
    }
    return buf.buffer;
}

function SocketStream(wsUrl) {
    this.socket = io(wsUrl);

    this.isStreaming = false;
    this.deviceRequested = false;

    this.startStreaming = function (type, target) {
        this.isStreaming = true;
        this.createStream();
        ss(this.socket).emit(type, this.stream, { target });
    }

    this.stopStreaming = function () {
        this.isStreaming = false;
        this.stream.end();
    }

    this.createStream = function () {
        this.stream = ss.createStream();
    }
    this.createStream();

    this.send = function (data) {
        if (this.isStreaming) this.stream.write(new ss.Buffer(convertFloat32ToInt16(data)));
    }

    this.requestDevice = function () {

            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            navigator.getUserMedia = ( navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);
            window.URL = window.URL || window.webkitURL;

            if(!window.hasOwnProperty('audio_context')){
                window.audio_context = new AudioContext;
            }


            navigator.getUserMedia({audio: true}, (stream) => {
                const bufferLen = 4096;
                this.source = window.audio_context.createMediaStreamSource(stream);
                this.context = this.source.context;
                const node = (this.context.createScriptProcessor ||
                    this.context.createJavaScriptNode).call(this.context,
                    bufferLen, 2, 2);


                node.onaudioprocess = (e) => {
                    console.log('onaudio');
                    this.send(e.inputBuffer.getChannelData(0))
                };

                this.source.connect(node);
                node.connect(this.context.destination);
                this.deviceRequested = true;

            }, function(e) {

                console.log("An error occurred"); //Null if something goes wrong

            });

    }

    return this;
}

module.exports = SocketStream;