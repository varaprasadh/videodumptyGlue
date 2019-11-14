/* eslint global-require: off */

/**
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';
import getDimensions from "./ffmpegHandlers/getDimensions";
import getStreams from "./ffmpegHandlers/getStreams";
import glueVideo from "./ffmpegHandlers/glueVideo";

import fs from 'fs';
import path from 'path';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};


app.on('window-all-closed', () => {

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1300,
    height: 700,
    webPreferences:{
      devTools:false
    }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);


  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.setMenu(null);

  ipcMain.on('get-metadata',(event,path)=>{
        getStreams(path).then(data=>{
          event.sender.send('got-metadata',data);
        }).catch(err=>{
          event.sender.send('error',null)
        })
  });
  ipcMain.on('get-frame-resolution',(event,_path)=>{
    //make a function 
     var files = fs.readdirSync(_path);
     let _frame=files.filter(file=>/^\d{8}\.(jpg|png)$/.test(file))[0];
     if(_frame){
        console.log("trynthis", _frame);
        getDimensions(path.join(_path, _frame)).then(res => {
          event.sender.send('got-frame-resolution', res)
        }).catch(err => {
          event.sender.send('error', null)
        });
     }else{
        event.sender.send('error', null)
     }
     
  });
  ipcMain.on('process-video',(event,data)=>{
    console.log(data);
    let process = glueVideo(data);
     process.on('progress', (progress) => {
       event.sender.send('process-progress', progress)
     });
     process.once('end', () => {
       event.sender.send("process-progress-done");
     });
     process.run();
      ipcMain.on('kill-process', (event) => {
        if (process) {
          try {
            process.kill();
          } catch (err) {
            //handle error : not needed
          }
        }
      });
      process.on('error',()=>{
        // event.sender.send('')
      })
  });
  
});
