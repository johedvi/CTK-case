import axios from "axios";
import React, { useState } from "react"
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";

export default function (props: {}) {

  const navigate = useNavigate();
  enum pageType {
    signin,
    signup
  }
  enum inputType {
    username,
    password
  }
  const [authMode, setAuthMode] = useState(pageType.signin);
  const [nameError, setNameError] = useState<string>(""); // Contains errors related to username.
  const [passError, setPassError] = useState<string>(""); // Contains errors related to password.
  const [userName, setUserName] = useState(""); // The current value in the input for username.
  const [passWord, setPassWord] = useState(""); // The current value in the input for password.

  // Change the login page to display - sign-up or sign-in
  const changeAuthMode = (toType: pageType) => {
    setAuthMode(toType);
  }

  /**
   * Function to check the validity of the USERNAME value in an input form. Differs from the password criterias.
   * @param state The validity state of the input form that contains booleans of current errors.
   * @returns True if the username field is valid, False if invalid (and changes nameError state)
   */
  function validateUsername(state: ValidityState) {
    if (state.patternMismatch || state.typeMismatch) {
      setNameError(`Username contains illegal characters. Please use [A,Z],[a,z],[0,9] only.`);
      return false;
    }
    if (state.tooShort) {
      setNameError(`Username must be 3 or more characters long.`);
      return false;
    }
    if (state.tooLong) {
      setNameError(`Username must be 64 characters or shorter.`);
      return false;
    }
    // Username validated, rinse errors and return true, allowing the form to be submitted if password also succeeds
    setNameError("");
    return true;
  }

  /**
   * Function to check the validity of the PASSWORD value in an input form. Differs from the username criterias.
   * @param state The validity state of the input form that contains booleans of current errors.
   * @returns True if the password field is valid, False if invalid (and changes passError state)
   */
  function validatePassword(state: ValidityState) {
    if (state.patternMismatch || state.typeMismatch) {
      setPassError(`Password contains illegal characters. Please use [A-Z],[a-z],[0,9] and special characters $#&_-!`);
      return false;
    }
    if (state.tooShort) {
      setPassError(`Password must be 8 characters or longer.`);
      return false;
    }
    if (state.tooLong) {
      setPassError(`Password must be 256 characters or shorter.`);
      return false;
    }
    // Password validated, rinse errors and return true.
    setPassError("");
    return true;
  }

  /**
   * Function to change the colour of the input form to signify malformed / incorrect input
   * to the user.
   * @param type Input type, either username or password
   * @returns CSS style. Red dashed border if there are errors, blank border otherwise.
   */
  function InputColour(type: inputType) {
    if (type === inputType.username && nameError === "") {
      return { border: "" };
    }
    if (type === inputType.password && passError === "") {
      return { border: "" };
    }
    return { border: "2px dashed red" };
  }

  /**
   * The sign-in page. Displays a submit form with username & password field, both with constraints to force correct
   * inputs before sending a request to the backend.
   * @returns React code for the sign-in page
   */
  function signin() {
    return (
      require("./css/account.css"),
      <div className="Auth-form-container">
        <form className="Auth-form" onSubmit={async e => {
          e.preventDefault();
          try {
            //var bcrypt = require('bcryptjs');
            //var salt = userName;
            //var hashedPassWord = bcrypt.hashSync(passWord, salt)

            /* Attempt to login - fails if username does not exist or password is incorrect */
            if (nameError !== "" || passError !== "") {
              alert(`Please fix the errors before submitting.`);
              return;
            }
            await axios.post("http://localhost:8080/login",
              {
                username: userName,
                password: passWord
              })
            navigate(-1); // Returns to previous page
          }
          catch (e: any) {
            switch (e.response.status) {
              case 400: alert("Username or password contains illegal characters. Please try again."); break;
              case 401: alert("Please sign out before logging in to another account."); break;
              case 404: alert(`User ${userName} does not exist. Please try again.`); break;
              default: alert("Unexpected error at sign in, please try again."); break;
            }
          }
        }}>
          <div className="Auth-form-content">
            <h3 className="Auth-form-title">Sign In</h3>
            <div className="text-center">
              Not registered yet?{" "}
              <span className="link-primary" onClick={() => changeAuthMode(pageType.signup)}>
                Sign Up
              </span>
            </div>
            <div className="form-group mt-3">
              <label>Username</label>
              {
                (nameError !== "") && (<p role="alert">{nameError}</p>)
              }
              <input
                required
                minLength={3}
                maxLength={64}
                onChange={(e) => {
                  setUserName(e.target.value);
                  validateUsername(e.target.validity);
                }}
                pattern="[a-z,A-Z,0-9]+"
                type="username"
                className="form-control mt-1"
                placeholder="Enter username"
                style={InputColour(inputType.username)}
              />
            </div>
            <div className="form-group mt-3">
              <label>Password</label>
              {
                (passError !== "") && (<p role="alert">{passError}</p>)
              }
              <input
                required
                minLength={8}
                maxLength={256}
                onChange={(e) => {
                  setPassWord(e.target.value);
                  validatePassword(e.target.validity);
                }}
                pattern="[a-z,A-Z,0-9,$,#,&,!,_,-]+"
                type="password"
                className="form-control mt-1"
                placeholder="Enter password"
                style={InputColour(inputType.password)}
              />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
            <p className="text-center mt-2">
              Forgot <a href="#">password?</a>
            </p>
          </div>
        </form>
      </div>
    )
  }

  /**
   * The sign-up page. Displays a username and password field of which both has constraints that must be met
   * before one can submit a request to the backend.
   * @returns React code for the sign-up page.
   */
  function signup() {
    return (
      <div className="Auth-form-container">
        <form className="Auth-form" onSubmit={async e => {
          try {
            e.preventDefault();
            //var bcrypt = require('bcryptjs');
            //var salt = userName;
            //var hashedPassWord = bcrypt.hashSync(passWord, salt)
            if (nameError !== "" || passError !== "") {
              alert(`Please fix the errors before submitting.`);
              return;
            }
            await axios.put("http://localhost:8080/login",
              {
                username: userName,
                password: passWord
              })
            navigate(-1); // Returns to previous page
          } catch (e: any) {
            switch (e.response.status) {
              case 400: alert("Username or password contains illegal characters. Please try again."); break;
              case 409: alert(`Username ${userName} is already taken. Please try again.`); break;
              default: alert("Unexpected error at sign up, please try again."); break;
            }
          }
        }}>
          <div className="Auth-form-content">
            <h3 className="Auth-form-title">Sign Up</h3>
            <div className="text-center">
              Already registered?{" "}
              <span className="link-primary" onClick={() => changeAuthMode(pageType.signin)}>
                Sign In
              </span>
            </div>
            <div className="form-group mt-3">
              <label>Username</label>
              {
                (nameError !== "") && (<p role="alert">{nameError}</p>)
              }
              <input
                required
                minLength={3}
                maxLength={64}
                onChange={(e) => {
                  setUserName(e.target.value);
                  validateUsername(e.target.validity);
                }}
                pattern="[a-z,A-Z,0-9]+"
                type="username"
                className="form-control mt-1"
                placeholder="Username"
                style={InputColour(inputType.username)}
              />
            </div>
            <div className="form-group mt-3">
              <label>Password</label>
              {
                (passError !== "") && (<p role="alert">{passError}</p>)
              }
              <input
                required
                minLength={8}
                maxLength={256}
                onChange={(e) => {
                  setPassWord(e.target.value);
                  validatePassword(e.target.validity);
                }}
                pattern="[a-z,A-Z,0-9,$,#,&,!,_,-]+"
                type="password"
                className="form-control mt-1"
                placeholder="Password"
                style={InputColour(inputType.password)}
              />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
            <p className="text-center mt-2">
              Forgot <a href="#">password?</a>
            </p>
          </div>
        </form>
      </div>
    )
  }

  if (authMode === pageType.signin) {
    return signin();
  }
  else {
    return signup();
  }
}