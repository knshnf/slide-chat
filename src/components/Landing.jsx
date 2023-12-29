function Landing({handleStartChat}) {

  return (
    <>
      <div className="landing-container">
        <h2 className="chat-label"> Start Chatting </h2>
        <div className="chat-btns">
          <button type="button" onClick={() => handleStartChat("text chat")}> Text </button>
          <button onClick={() => handleStartChat("video chat")}> Video </button>
        </div>
      </div>
    </>
  )
}

export default Landing
