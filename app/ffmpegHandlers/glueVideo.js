
const {
    FFMpegProgress
} = require('ffmpeg-progress-wrapper');
const fs=require('fs');

function glueVideo({
    inputFrameFolder, inputVideo, outputFolder, selected_audio_stream, selected_video_type, op_width, op_height, op_video_name, ip_fps
}) {  
     let op_ext=selected_video_type.value;
    var files = fs.readdirSync(inputFrameFolder);
    let _frame = files.filter(file => /^\d{8}\.(jpg|png)$/.test(file))[0];
    let frameExtension='png';
     if(_frame){
      frameExtension=_frame.split(".").pop();
     }
    //map frames to video and add required options
    let _temp_file=`${outputFolder}/${op_video_name}.${op_ext}`;
    let command_args = [
        "-f", "image2",
        "-i", `${inputFrameFolder}/%8d.${frameExtension}`,
        "-r", `${ip_fps}`
    ];
    //set audio stream
    let streamIndex = selected_audio_stream.value
    if (inputVideo != null && streamIndex != 0) {
        console.log("adding audio");
         command_args.push("-i", `${inputVideo}`); //append video stream from frames
          command_args.push('-c', "copy")
         command_args.push("-map", `1:a:${streamIndex-1}`) //add selected audio stream
    }else{
        command_args.push('-c',"copy")
    }
    command_args.push(
         "-map","0:v:0",
         "-pix_fmt", "yuv420p",
         "-vcodec", "libx264",
         "-crf", "17",
         '-vf', `scale='${op_width}':'${op_height}'`,
         "-shortest",
         "-y", `${_temp_file}`
    )
    console.log("command applied", command_args.join(' '));

    const process = new FFMpegProgress(command_args);
    return process;
}

module.exports = glueVideo;
