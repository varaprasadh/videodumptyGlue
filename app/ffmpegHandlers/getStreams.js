const FFmpeg = require('fluent-ffmpeg');
const FFMPEG_PATH = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked')
const FFPROBE_PATH = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked');

//get audiostreams and fps as metadata
function getStreams(path) {

    return new Promise((resolve, reject) => {
        if (!path) {
            reject("path not specified");
        } else {
            var command = FFmpeg({
                source: path
            });
            command.setFfmpegPath(FFMPEG_PATH);
            command.setFfprobePath(FFPROBE_PATH);
            command.ffprobe(0, (err, meta) => {
                if (err) reject(err);
                let audiostreams=meta.streams.filter(({codec_type})=>codec_type==="audio")
                let videos_stream=meta.streams.find(({codec_type})=>codec_type=='video');

                let fps = videos_stream.r_frame_rate;
                console.log(videos_stream);
                resolve({audiostreams,fps});
            })
        }
    })
}


module.exports = getStreams;
