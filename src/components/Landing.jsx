import React, { useState } from "react";
import Interest from './Interest.jsx'

function Landing({interest, interests, setInterest, setInterests, handleStartTextChat, handleStartVideoChat}) {

  const handleOnEnter = (e) => {
    if(e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      console.log('interest entered')

      let trimmed = interest.trim();
      if(trimmed == "") {
        return;
      }

      let updatedInterests = [...interests, trimmed,];
      setInterests(updatedInterests);
      setInterest('');
    }
  }

  const removeInterest = value => {
    setInterests(oldInterests => {
      return oldInterests.filter(interest => interest !== value)
    })
  }



  return (
    <>
      <div className="landing-container">
        <h2 className="chat-label"> Start Chatting </h2>
        <div className="chat-btns">
          <button type="button" onClick={() => handleStartTextChat(interests)}> Text </button>
          <button onClick={() => handleStartVideoChat(interests)}> Video </button>
        </div>
        <h2 className="chat-label"> What do you wanna talk about? </h2>
        <div className="interests-container">
          { interests.length > 0 && <div className="interests">
            {interests.map((interest, index) =>
              <Interest interest={interest}  key={index} removeInterest={removeInterest}/>
            )}
          </div>}
          
          <input className="interests-field" type="text" placeholder="Add your interests (optional)" value={interest} onKeyDown={handleOnEnter} onChange={e => setInterest(e.target.value)}/>
        </div>
      </div>
    </>
  )
}

export default Landing
