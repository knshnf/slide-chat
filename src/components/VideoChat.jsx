import TextChat from './TextChat.jsx'
import React, { useState, useRef, useEffect } from "react";
import * as log from 'loglevel';

let localStream;
let remoteSream;
let localPeerConnection;
let sendChannel;
let receiveChannel;

const servers = { 'iceServers': [] };
    const URL_WEB_SOCKET = 'ws://localhost:8090/ws';

    // Contraints for RTC connection
    const pcConstraints = {
        'optional': [
            { 'DtlsSrtpKeyAgreement': true },
        ],
    };

function VideoChat() {
    // Temporary values
    const [startButtonDisabled, setStartButtonDisabled] = useState(true);
    const [joinButtonDisabled, setJoinButtonDisabled] = useState(true);
    const [callButtonDisabled, setCallButtonDisabled] = useState(true);
    const [hangupButtonDisabled, setHangupButtonDisabled] = useState(true);
    const [sendButtonDisabled, setSendButtonDisabled] = useState(true);
    const [sendMessage, setSendMessage] = useState('');
    const [receiveMessage, setReceiveMessage] = useState('');
    const [channelName, setChannelName] = useState('TEST');
    const [userId, setUserId] = useState(Math.floor(Math.random() * 1000000));
    const [renderLocalStream, setRenderLocalStream] = useState(false);
    
    // Reference for web socket
    const ws = useRef(null);

    // Connect to web socket every render
    useEffect(() => {
        const wsClient = new WebSocket(URL_WEB_SOCKET);
        ws.current = wsClient;

        wsClient.onopen = () => {
            console.log('ws opened');
            setStartButtonDisabled(false)
        };

        wsClient.onclose = () => console.log('ws closed');

        
        return () => {
            wsClient.close();
            
        };
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
                        console.log('users in this channel', body);
                        break;
                    }
                    // Receive an offer
                case 'offer_sdp_received':
                    {
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
                        break;
                    }
                default:
                    break;
            }
        };
    }, [channelName, userId]);

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

        const join = () => {
            console.log('join invoked');
    
            if (!channelName) {
                log.error('channelName is empty');
                alert('channelName is empty');
                return;
            }
    
            if (!userId) {
                log.error('userId is empty');
                alert('userId is empty');
                return;
            }
    
            setJoinButtonDisabled(true);
            setCallButtonDisabled(false);
            // Join a channel
            sendWsMessage('join', {
                channelName,
                userId,
            });
        };
    
        // Send an offer
        const callOnClick = () => {
            console.log('callOnClick invoked');
    
            setCallButtonDisabled(true);
            setHangupButtonDisabled(false);
    
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
            localPeerConnection.onaddstream = (event) => {
                console.log('gotRemoteStream invoked');
                const remotePlayer = document.getElementById('peerPlayer');
                remotePlayer.srcObject = event.stream;
            };
    
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

        const hangupOnClick = () => {
            console.log('hangupOnClick invoked');
            closeDataChannel();
            localPeerConnection.close();
            localPeerConnection = null;
            setHangupButtonDisabled(true);
            setCallButtonDisabled(false);
        };
    
        // This function will run if this client was sent an offer. Sends an answer.
        const onAnswer = (offer) => {
            console.log('onAnswer invoked');
            setCallButtonDisabled(true);
            setHangupButtonDisabled(false);
    
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
            setSendButtonDisabled(true);
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
                console.log('success set remote description');
                localPeerConnection.setRemoteDescription(answer);
            }
        };
    
        const gotRemoteStream = (event) => {
            console.log('gotRemoteStream invoked');
            const remotePlayer = document.getElementById('peerPlayer');
            remotePlayer.srcObject = event.stream;
        };
    
        const gotLocalIceCandidateOffer = (event) => {
            console.log('gotLocalIceCandidateOffer invoked', event.candidate, localPeerConnection.localDescription);
    
            if (!channelName) {
                log.error('channelName is empty');
                alert('channelName is empty');
                return;
            }
    
            if (!userId) {
                log.error('userId is empty');
                alert('userId is empty');
                return;
            }
    
            // gathering candidate finished, send complete sdp
            if (!event.candidate) {
                const offer = localPeerConnection.localDescription;
                sendWsMessage('send_offer', {
                    channelName,
                    userId,
                    sdp: offer,
                });
            }
        };
    
        // Answer to an offer
        const gotLocalIceCandidateAnswer = (event) => {
            console.log('gotLocalIceCandidateAnswer invoked', event.candidate, localPeerConnection.localDescription);
    
            if (!channelName) {
                log.error('channelName is empty');
                alert('channelName is empty');
                return;
            }
    
            if (!userId) {
                log.error('userId is empty');
                alert('userId is empty');
                return;
            }
    
            // gathering candidate finished, send complete sdp
            if (!event.candidate) {
                const answer = localPeerConnection.localDescription;
                sendWsMessage('send_answer', {
                    channelName,
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
    
        const handleMessage = (event) => {
            console.log('handleMessage invoked', event.data);
            setReceiveMessage(event.data);
            setSendMessage('');
        };
    
        const handleSendChannelStateChange = () => {
            const readyState = sendChannel.readyState;
            console.log('handleSendChannelStateChange invoked', readyState);
            if (readyState === 'open') {
                setSendButtonDisabled(false);
            } else {
                setSendButtonDisabled(true);
            }
        };
    
        
        const handleReceiveChannelStateChange = () => {
            const readyState = receiveChannel.readyState;
            console.log('handleReceiveChannelStateChange invoked', readyState);
        };

        




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
          {/* <TextChat /> */}
          <button onClick={setupDevice}>Start</button>
          <button onClick={join}>Join</button>
          <button onClick={callOnClick}>Call</button>
        </div>
      </>
    )
  }
  
  export default VideoChat
  