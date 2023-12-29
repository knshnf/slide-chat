import TextChat from './TextChat.jsx'

function VideoChat() {
    return (
      <>
        <div className="video-chat-container">
          <div className="media-container">
            <div className="media">
              <video src=""></video>
            </div>
            <div className="media"></div>
          </div>
          <TextChat/>
        </div>
      </>
    )
  }
  
  export default VideoChat
  