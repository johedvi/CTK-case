import axios from 'axios';
import React, { useEffect, useState } from 'react'

interface Account {
  username: string
}
function Navbar() {

  const [searchInput, setSearchInput] = useState<String>(); // What the user types in the search bar
  const [userStatus, setUserStatus] = useState<Account | undefined>(undefined); // If a user is logged in (Account) or not (undefined)

  async function getStatus() {
    const response = await axios.get("http://localhost:8080/login/");
    setUserStatus(response.data.username);
  }
  
  useEffect(() => {
    getStatus();
  },[])

  /* Changes the sign in / log out button */
  function SignInOut() {
    const signIn = <form action="/login">
      <input className="btn btn-outline-danger" type="submit" value="Sign in" />
    </form>
    const logOut = <form onSubmit={async e=>{
      await axios.get("http://localhost:8080/login/logout");
    }}>
      <input className="btn btn-outline-danger" type="submit" value="Logout" />
    </form>
    return (userStatus === undefined) ? signIn : logOut;
  }

  return (
    require('./css/navbar.css'),
    require('./css/main.css'),
      <><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet" /><nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="/">
                <img src="/icon.png" id="logo" />
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" aria-current="page" href="/forum">Forums</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" aria-current="page" href="/merch">Merch</a>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Help
              </a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="#">FAQ</a></li>
                <li><a className="dropdown-item" href="#">Report a user</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Contact</a></li>
              </ul>
            </li>
          </ul>

          <form className="d-flex" role="search">

            <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />

          </form>

          <form action="/search">
            <input className="btn btn-outline-primary" type="submit" value="Search" />
          </form>
          <form action={(userStatus===undefined) ? "/login" : "/settings"}>
            <input className="btn btn-outline-secondary" type="submit" value="Settings" />
          </form>
          <SignInOut></SignInOut>
        </div>
      </div>
    </nav></>
  )
}

export default Navbar
