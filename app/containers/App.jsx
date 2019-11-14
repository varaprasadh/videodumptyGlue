import React, { Component } from 'react'
import styles from "./styles/app.css";
import finger from "./assets/pointing-right.svg";
import addicon from "./assets/add.png";
import ding_sound from "./assets/ding.mp3";


import Select from 'react-select';
import { toast } from 'react-toastify';
import { ipcRenderer } from 'electron';
import ProgressBar from './components/ProgressBar';
import fs from "fs";



export class App extends Component {
    
    constructor(props){
        super(props);
        this.state = {
            selected_video_type: {
                value: "mp4",
                label: '.mp4'
            },
            selected_audio_stream:{
                value:0,
                label:"no audio"
            },
            inputVideo: null,
            outputFolder: null,
            inputFrameFolder:null,
            op_width: "",
            op_height: "",
            op_video_name: "",
            dingEnabled: true,
            percent: 0,
            processing: false,
            ip_fps:'24',
            _audio_streams:[]
        }
    }
   componentDidMount(){
       ipcRenderer.on('got-metadata',(event,data)=>{
           

           let _parsedAudioStreams = data.audiostreams.map((stream, i) => ({
               label: `Audio Stream ${i+1}`,
               value: i + 1
           }));
           _parsedAudioStreams.push({
               label: "no audio",
               value: 0
           });
           console.log(data.fps);
           let _fps=Number(data.fps);
 
          this.setState({
              _audio_streams:_parsedAudioStreams,
              ip_fps:data.fps,
              selected_audio_stream:_parsedAudioStreams[0]
          });
       });
       ipcRenderer.on('got-frame-resolution',(event,res)=>{
           this.setState({
               op_height:`${res.height}`,
               op_width:`${res.width}`
           });
       });
        ipcRenderer.on('process-progress', (event, args) => {
            //change progress state
            console.log("progress", args);
            let progress = Math.ceil(args.percent);
            this.setState({
                percent: progress
            })

        })
        ipcRenderer.on('process-progress-done', (event) => {
            //hide progress and reset its state
            console.log("hide progress bar");
            if (this.state.dingEnabled) {
                this._ding.play();
            }
            this.setState({
                processing: false,
                percent: 100
            },()=>{
                setTimeout(()=>{
                    this.setState({
                        percent:0
                    })
                },200);
            });
            toast.success("process completed");
        })
   }

 normalize(min, max,val) {
    var delta = max - min;
    return (val - min) / delta;
}
  
   breakApart(){
      let {
             inputVideo ,
             outputFolder,
             inputFrameFolder,
             op_width,
             op_height,
             op_video_name, 
             ip_fps,
             selected_audio_stream,
             selected_video_type,
         } = this.state;

         let valid=(inputFrameFolder!=null&&op_width.trim()!=""&&op_height.trim()!=""&&outputFolder!=null&&op_video_name.trim()!="");
         if(valid){
             let obj={
                inputVideo:inputVideo && inputVideo.path||null,
                outputFolder:outputFolder,
                inputFrameFolder:inputFrameFolder.path,
                op_width,
                op_height,
                op_video_name,
                ip_fps:eval(ip_fps),
                selected_audio_stream,
                selected_video_type,
             }
             toast.success("processing...");
             this.setState({
                 processing:true
             })
             ipcRenderer.send('process-video',obj);

         }else{
             toast.error("check your inputs,can't be processed");
         }
     
        }

   resetApp(){
      this.setState({
          reset:true
      },()=>{
          setTimeout(()=>{
              this.setState({
                  reset:false
              },()=>{
                  this.setState(
                       {
                           selected_video_type: {
                               value: "mp4",
                               label: '.mp4'
                           },
                           selected_audio_stream: {
                               value: 0,
                               label: "no audio"
                           },
                           inputVideo: null,
                           outputFolder: null,
                           inputFrameFolder: null,
                           op_width: "",
                           op_height: "",
                           op_video_name: "",
                           dingEnabled: true,
                           percent: 0,
                           processing: false,
                           ip_fps: '24',
                           _audio_streams: []
                       }
                  )
              });
          },100)
      })
   }


   onWidthChange({target}){
      this.setState({
          op_width:target.value
      })
   }
   onHeightChange({target}){
     this.setState({
         op_height:target.value
     })
   }
  handleInputVideoFile(file){
      let _filename;
      let _path=file.path;
      if(_path.indexOf("\\")!=-1){
          _filename = file.path.split("\\").slice(0, -1).join("\\")
      }else{
          _filename = file.path.split("/").slice(0, -1).join("/")
      }
      this.setState({
          inputVideo:file,
          outputFolder: _filename
      });
      ipcRenderer.send('get-metadata',file.path);
  }
   handleInputFrameFolder(file){
        let frames=fs.readdirSync(file.path);
        console.log(frames);
        let isValidFolder=frames.find(frame=>/^\d{8}./.test(frame))
        console.log("isvaliud",isValidFolder);
        if(isValidFolder){
             let outputfilename = file.name + "-glued";
             this.setState({
                 inputFrameFolder: file,
                 op_video_name: outputfilename,

             });
             ipcRenderer.send('get-frame-resolution', file.path);
        }else{
            toast.error("no frames found on this folder");
        }
   }
   handleOutputFolder(file){
       this.setState({
           outputFolder:file.path
       })
   }
   setFps({target}){
      let value=target.value;
      if(Number(value)!=NaN || value=='/'){
         this.setState({
             ip_fps: target.value
         });
      }
      return 
   }
   handleAudioStreamChange(option){
       this.setState({
           selected_audio_stream:option
       })
   }

   handleVideoTypeChange(option){
       this.setState({
           selected_video_type:option
       })
   }
   handleOutputVideoName({target}){
     this.setState({
         op_video_name:target.value
     })
   }
    cancelOperation() {
        ipcRenderer.send('kill-process');
        this.setState({
            percent: 0,
            processing: false
        });
    }
    render() {
        const op_vid_options = [{
                value: "mp4",
                label: '.mp4'
            },
            {
                value: "mkv",
                label: '.mkv'
            },
            {
                value: "avi",
                label: '.avi'
            },
        ]
        
        let audio_streams=this.state._audio_streams;
         let {
             inputVideo ,
             outputFolder,
             inputFrameFolder,
             op_width,
             op_height,
             op_video_name,
             dingEnabled,
             percent,
             processing,
             ip_fps,
             selected_audio_stream
         } = this.state;
         let isValidFps = ip_fps.split('/')[0] / (ip_fps.split('/')[1]||1);
         let buttonEnabled = (inputFrameFolder != null && op_width.trim() != "" && op_height.trim() != "" && outputFolder != null && op_video_name.trim() != "" && isValidFps);

        return (
            !this.state.reset &&
            <div className={styles.app}>
                 <audio hidden src={ding_sound} ref={ding=>this._ding=ding}/>
                {
                    this.state.processing==true && <ProgressBar onCancel={this.cancelOperation.bind(this)} percent={this.state.percent}/>
                }
                  <div className={styles.row}>
                  <div className={`${styles.column} `}>
                     <DropZone 
                       title="SET INPUT VIDEO"
                       onDropFile={this.handleInputVideoFile.bind(this)}
                       defaultLabelText="No Input Video Set"
                       type="video"
                       />
                    </div>
                    <div>
                        <img src={addicon} alt="add icon" className={styles.img_finger}/>
                     
                    </div>
                    <div className={`${styles.column} `}>
                      <DropZone
                       title="SET INPUT FRAMES FOLDER"
                        onDropFile={this.handleInputFrameFolder.bind(this)}
                        type="folder"
                        defaultLabelText="No Frames Folder Set"
                       />
                    </div>
                    <div>
                        <img src={finger} alt="pointer" className={styles.img_finger}/>
                    </div>
                    <div className={`${styles.column} `}>
                      <DropZone
                       title="SET OUTPUT FOLDER"
                        onDropFile={this.handleOutputFolder.bind(this)}
                        type="folder"
                        defaultLabelText="No Output Folder Set"
                        destination_folder_name={this.state.outputFolder}
                       />
                    </div>
                 </div>
                 <div className={`${styles.row} ${styles.prefs_row}`}>
                     <div className={`${styles.column} ${styles._alignstart}`}>
                          <div className={`${styles.__row} ${styles.strech} ${styles.space_between}`}>
                            <div className={styles.label}>FPS : </div>
                             <input 
                                type="text" 
                                placeholder="..."
                                value={this.state.ip_fps}
                                onChange={this.setFps.bind(this)}
                                className={`${styles.op_box} ${styles.width_large}`}/>
                          </div>
                          <div className={`${styles.__row} ${styles.strech} ${styles.space_between} ${styles.margintop20}`}>
                               <div className={styles.label}>Audio : </div>
                               <div className={`${styles.width_large} ${styles.width220h}`}>
                                    <Select 
                                    value={this.state.selected_audio_stream}
                                    onChange={this.handleAudioStreamChange.bind(this)}
                                    options={audio_streams} />
                                </div>
                          </div>
                     </div>
                     <div className={styles.column}>
                          <div className={styles.__row}>
                              <div className={styles.label}>Size : </div>
                              <div className={styles.res_box_wrapper}>
                                <input type="text" 
                                    className={styles.res_box}
                                    placeholder="Width"
                                    value={this.state.op_width}
                                    onChange={this.onWidthChange.bind(this)}
                                />
                                <div className={styles.res_box_cross}>X</div>
                                <input type="text"
                                    className={styles.res_box}
                                    placeholder="Height"
                                    value={this.state.op_height}
                                    onChange={this.onHeightChange.bind(this)}
                                />
                              </div>
                          </div>
                     </div>
                     <div className={`${styles.column} ${styles.prefs}`}>
                        <div className={styles.__row}>
                                
                                <input type="text" 
                                placeholder="..."
                                value={this.state.op_video_name}
                                onChange={this.handleOutputVideoName.bind(this)}
                                className={styles.op_box}/>

                                <div className={styles.select_box}>
                                    <Select 
                                    value={this.state.selected_video_type}
                                    onChange={this.handleVideoTypeChange.bind(this)}
                                    options={op_vid_options} />
                                </div>

                        </div>
                     </div>
                 </div>
                 <div className={`${styles.row} ${styles.alignbottom}`}>
                      <div 
                        className={`${styles.btn} ${styles.reset}`}
                        onClick={this.resetApp.bind(this)}
                        >
                          RESET
                      </div>
                      <div className={styles.notif}>
                           <input className={styles.styled_checkbox} 
                           checked={this.state.dingEnabled}
                           onChange={({target:{checked}})=>this.setState({dingEnabled:checked})}
                           id="styled-checkbox-1" type="checkbox" value="value1"/>
                            <label htmlFor="styled-checkbox-1">Ding when done</label>
                      </div>
                      <div 
                         className={`${styles.btn} ${styles.break} ${buttonEnabled?"":styles.disabled}`}
                         onClick={this.breakApart.bind(this)}
                         >
                         GLUE TOGETHER
                      </div>
                 </div>  
            </div>
        )
    }
}

class DropZone extends Component{
 
    constructor(props){
        super(props);
        this.state={
            dragging:false,
            defaultLabelText: this.props.defaultLabelText
        }
        this.propagateFile = this.propagateFile.bind(this);
    }
   showDropOverlay(e){
      e.preventDefault()
      e.stopPropagation()
      this.setState({
          dragging:true
      })
   }
   hideDropOverlay(e){
       e.preventDefault()
       e.stopPropagation()
     this.setState({
         dragging: false,
     });
   }
   onDrop(event){
      
    this.hideDropOverlay(event);
    let file= event.dataTransfer.files[0];
    this.propagateFile(file);
   }
   propagateFile(file){
        let {name,path,type}=file;
    if(this.props.type==="video"){
        if (/video/.test(type)){
            this.setState({
                defaultLabelText: name
            });
            this.props.onDropFile(file);
        }else{
            toast.error("choose video file");
        }
       
    }else if(this.props.type==="folder"){
        console.log("debug",type);
        let _path=path
        if(path.indexOf("\\")!=-1){
            _path=path.split('\\').pop() + "/"
        }else{
            _path = path.split('/').pop() + "/"
        }
        if(type.trim()===""){
            this.setState({
                defaultLabelText: _path
            });
            this.props.onDropFile(file);
        }else{
            toast.error("choose a directory");
        }
    }
   }
    
     handleUploadClick(){
         let {type}=this.props;
         if(/video/.test(type)){
             this._fileInput.click()
         }else if(/folder/.test(type)){
             this._folderInput.click();
         }
     }
     handleFileChange({target}){
        let files=target.files;
        console.log(files);
        this.propagateFile(files[0]);
     }
    getTitle(destination_folder_name,defaultLabelText){
        let fileTitle = defaultLabelText
         if (destination_folder_name != null) {
             let _path = destination_folder_name;
             if ((_path.indexOf('\\') != -1)) {
                 fileTitle = _path.split('\\').slice(-1) + "/"
             } else {
                 fileTitle = _path.split("/").slice(-1) + "/"
             }
         }
         return fileTitle
     }
    render(){

        let fileTitle = this.getTitle(this.props.destination_folder_name,this.state.defaultLabelText);
    
      return(
          <div className={`${styles.column} ${styles.drop_container_wrapper}`}
            onDragOver={ this.showDropOverlay.bind(this)}
            onDragStart={this.showDropOverlay.bind(this)}
            onDragLeave={this.hideDropOverlay.bind(this)}
            onDrop={this.onDrop.bind(this)}
            onClick={this.handleUploadClick.bind(this)}
            >
            
            <input type="file"  hidden
                 ref={_ip=>this._folderInput=_ip}
                 directory="" webkitdirectory=""
                 hidden
                 onChange={this.handleFileChange.bind(this)}
            />  
            <input type="file"  hidden
                 ref={_ip=>this._fileInput=_ip}
                 hidden
                 accept="video/*"
                 onChange={this.handleFileChange.bind(this)}
            />  

          
            <div className={styles.alignstart}>
                {!this.state.dragging==true?(
                <div className={`${styles.drop_container}`}
                >
                    <div>{this.props.title}</div>
                </div>)
                :
                (<div className={`${styles.drop_overlay}`}
                    onDragOver={ this.showDropOverlay.bind(this)}
                    onDragStart={this.showDropOverlay.bind(this)}
                    onDragLeave={this.hideDropOverlay.bind(this)}
                    onDrop={this.onDrop.bind(this)}
                >
                    <img src={require("./assets/download.png")} alt="drop icon"/>
                    <div>DROP HERE</div>
                </div>)
                }
                <div className={styles.videoTitle}>
                    {
                          fileTitle.replace("//","/")
                    }
                </div>
            </div>
        </div>
      )
  }
    
}

export default App
