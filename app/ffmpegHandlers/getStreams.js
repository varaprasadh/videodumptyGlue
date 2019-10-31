const FFmpeg = require('fluent-ffmpeg');

//get audiostreams and fps as metadata
function getStreams(path) {

    return new Promise((resolve, reject) => {
        if (!path) {
            reject("path not specified");
        } else {
            var command = FFmpeg({
                source: path
            });
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
