import slideLogo from '../assets/slide.svg'

function Navbar({handleStartChat, handleCloseChat}) {
    return (
    <>
      <nav>
        <a onClick={() => {handleStartChat("none"); handleCloseChat();}}>
          <img src={slideLogo} className="logo"></img>
          <span className="title">slide</span>
        </a>
      </nav>
    </>
    )
  }

  export default Navbar