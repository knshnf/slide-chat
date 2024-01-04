function Landing({handleStartTextChat, handleStartVideoChat}) {

  return (
    <>
      <div className="landing-container">
        <h2 className="chat-label"> Start Chatting </h2>
        <div className="chat-btns">
          <button type="button" onClick={() => handleStartTextChat()}> Text </button>
          <button onClick={() => handleStartVideoChat()}> Video </button>
        </div>
      </div>
    </>
  )
}

export default Landing
