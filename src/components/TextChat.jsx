import React, { useState, useEffect } from "react";

function TextChat({sendChannel, receiveChannel, chatting, looking, strangerDisconnected, handleCloseChat, handleStartTextChat, handleStartVideoChat, startChat}) {
    const [log, setLog] = useState([]);
    const [chat, setChat] = useState("");
    const [showStopBtn, setShowStopBtn] = useState(true);
    const [showConfirmBtn, setShowConfirmBtn] = useState(false);
    const [showNextBtn, setShowNextBtn] = useState(false);
    const [youDisconnected, setYouDisconnected] = useState(false);

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

    const handleStopBtn = () => {
      setShowStopBtn(false); 
      setShowConfirmBtn(true);
    }

    const handleConfirmBtn = () => {
      setShowConfirmBtn(false);
      setShowNextBtn(true);
      handleCloseChat();
      
      if(!looking) {
        setYouDisconnected(true);
      }
    }

    const handleNextBtn = () => {
      setShowNextBtn(false);
      setShowStopBtn(true); 
      setYouDisconnected(false);
      setLog([]);
      console.log(startChat);
      if(startChat === "video chat") {
        handleStartVideoChat();
      }
      else if(startChat === "text chat") {
        handleStartTextChat();
      }
      
    }

    const handleOnEnter = (e) => {
      if(e.keyCode == 13 && e.shiftKey == false) {
        e.preventDefault();
        handleSend();
      }
    }

    useEffect(() => {
      if(strangerDisconnected) {
        setShowStopBtn(false); 
        setShowConfirmBtn(false);
        setShowNextBtn(true);
      }
    }, [strangerDisconnected])

    // const handleOnEsc = (e) => {
    //   console.log('keyboard event invoked', buttonShown);
    //   if(e.keyCode == 27 && e.shiftKey == false) {
    //     console.log('esc pressed');
        
    //   }
    // }

    return (
      <>
          <div className="text-chat-container">
              <div className="text-log"> 
                {(!(sendChannel instanceof RTCDataChannel) && <p> Connecting to server... </p>)}
                {!looking && !chatting && !strangerDisconnected && !youDisconnected && (<p> Start a conversation by clicking on the 'Next' button. </p>)}
                {chatting &&  (<p> You are now chatting with a stranger. Say hi! </p>)}
                {looking && (<p>  Looking for strangers you can chat with. Hang on. </p>)}

                {log.map((chat, index) =>
                  <p key={index} className={chat.sender == "you" ? "chat-you" : "chat-stranger"}>
                    {chat.content}
                  </p>
                )}

              {strangerDisconnected && <p>  Stranger has disconnected. </p>}
              {youDisconnected && <p>  You have disconnected. </p>}
              </div>
              <div className="text-chat-actions"> 
                {showStopBtn && <button className="stop-btn" onClick={handleStopBtn}> Stop <br /> (Esc)</button>}
                {showConfirmBtn && <button className="confirm-btn" onClick={handleConfirmBtn}> Really? <br /> (Esc)</button>}
                {showNextBtn && <button className="next-btn" onClick={handleNextBtn}> Next <br /> (Esc)</button>}
                <textarea value={chat} name="" id="" onChange={e => setChat(e.target.value)} onKeyDown={handleOnEnter}></textarea>
                <button className="send-btn" onClick={handleSend}> Send </button>
              </div>
          </div>
      </>
    )
  }
  
  export default TextChat
  