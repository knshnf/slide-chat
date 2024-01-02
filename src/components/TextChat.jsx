import React, { useState } from "react";

function TextChat({sendChannel, receiveChannel}) {
    const [log, setLog] = useState([])
    const [chat, setChat] = useState("") 

    // Event handler for receiving message
    if(receiveChannel instanceof RTCDataChannel) {
        receiveChannel.onmessage = (event) => {
            let message = event.data
            console.log('receive message invoked', message);
            let updatedLog = [...log, {content: message, sender: "stranger"},]
            setLog(updatedLog);
        };
    }
    
    // Handler for sending message
    const handleSend = () => {
        let trimmed = chat.trim();

        console.log('handleSend invoked', trimmed);

        if(trimmed == "") {
            return;
        }

        if(sendChannel instanceof RTCDataChannel) {
            console.log("sent");
            sendChannel.send(chat.trim());
        }
        let updatedLog = [...log, {content: trimmed, sender: "you"},]
        setLog(updatedLog);
        setChat("");
    }

    return (
      <>
          <div className="text-chat-container">
              <div className="text-log"> 
                {log.map((chat, index) =>
                  <p key={index} className={chat.sender == "you" ? "chat-you" : "chat-stranger"}>
                    {chat.content}
                  </p>
                )}
              </div>
              <div className="text-chat-actions"> 
                <button className="next-btn"> Next </button>
                <textarea value={chat} name="" id="" onChange={e => setChat(e.target.value)}></textarea>
                <button className="send-btn" onClick={handleSend}> Send </button>
              </div>
          </div>
      </>
    )
  }
  
  export default TextChat
  