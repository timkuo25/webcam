'use client'

import { useEffect, useRef, useState } from "react";

const Video = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [streaming, setStreaming] = useState(true);
  const [view, setView] = useState({
    filter: 'original',
    zoomInScale: 1 
  });

  useEffect(() => {
    const constraints = {
      audio: false,
      video: true
    };

    const catchStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }

    const stopStream = () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      videoRef.current.srcObject = null;
    }

    if (streaming) catchStream();
    else stopStream();

    
  }, [streaming])


  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');

    const drawToCanvas = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      switch (view.filter) {
        case 'grayscale':
          ctx.filter = 'grayscale(100%)';
          break;
        case 'blur':
          ctx.filter = 'blur(4px)';
          break;
        default:
          ctx.filter = 'none';
      }
            
      ctx.drawImage(
        videoRef.current,
        0,
        0, 
        canvasRef.current.width * view.zoomInScale,
        canvasRef.current.height * view.zoomInScale,
      );

      requestAnimationFrame(drawToCanvas);
    }
    drawToCanvas();

    return () => cancelAnimationFrame(drawToCanvas);
  }, [view])

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");

    link.href = canvas.toDataURL("image/png");
    link.download = "canvas-image.png";
    link.click();
  };
  

  return (
    <div>
      <video ref={videoRef} style={{display: 'none'}}/>
      <canvas width='700' height='500' ref={canvasRef} style={{ border: '5px, black, solid'}}/>
      <div>
        <button onClick={() => setStreaming(!streaming)}>{streaming ? 'release stream' : 'start stream'}</button>
        {
          streaming
          ?
          <>
            <div>
              <button onClick={() => setView(prev => ({ ...prev, zoomInScale: prev.zoomInScale * 1.1 }))}>zoom in</button>
              <button onClick={() => setView(prev => ({ ...prev, zoomInScale: prev.zoomInScale * 0.9 }))}>zoom out</button>
            </div>
            <div>
              <button onClick={() => setView(prev => ({...prev, filter: 'original'}))}>original</button>
              <button onClick={() => setView(prev => ({...prev, filter: 'grayscale'}))}>grayscale</button>
              <button onClick={() => setView(prev => ({...prev, filter: 'blur'}))}>blur</button>
            </div>
            <div>
              <button onClick={downloadImage}> save</button>
            </div>
          </>
          : null
        }
      </div>
    </div>
  );
}

export default Video;