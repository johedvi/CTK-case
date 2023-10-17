import express, { Request, Response } from "express";
import session from "express-session";
import { makeAccountService } from "../service/accountService";
import { Schema } from "mongoose";
import { IAccount } from "../model/Account";
export const loginRouter = express.Router();

const accountService = makeAccountService();

interface Account {
        username : string
}

type SessionRequest = {
        session : {
                user ?: Account
        }
}

/** @module LoginRouter */


/** 
 * Get session status. If logged in returns non-sensitive user information, else nothing.
 * @async
 * @method GET /login
 * @returns {Account | null} Returns the username of logged in user or nothing
 * @throws {Internal} Server error
 */
loginRouter.get("/", async(
        req : Request<{},{},{}> & {
                session : {
                        user? : Account
                }
        }, 
        res : Response<Account | String>
        ) => {
        try{
                /* User is not logged in */
                if(req.session.user===undefined){
                        res.status(204).send("User is not logged in");
                        return;
                }
                const response = await accountService.getUserInfo(req.session.user.username)
                res.status(200).send(response);
        }catch(e: any){
                res.status(500).send("Bad response from Login page - server error");
        }
});

/** 
 * Log into an existing account
 * @async
 * @method POST /login
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {string} Assigned session ID
 * @throws Bad POST call - Already logged in
 * @throws Bad POST call - Bad input
 * @throws Bad POST call - User does not exist
 * @throws {Internal} Server error
 */
loginRouter.post("/", async(
        req : Request<{},{},{username : string, password : string}> & SessionRequest,
        res : Response<IAccount|string>
)=>{
        try{
                if(req.session.user!==undefined){
                        res.status(401).send(`Bad POST to login - Please sign out before logging in.`);
                        return;
                }
                if(typeof(req.body.username)!=="string"){
                        res.status(400).send(`Bad POST to login - username is not of type 'string'.`);
                        return;
                }
                if(typeof(req.body.password)!=="string"){
                        res.status(400).send(`Bad POST to login - password is not of type 'string'.`);
                        return;
                }
                const userExists = await accountService.userLogin(req.body.username, req.body.password);
                if(userExists===null){
                        res.status(404).send(`Bad POST to login - user ${req.body.username} does not exist.`);
                        return;
                }
                req.session.user = userExists; // Assign session ID / cookie to logged-in user.
                res.status(200).send(userExists);
        }catch(e:any){
                res.status(500).send(e.message);
        }
});

/** 
 * Create a new account
 * @async
 * @method PUT /login
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {string} Assigned session ID of newly created account
 * @throws Bad POST call - Bad input
 * @throws Bad POST call - Username already taken
 * @throws {Internal} - Server error
 */
loginRouter.put("/", async (
        req : Request<{},{},{username : string, password : string}> & SessionRequest, 
        res : Response<Account | String>
) => {
        try{
                if(typeof (req.body.username) !== "string"){
                        res.status(400).send(`Bad PUT to login - username is not of type 'string'.`);
                        return;
                }
                if(typeof (req.body.password) !== "string"){
                        res.status(400).send(`Bad PUT to login - password is not of type 'string'.`);
                        return;
                }
                const accountCreationResult = await accountService.createAccount(req.body.username,req.body.password);
                if(accountCreationResult===false){
                        res.status(409).send(`Bad PUT to login - username ${req.body.username} is already taken.`);
                        return;
                }
                req.session.user = accountCreationResult;
                res.status(201).send(accountCreationResult);
        }catch(e:any){
                res.status(500).send(e.message);
        }
});

/** 
 * Logout from the account / destroy the session
 * @async
 * @method GET /logout
 * @returns {HTMLLinkElement} Redirect to previously visited page
 * @throws {Internal} Server error
 */
loginRouter.get('/logout',async(req, res)=>{
        try{
            req.session.destroy(((err)=>{
                res.redirect('back');
            }));
        }catch(e:any){
            res.redirect('/');}
    })