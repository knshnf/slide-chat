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
      <div className="landing-container flex h-[calc(100%-70px)]">
        <div className="md:w-1/2 w-full flex flex-col md:justify-center">
          <h1 className="text-2xl self-center pt-32 pb-12 md:pt-0 text-[#0f4c5c]"> Connect. Chat. Create Moments. </h1>
          <div className="self-center flex gap-12 pb-10">
          <button onClick={() => handleStartVideoChat(interests)} 
              className="font-bold text-2xl focus:outline-none text-white bg-[#fb8b24] rounded-lg px-5 py-2.5"> Video </button>
            <button type="button" onClick={() => handleStartTextChat(interests)} 
              className="font-bold text-2xl focus:outline-none text-[#fb8b24] border-2 border-[#fb8b24] border-bg-white hover:bg-[#fb8b24] hover:text-white border-col rounded-lg px-5 py-2.5"> Text </button>
            
          </div>


          <div className="interests-container">
            { interests.length > 0 && <div className="interests">
              {interests.map((interest, index) =>
                <Interest interest={interest}  key={index} removeInterest={removeInterest}/>
              )}
            </div>}
            
            <input className="interests-field text-center" type="text" placeholder="Add your interests (optional)" value={interest} onKeyDown={handleOnEnter} onChange={e => setInterest(e.target.value)}/>
          </div>
        </div>
        
        <div className="w-1/2 flex items-center hidden md:flex justify-center">
          <img src="src/assets/landing-vector.png" alt="" className="w-3/6"/>
        </div>
      </div>
    </>
  )
}

export default Landing
