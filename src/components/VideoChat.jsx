import TextChat from './TextChat.jsx'
import React, { useState, useRef, useEffect } from "react";
import * as log from 'loglevel';

function VideoChat() {

  const hangupOnClick = () => {
    console.log('hangupOnClick invoked');
    closeDataChannel();
    localPeerConnection.close();
    localPeerConnection = null;
    setHangupButtonDisabled(true);
    setCallButtonDisabled(false);
  };
    
    return (
      <>
        <div className="video-chat-container">
          <div className="media-container">
            <div className="media">
              <video playsInline autoPlay id='peer-player' className="video-player"></video>
            </div>
            <div className="media">
              <video playsInline autoPlay id='local-player' className="video-player"></video>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  export default VideoChat
  