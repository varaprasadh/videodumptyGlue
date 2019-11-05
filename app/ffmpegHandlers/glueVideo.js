const fluentFFmpeg=require('fluent-ffmpeg');
const path=require('path')
const fs=require('fs');
const FFMPEG_PATH = require('ffmpeg-static').path.replace('app.asar', 'app.asar.unpacked')
const FFPROBE_PATH = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')

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
    let _temp_file=path.join(`${outputFolder}`,`${op_video_name}.${op_ext}`);
    console.log("temp file name",_temp_file);
    let command_args = [`-r ${ip_fps}`];
    //set audio stream
    let streamIndex = selected_audio_stream.value;
    let aux_inputs=[];
    if (inputVideo != null && streamIndex != 0) {
        console.log("adding audio");
          aux_inputs.push(`${inputVideo}`); //append video stream from frames
        
    }
  
    command_args.push(
         "-map 0:v:0",
         "-pix_fmt yuv420p",
         "-vcodec libx264",
         "-crf 17",
         `-vf scale='${op_width}':'${op_height}'`,
         "-shortest",
    );
    console.log("command applied", command_args.join(' '));
    const process=fluentFFmpeg();
    
    process.setFfmpegPath(FFMPEG_PATH);
    process.setFfprobePath(FFPROBE_PATH);

<<<<<<< HEAD
    process.input(path.join(`${inputFrameFolder}`,`%8d.${frameExtension}`));
    process.addInputOptions([
        "-f image2"
    ])
    if(aux_inputs.length){
        process.addInput(aux_inputs[0]);
         
        process.addOption("-c copy");
        process.addOption(`-map 1:a:${streamIndex-1}`); //add selected audio stream
    }else{
        process.addOption("-c copy");
    }
    process.addOptions(command_args);
    process.output(_temp_file);
     
=======
    const process = new FFMpegProgress(command_args,{
        cmd:FFMPEG_PATH
    });
>>>>>>> fbaffaa85f30aa5620951813c96c5f23630c0bce
    return process;

}

module.exports = glueVideo;
