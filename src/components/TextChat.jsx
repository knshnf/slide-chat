import React, { useState } from "react";

function TextChat() {
    return (
      <>
          <div className="text-chat-container">
              <div className="text-log"> 
                <p> Connecting to server... </p>
              </div>
              <div className="text-chat-actions"> 
                  <button className="next-btn"> Next </button>
                  <textarea name="" id=""></textarea>
                  <button className="send-btn"> Send </button>
              </div>
          </div>
      </>
    )
  }
  
  export default TextChat
  