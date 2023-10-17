export interface IAccount{
    username : string;
}

/**
 * An Account object contains user information such as username & password
 * @param {string} username The username of the account
 * @param {string} password The password of the account (hashed)
 */
export class Account implements IAccount{
    username : string; // The login-name for the user
    password : string;
    /**
     * Creates a new Account object. Does not contain any sensitive information.
     * @param username The username of the account
     */
    constructor(username: string, password : string) {
    this.username = username;
    this.password = password;
    }
}