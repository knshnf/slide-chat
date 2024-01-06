import Navbar from './Navbar.jsx'
import Landing from './Landing.jsx'
import TextChat from './TextChat.jsx'
import VideoChat from './VideoChat.jsx'
import React, { useState, useEffect, useRef } from "react";


let localStream;
let remoteStream;
let localPeerConnection;
let sendChannel;
let receiveChannel;
let channelCuid;

const servers = { 'iceServers': [] };
const URL_WEB_SOCKET = 'ws://localhost:8090/ws';

// Contraints for RTC connection
const pcConstraints = {
  'optional': [
    { 'DtlsSrtpKeyAgreement': true },
  ],
};

function App() {
  // STATES
  const [sendMessage, setSendMessage] = useState('');
  const [userId, setUserId] = useState(Math.floor(Math.random() * 1000000));
  const [sendChannelState, setSendChannelState] = useState(false);
  const [receiveChannelState, setReceiveChannelState] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [startChat, setStartChat] = useState("none");
  const [strangerDisconnected, setstrangerDisconnected] = useState(false); 

  // Reference for web socket
  const ws = useRef(null);

  // Connect to web socket
  useEffect(() => {
    const wsClient = new WebSocket(URL_WEB_SOCKET);
    ws.current = wsClient;

    // wsClient.onopen = () => {
    //   console.log('ws opened');
    //   setStartButtonDisabled(false)
    // };

    // wsClient.onclose = () => console.log('ws closed');
  }, []);

  // Receive messages from the web socket server
  useEffect(() => {
    ws.current.onmessage = (message) => {
      console.log('ws message received', message.data);
      const parsedMessage = JSON.parse(message.data);
      switch (parsedMessage.type) {
        case 'joined':
          {
            const body = parsedMessage.body;
            channelCuid = body[1]
            console.log('interests of this channel', body);
            break;
          }
        // Receive an offer
        case 'offer_sdp_received':
          {
            console.log('offer_sdp_received');
            const offer = parsedMessage.body;
            onAnswer(offer);
            break;
          }
        // Receive an answer
        case 'answer_sdp_received':
          {
            gotRemoteDescription(parsedMessage.body);
            break;
          }
        case 'quit':
          {
            channelCuid = null;
            setstrangerDisconnected(true);
            break;
          }
        default:
          break;
      }
    };
  }, [channelCuid, userId]);

  useEffect(() => {
    if(sendChannelState && receiveChannelState && channelCuid != null) {
      setChatting(true);
    }
    else {
      setChatting(false);
    }
  }, [sendChannelState, receiveChannelState, channelCuid])


  const handleStartChat = async (data) => {
    setStartChat(data);
  }

  const handleStartTextChat = () => {
    console.log('handleStartTextChat invoked');
    setStartChat("text chat");
    join('text');
    callOnClick();
  }

  const handleStartVideoChat = async () => {
    setStartChat("video chat");
    await setupDevice();
    join('video');
    callOnClick();
  }

  // Send message to the web socket server
    const sendWsMessage = (type, body) => {
      console.log('sendWsMessage invoked', type, body);

      if(ws.current) {
        ws.current.send(JSON.stringify({
          type,
          body,
        }));
      }
    };

  const setupDevice = async () => {
    return new Promise((resolve, reject) => {
      console.log('setupDevice invoked');
      navigator.getUserMedia({ audio: true, video: true }, (stream) => {
        // render local stream on DOM
        const localPlayer = document.getElementById('local-player');
        localPlayer.srcObject = stream;
        
        localStream = stream;
        console.log('assigned value to localStream', localStream);
        resolve();
      }, (error) => {
        console.error('getUserMedia error:', error);
        reject();
      });
    })
  };

  const join = (channelType) => {
    console.log('join invoked');
    let interests = [''];

    setstrangerDisconnected(false); 
    // Join a channel
    sendWsMessage('join', {
      userId,
      channelType,
      interests,
    });
  };


  // Send an offer
  const callOnClick = () => {
    console.log('callOnClick invoked');

    console.log('localstream on callonclick', localStream);


    if (localStream && localStream.getVideoTracks().length > 0) {
      console.log(`Using video device: ${localStream.getVideoTracks()[0].label}`);
    }
    if (localStream && localStream.getAudioTracks().length > 0) {
      console.log(`Using audio device: ${localStream.getAudioTracks()[0].label}`);
    }

    // Create connection
    console.log('new RTCPeerConnection for local');
    localPeerConnection = new RTCPeerConnection(servers, pcConstraints);

    // Ice candidate handler
    console.log('setup gotLocalIceCandidateOffer');
    localPeerConnection.onicecandidate = gotLocalIceCandidateOffer;

    // Handler for add stream
    console.log('setup gotRemoteStream');
    localPeerConnection.onaddstream = gotRemoteStream;

    // Create data channel
    createDataChannel();

    console.log('localPeerConnection.addStream invoked');
    if (localStream instanceof MediaStream) {
      localPeerConnection.addStream(localStream);
    } 

    // Create offer then set local description
    console.log('localPeerConnection.createOffer invoked');
    localPeerConnection.createOffer().then(gotLocalDescription);
  };

  // This function will run if this client was sent an offer. Sends an answer.
  const onAnswer = (offer) => {
    console.log('onAnswer invoked');

    if (localStream && localStream.getVideoTracks().length > 0) {
      console.log(`Using video device: ${localStream.getVideoTracks()[0].label}`);
    }
    if (localStream && localStream.getAudioTracks().length > 0) {
      console.log(`Using audio device: ${localStream.getAudioTracks()[0].label}`);
    }

    console.log('new RTCPeerConnection for local');
    localPeerConnection = new RTCPeerConnection(servers, pcConstraints);


    console.log('setup gotLocalIceCandidateAnswer');
    // Assign to onicecandidate what happens when ice candidates is received from peer
    localPeerConnection.onicecandidate = gotLocalIceCandidateAnswer;

    console.log('setup gotRemoteStream');
    // Assign to onicecandidate what happens when remote stream is received from peer
    localPeerConnection.onaddstream = gotRemoteStream;


    // Create channel for sending data
    createDataChannel();

    // Set the stream of this client to the stream of the connection
    console.log('localPeerConnection.addStream invoked');
    if (localStream instanceof MediaStream) {
      localPeerConnection.addStream(localStream);
    }

    // Set remote sdp to the received sdp from peer
    localPeerConnection.setRemoteDescription(offer);

    // Send local sdp to peer
    localPeerConnection.createAnswer().then(gotAnswerDescription);
  };

  const createDataChannel = () => {
    try {
      console.log('localPeerConnection.createDataChannel invoked');
      sendChannel = localPeerConnection.createDataChannel('sendDataChannel', { reliable: true });
    } catch (error) {
      log.error('localPeerConnection.createDataChannel failed', error);
    }

    console.log('setup handleSendChannelStateChange');
    sendChannel.onopen = handleSendChannelStateChange;
    sendChannel.onClose = handleSendChannelStateChange;

    console.log('setup localPeerConnection.ondatachannel');
    localPeerConnection.ondatachannel = gotReceiveChannel;
};

const closeDataChannel = () => {
  console.log('closeDataChannel invoked');
  sendChannel && sendChannel.close();
  receiveChannel && receiveChannel.close();
};

const gotLocalDescription = (offer) => {
  console.log('gotLocalDescription invoked:', offer);
  localPeerConnection.setLocalDescription(offer);
};

// Set local description to local sdp
  const gotAnswerDescription = (answer) => {
    console.log('gotAnswerDescription invoked:', answer);
    console.log(typeof(localPeerConnection));
    if(localPeerConnection instanceof RTCPeerConnection) {
      localPeerConnection.setLocalDescription(answer);
    }
  };

// Set remote description to peer sdp
  const gotRemoteDescription = (answer) => {
    console.log('gotRemoteDescription invoked:', answer);
    console.log(typeof(localPeerConnection));
    if(localPeerConnection instanceof RTCPeerConnection) {
      
      localPeerConnection.setRemoteDescription(answer);
      console.log('success set remote description');
    }
  };

  const gotRemoteStream = (event) => {
    console.log('gotRemoteStream invoked');
    const remotePlayer = document.getElementById('peer-player');
    remotePlayer.srcObject = event.stream;
    remoteStream = event.stream;
  };

  const gotLocalIceCandidateOffer = (event) => {
    console.log('gotLocalIceCandidateOffer invoked', event.candidate, localPeerConnection.localDescription);

    // gathering candidate finished, send complete sdp
    if (!event.candidate) {
      const offer = localPeerConnection.localDescription;
      sendWsMessage('send_offer', {
        channelCuid,
        userId,
        sdp: offer,
      });
    }
  };

  // Answer to an offer
  const gotLocalIceCandidateAnswer = (event) => {
    console.log('gotLocalIceCandidateAnswer invoked', event.candidate, localPeerConnection.localDescription);

    // gathering candidate finished, send complete sdp
    if (!event.candidate) {
      const answer = localPeerConnection.localDescription;
      sendWsMessage('send_answer', {
        channelCuid,
        userId,
        sdp: answer,
      });
    }
  };


  // TEXT CHAT
  const gotReceiveChannel = (event) => {
    console.log('gotReceiveChannel invoked');
    receiveChannel = event.channel;
    // Event handler for receiving message
    receiveChannel.onmessage = handleMessage;

    receiveChannel.onopen = handleReceiveChannelStateChange;
    receiveChannel.onclose = handleReceiveChannelStateChange;
  };



  const handleSendChannelStateChange = () => {
    const readyState = sendChannel.readyState;
    console.log('handleSendChannelStateChange invoked', readyState);
    if (readyState === 'open') {
      setSendChannelState(true);
    } else {
      ssetSendChannelState(false);
    }
  };

  const handleReceiveChannelStateChange = () => {
    const readyState = receiveChannel.readyState;
    console.log('handleReceiveChannelStateChange invoked', readyState);
    if (readyState === 'open') {
      setReceiveChannelState(true);
    } else {
      setReceiveChannelState(false);

      // Handle if peer quit
      if (channelCuid) {
        sendWsMessage('quit', {
          userId,
          channelCuid,
        });

        channelCuid = null;
        setstrangerDisconnected(true);
      }
    }
  };

  const sendOnClick = () => {
    log.debug('sendOnClick invoked', sendMessage);
    sendChannel.send(sendMessage);
    setSendMessage('');
  };
  
  const handleMessage = (event) => {
    console.log('handleMessage invoked', event.data);
    setReceiveMessage(event.data);
    // setSendMessage('');
  };

  const handleCloseChat = () => {
    console.log('handleCloseChat invoked')

    // localStream.getTracks().forEach(function(track) {
    //   track.stop();
    // });

    console.log('sending quit message')
    sendWsMessage('quit', {
      userId,
      channelCuid,
    });
    
    channelCuid = null;

    closeDataChannel();
    
  }

  return (
    <>
      <Navbar handleStartChat={handleStartChat} handleCloseChat={handleCloseChat}/>
      {startChat == "none" && <Landing handleStartTextChat={handleStartTextChat} handleStartVideoChat={handleStartVideoChat}/>}

      <div className="chat-container">
        {startChat == "video chat" && <VideoChat/>}
        {(startChat == "text chat" || startChat == "video chat") && 
        <TextChat sendChannel={sendChannel} receiveChannel={receiveChannel} chatting={chatting} strangerDisconnected={strangerDisconnected}/>}
      </div>

    </>
  )
}

export default App
 