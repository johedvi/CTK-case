import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";

interface Account {
    username: string
}

function Settings() {
    const navigate = useNavigate();
    
    enum settingsType{
        password,
        delete
    }

    const [getSettingsType, setSettingsType] = useState<settingsType>(settingsType.password);
    const [userStatus, setUserStatus] = useState<Account | undefined>(undefined);

    const [oldPassWord, setOldPassWord] = useState<String>("");
    const [newPassWord, setNewPassWord] = useState<String>("");
    const [passError, setPassError]     = useState<String>("");

    async function getStatus() {
        const response = await axios.get("http://localhost:8080/login/");
        setUserStatus(response.data);
    }

    useEffect(() => {
        getStatus()
    });

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
    function InputColour() {
        if (passError === "") {
            return { border: "" };
        }
        return { border: "2px dashed red" };
    }

    if (userStatus !== undefined && getSettingsType===settingsType.password) {
        return (
            require("./css/account.css"),
            <div className="Auth-form-container">
                <form className="Auth-form" onSubmit={async e => {
                    try {
                        e.preventDefault();
                        if (passError !== "") {
                            alert(`Please fix the errors before submitting.`);
                            return;
                        }
                        await axios.post("http://localhost:8080/settings",
                            {
                                password: oldPassWord,
                                newPassword : newPassWord
                            })
                        alert("Password successfully changed!");
                        navigate(-1); // Returns to previous page
                    } catch (e: any) {
                        switch (e.response.status) {
                            case 400: alert("Input fields are of incorrect type. Please fix and try again.");break;
                            case 401: alert("Please sign in before attempting to change password.");break;
                            default: alert("Unexpected error at password change, please try again."); break;
                        }
                    }
                }}>
                <div className="Auth-form-content">
                <h3 className="Auth-form-title">Welcome, {userStatus.username}</h3>
                <div className="text-center">Change Password</div>
                <div className="form-group mt-3">
                <label>Old Password</label>
                {
                (passError !== "") && (<p role="alert">{passError}</p>)
                }
                <input
                    required
                    minLength={8}
                    maxLength={256}
                    onChange={(e) => {
                      setOldPassWord(e.target.value);
                      validatePassword(e.target.validity);
                    }}
                    pattern="[a-z,A-Z,0-9,$,#,&,!,_,-]+"
                    type="password"
                    className="form-control mt-1"
                    placeholder="Password"
                    style={InputColour()}
                    />
                </div>
                <div className="form-group mt-3">
                <label>New Password</label>
                {
                (passError !== "") && (<p role="alert">{passError}</p>)
                }
                <input
                    required
                    minLength={8}
                    maxLength={256}
                    onChange={(e) => {
                      setNewPassWord(e.target.value);
                      validatePassword(e.target.validity);
                    }}
                    pattern="[a-z,A-Z,0-9,$,#,&,!,_,-]+"
                    type="password"
                    className="form-control mt-1"
                    placeholder="Password"
                    style={InputColour()}
                    />
                </div>
                <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                Change Password
                </button>
                </div>
                </div>
                <div className="text-center">
                    <span className="link-primary" onClick={() => setSettingsType(settingsType.delete)}>
                    Delete Account?
                    </span>
                </div>
                </form>
        </div>
        )
    }
    else if (userStatus !== undefined && getSettingsType===settingsType.delete) {
        return (
            require("./css/account.css"),
            <div className="Auth-form-container">
                <form className="Auth-form" onSubmit={async e => {
                    try {
                        e.preventDefault();
                        if (passError !== "") {
                            alert(`Please fix the errors before submitting.`);
                            return;
                        }
                        await axios.post("http://localhost:8080/settings/delete",
                            {
                                password: oldPassWord,
                            })
                        alert("Account and User data has been successfully removed.");
                        navigate(-1); // Returns to previous page
                    } catch (e: any) {
                        switch (e.response.status) {
                            case 400: alert("Input fields are of incorrect type. Please fix and try again.");break;
                            case 401: alert("Please sign in before attempting to delete your account.");break;
                            default: alert("Unexpected error at account deletion, please try again."); break;
                        }
                    }
                }}>
                <div className="Auth-form-content">
                <h3 className="Auth-form-title">Welcome, {userStatus.username}</h3>
                <div className="text-center">Delete Your Account</div>
                <div className="text-center">
                    If you want to delete your account then enter your current password below.
                    All your posts and comments will be deleted. You will no longer be the owner of
                    any forums you created. You can always create a new account again.
                </div>
                <div className="form-group mt-3">
                <label>Current Password</label>
                {
                (passError !== "") && (<p role="alert">{passError}</p>)
                }
                <input
                    required
                    minLength={8}
                    maxLength={256}
                    onChange={(e) => {
                      setOldPassWord(e.target.value);
                      validatePassword(e.target.validity);
                    }}
                    pattern="[a-z,A-Z,0-9,$,#,&,!,_,-]+"
                    type="password"
                    className="form-control mt-1"
                    placeholder="Password"
                    style={InputColour()}
                    />
                </div>
                <div className="d-grid gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                Delete Your Account
                </button>
                </div>
                </div>
                <div className="text-center">
                    <span className="link-primary" onClick={() => setSettingsType(settingsType.password)}>
                    Change Password?
                    </span>
                </div>
                </form>
        </div>
        )
    }
    else { // Settings are only for users who are logged in, redirect to login/signup
        return (
            require("./css/account.css"),
            <div className="Auth-form-container">
                <form className="Auth-form">
                    <div className="Auth-form-content">
                        <h3 className="Auth-form-title">Please sign in to access your settings</h3>
                    </div>
                </form>
            </div>
        )
    }
}

export default Settings;