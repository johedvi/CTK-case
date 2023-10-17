import express, { Request, Response } from "express";
import { Account } from "../model/Account";
import { makeAccountService } from "../service/accountService";
const accountService = makeAccountService();
export const settingsRouter = express.Router();


// Request to change password for an account
settingsRouter.post("/",async(
    req : Request<{},{},{password : string, newPassword : string}> &{
        session :{
            user? : Account
        }
    },
    res : Response
)=>{
    try{
        const oldPassword = req.body.password;
        const newPassword = req.body.newPassword;
        const user = req.session.user;
        // Check that the user is logged in
        if(user===undefined){
            res.status(401).send("User must be signed in to change their password");
            return;
        }
        // Type checking
        if(typeof(oldPassword)!=='string'||typeof(newPassword)!=='string'){
            res.status(400).send(`Expected old & new password of type string, got ${typeof(req.body.password)}`);
            return;
        }
        const response = await accountService.changePassword(user.username,oldPassword,newPassword);
        if(response===false){
            res.status(500).send("Internal Server Error - Something went wrong with changing password");
            return;
        }
        res.status(200).send("Password successfully changed");
    }catch(e:any){
        res.status(500).send("Internal Server Error - Something went wrong with changing password");
    }
})

// Request to delete their account
settingsRouter.post("/delete",async(
    req : Request<{},{},{password : string}> & {
        session : {
            user? : Account
        }
    },
    res : Response<string>
)=>{
    try{
        const password = req.body.password;
        const user = req.session.user;
        // Check that the user is signed in
        if(user===undefined){
            res.status(401).send("You must be signed in to delete your account.");
            return;
        }
        if(typeof(password)!=='string'){
            res.status(400).send(`Input is of incorrect type. Expected String, got ${typeof(password)}`);
        }
        const response = await accountService.deleteAccount(user.username,password);
        if(response===false){
            res.status(500).send("Unexpected error at account deletion. Please notify staff");
            return;
        }
        req.session.destroy;
        res.status(200).send("Account successfully deleted");
    }catch(e:any){
        res.status(500).send("Unexpected error at account deletion. Please notify staff");
    }
})