import TextChat from './TextChat.jsx'
import React, { useState } from "react";

function VideoChat() {
    let localStream;
    
    const setupDevice = () => {
        console.log('setupDevice invoked');
        navigator.getUserMedia({ audio: true, video: true }, (stream) => {
            // render local stream on DOM
            const localPlayer = document.getElementById('localPlayer');
            localPlayer.srcObject = stream;
            localStream = stream;
        }, (error) => {
            console.error('getUserMedia error:', error);
        });
    };

    setupDevice()

    return (
      <>
        <div className="video-chat-container">
          <div className="media-container">
            <div className="media">
              <video playsInline autoPlay id='peerPlayer' className="videoPlayer"></video>
            </div>
            <div className="media">
              <video playsInline autoPlay id='localPlayer' className="videoPlayer"></video>
            </div>
          </div>
          <TextChat/>
        </div>
      </>
    )
  }
  
  export default VideoChat
  