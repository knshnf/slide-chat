import slideLogo from '../assets/slide.svg'

function Navbar() {
    return (
    <>
      <nav>
        <a>
          <img src={slideLogo} className="logo"></img>
          <span className="title">slide</span>
        </a>
      </nav>
    </>
    )

  }

  export default Navbar