import Navbar from './Navbar.jsx'
import Landing from './Landing.jsx'
import TextChat from './TextChat.jsx'
import React, { useState } from "react";


function App() {

  const [startChat, setStartChat] = useState("none");

  const handleStartChat = (data) => {
    setStartChat(data)}

  return (
    <>
      <Navbar handleStartChat={handleStartChat}/>
      {startChat == "none" && <Landing handleStartChat={handleStartChat}/>}
      {startChat == "text chat" && <TextChat/>}
    </>
  )
}

export default App
