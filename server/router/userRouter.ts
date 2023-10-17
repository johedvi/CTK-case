import express, { Request, Response } from "express"
import { Account, IAccount } from "../model/Account";
import { makeAccountService } from "../service/accountService";
const accountService = makeAccountService();

export const userRouter = express.Router();
userRouter.use(express.json());

/** @module UserRouter */


/** 
 * Request to retrieve all subforums 
 * @async
 * @method GET /user/:id
 * @returns {Array.<IForum>} Returns the available forums
 * @throws {Internal} Error retrieving forums
 */

userRouter.get('/:id', async(
    req: Request<{ id: string }, {}, {}>,
    res: Response<Array<IAccount> | string>
) => {
    try {
        const account = await accountService.getUserInfo(req.params.id);
        if (account==null) {
            res.status(404).send("User not found");
            return undefined;
        }
        res.status(200).send(account.username);
    } catch(e : any){
        res.status(500).send(e.message);
    }
});
