'use client'

import React, { Component } from "react";
import 'context-filter-polyfill';

class Video extends Component {
  state = {
    streaming: false,
    view: {
      filter: 'original',
      zoomInScale: 1,
    },
    devices: [],
    selectedDevice: '',
  }

  videoRef = React.createRef();
  canvasRef = React.createRef();
  streamRef = React.createRef();
  animationReq = null;


  setFilter = (value) => {
    this.setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        filter: value,
      }
    }));
  }

  setZoomInScale = (value) => {
    this.setState(prev => ({
      ...prev,
      view: {
        ...prev.view,
        zoomInScale: prev.view.zoomInScale * value,
      }
    }));
  }
  
  getDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(item => item.kind === 'videoinput');
    console.log(devices);
    if (devices.length > 0) {
      this.setState(prev => ({
        ...prev,
        selectedDevice: videoDevices[0].deviceId,
        devices: videoDevices,
      }));
    }
  }

  selectDevice = e => {
    this.setState(prev => ({
      ...prev,
      selectedDevice: e.target.value,
    }))
  }

  catchStream = async (deviceId) => {
    if (deviceId === '') return;

    const constraints = {
      video: {
        deviceId: { exact: deviceId }
      }
    };

    try{
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.streamRef.current = stream;
      
      if (this.videoRef.current) {
        this.videoRef.current.srcObject = stream;
        this.videoRef.current.play();
      }
    } catch(err) {
      console.log('error keys:', Object.keys(err));
      console.log(err);
    }
  }

  stopStream = () => {
    this.streamRef.current?.getTracks().forEach(track => track.stop());
    this.streamRef.current = null;
    this.videoRef.current.srcObject = null;
    this.animationReq = requestAnimationFrame(this.drawToCanvas);
    cancelAnimationFrame(this.animationReq);
  }

  drawToCanvas = () => {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    switch (this.state.view.filter) {
      case 'grayscale(100%)':
        ctx.filter = 'grayscale(100%)';
        break;
      case 'blur(4px)':  
        ctx.filter = 'blur(4px)';
        break;
      default:
        ctx.filter = 'none';
    }

    const newWidth = this.canvasRef.current.width * this.state.view.zoomInScale;
    const newHeight = this.canvasRef.current.height * this.state.view.zoomInScale;
    const dx = (this.canvasRef.current.width - newWidth) / 2;
    const dy = (this.canvasRef.current.height - newHeight) / 2;

          
    ctx.drawImage(
      this.videoRef.current,
      dx,
      dy, 
      newWidth,
      newHeight,
    );

    this.animationReq = requestAnimationFrame(this.drawToCanvas);
  }


  componentDidMount = () => {
    this.getDevices();
  }

  componentDidUpdate = (_, prevStates) => {
    if (prevStates.streaming !== this.state.streaming){
      if (this.state.streaming){
        this.catchStream(this.state.selectedDevice);
        this.drawToCanvas();
      } 
      else this.stopStream();
    }
    
    if (prevStates.selectedDevice !== this.state.selectedDevice){
      this.stopStream();

      if (this.state.streaming){
        this.catchStream(this.state.selectedDevice);
        this.drawToCanvas();
      }
    }
    
    if (
      prevStates.view.filter !== this.state.view.filter ||
      prevStates.view.zoomInScale !== this.state.view.zoomInScale
    ) {
      this.drawToCanvas();
    }
  }

  componentWillUnmount = () => {
    this.stopStream();
  }


  downloadImage = () => {
    // Create new canvas and draw current frame
    const canvas = this.canvasRef.current;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    offCanvas.style.filter = this.state.view.filter;
    const offCtx = offCanvas.getContext("2d");
    offCtx.drawImage(canvas, 0, 0);
    
    // Draw watermark and download
    const watermark = new Image();
    watermark.src = "/logo.png";
    watermark.onload = () => {
      const width = 200; 
      const height = 70; 
      offCtx.globalAlpha = 0.5;
      offCtx.drawImage(
        watermark,
        offCanvas.width - width - 20,
        offCanvas.height - height - 20,
        width,
        height
      );

      const link = document.createElement("a");  
      link.href = offCanvas.toDataURL("image/png");
      link.download = "canvas-image.png";
      link.click();

    }
  };
  

  render = () => (
    <div>
      <video
        ref={this.videoRef}
        autoPlay 
        playsInline 
        muted
        style={{display: 'none'}}
      />
      <canvas
        width='700'
        height='500'
        ref={this.canvasRef}
        style={{ 
          border: '5px black solid',
          maxWidth: '90vw',
        }}
      />
      <div>
        <button
          onClick={() => this.setState(prev => ({...prev, streaming: !prev.streaming}))}
        >
          {this.state.streaming ? 'release stream' : 'start stream'}
        </button>
        {
          this.state.streaming
          ?
          <>
            <select
              value={this.state.selectedDevice}
              onChange={this.selectDevice}
            >
              {this.state.devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
            <div>
              <button onClick={() => this.setZoomInScale(1.1)}>zoom in</button>
              <button onClick={() => this.setZoomInScale(0.9)}>zoom out</button>
            </div>
            <div>
              <button onClick={() => this.setFilter('none')}>original</button>
              <button onClick={() => this.setFilter('grayscale(100%)')}>grayscale</button>
              <button onClick={() => this.setFilter('blur(4px)')}>blur</button>
            </div>
            <div>
              <button onClick={this.downloadImage}>save</button>
            </div>
          </>
          : null
        }
      </div>
    </div>
  );
}

export default Video;




// 'use client'

// import { useEffect, useRef, useState } from "react";

// const Video = () => {
//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const streamRef = useRef(null);

//   const [streaming, setStreaming] = useState(true);
//   const [view, setView] = useState({
//     filter: 'original',
//     zoomInScale: 1 
//   });

//   useEffect(() => {
//     const constraints = {
//       audio: false,
//       video: true
//     };

//     const catchStream = async () => {
//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       streamRef.current = stream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.play();
//       }
//     }

//     const stopStream = () => {
//       streamRef.current?.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//       videoRef.current.srcObject = null;
//     }

//     if (streaming) catchStream();
//     else stopStream();

    
//   }, [streaming])


//   useEffect(() => {
//     const ctx = canvasRef.current.getContext('2d');

//     const drawToCanvas = () => {
//       ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
//       switch (view.filter) {
//         case 'grayscale':
//           ctx.filter = 'grayscale(100%)';
//           break;
//         case 'blur':
//           ctx.filter = 'blur(4px)';
//           break;
//         default:
//           ctx.filter = 'none';
//       }
            
//       ctx.drawImage(
//         videoRef.current,
//         0,
//         0, 
//         canvasRef.current.width * view.zoomInScale,
//         canvasRef.current.height * view.zoomInScale,
//       );

//       requestAnimationFrame(drawToCanvas);
//     }
//     drawToCanvas();

//     return () => cancelAnimationFrame(drawToCanvas);
//   }, [view])

//   const downloadImage = () => {
//     // Create new canvas and draw current frame
//     const canvas = canvasRef.current;
//     const offCanvas = document.createElement("canvas");
//     offCanvas.width = canvas.width;
//     offCanvas.height = canvas.height;
//     const offCtx = offCanvas.getContext("2d");
//     offCtx.drawImage(canvas, 0, 0);
    
//     // Draw watermark and download
//     const watermark = new Image();
//     watermark.src = "/logo.png";
//     watermark.onload = () => {
//       const width = 200; 
//       const height = 70; 
//       offCtx.globalAlpha = 0.5;
//       offCtx.drawImage(
//         watermark,
//         offCanvas.width - width - 20,
//         offCanvas.height - height - 20,
//         width,
//         height
//       );

//       const link = document.createElement("a");  
//       link.href = offCanvas.toDataURL("image/png");
//       link.download = "canvas-image.png";
//       link.click();

//     }
//   };
  

//   return (
//     <div>
//       <video ref={videoRef} style={{display: 'none'}}/>
//       <canvas width='700' height='500' ref={canvasRef} style={{ border: '5px, black, solid'}}/>
//       <div>
//         <button onClick={() => setStreaming(!streaming)}>{streaming ? 'release stream' : 'start stream'}</button>
//         {
//           streaming
//           ?
//           <>
//             <div>
//               <button onClick={() => setView(prev => ({ ...prev, zoomInScale: prev.zoomInScale * 1.1 }))}>zoom in</button>
//               <button onClick={() => setView(prev => ({ ...prev, zoomInScale: prev.zoomInScale * 0.9 }))}>zoom out</button>
//             </div>
//             <div>
//               <button onClick={() => setView(prev => ({...prev, filter: 'original'}))}>original</button>
//               <button onClick={() => setView(prev => ({...prev, filter: 'grayscale'}))}>grayscale</button>
//               <button onClick={() => setView(prev => ({...prev, filter: 'blur'}))}>blur</button>
//             </div>
//             <div>
//               <button onClick={downloadImage}> save</button>
//             </div>
//           </>
//           : null
//         }
//       </div>
//     </div>
//   );
// }

// export default Video;
