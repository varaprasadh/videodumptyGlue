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
                let fps=meta.streams[0].r_frame_rate.split('/')[0];
                resolve({audiostreams,fps});
            })
        }
    })
}


module.exports = getStreams;
