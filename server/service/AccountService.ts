import { IAccount, Account } from "../model/Account";
import { accountModel } from "../db/account.db";

// Imports below are used for deletion of the account
import { commentModel } from "../db/comment.db";
import { makePostService } from "./postService";
import { postModel } from "../db/post.db";
import { forumModel } from "../db/forum.db";
const postService = makePostService(); // Used for account deletion (clear comments & posts)

export interface IAccountService {
    /* Create an account with a unique username */
    createAccount(u : string, p : string) : Promise<false | IAccount>;

    /* Check if a user exists */
    userLogin(u : string, p : string) : Promise<null | IAccount>;

    // Change a users account password. True if successful.
    // False if new password don't meet requirements.
    changePassword(a : string, op : string, np : string) : Promise<boolean>;

    // Returns the users non-sensitive information, undefined otherwise
    getUserInfo(a : string) : Promise<undefined | IAccount>;

    // Deletes the users account, clears contents of their comments and posts
    // If they own a forum then it will be transfered to special admin account
    deleteAccount(u : string, p : string) : Promise<boolean>;
}

/** @class */
class AccountDBService implements IAccountService {

    // Matches the given username against a regular expression.
    // Returns True if it is allowed, False otherwise.
    matchUsername(username : string) : Boolean{
        const regexname = RegExp("[^A-Za-z0-9]"); // Username. Returns true if it contains illegal characters
        if(regexname.test(username)||username.length<3){ // Username must match regex & length criteria
            return false;
        }
        return true;
    }

    // Matches the given password against a regular expression.
    // Returns True if it is allowed, False otherwise.
    matchPassword(password : string) : Boolean{
        const regexpass = RegExp("[^A-Za-z0-9$#&_!-]"); // Password. Returns true if it contains illegal characters
        if(regexpass.test(password)||password.length<8){ // Password must match regex & length criteria
            return false;
        }
        return true;
    }

    /**
     * Creates a new Account document in the database with the specified username and password.
     * Returns an Account object if successful, false otherwise.
     * @async
     * @param {string} u The username of the account
     * @param {string} p The password for the account
     * @returns {Promise<Account | false>} If creation successful, return Account
     */
    async createAccount(u: string, p: string): Promise<false | IAccount> {
        if(!this.matchUsername(u)||!this.matchPassword(p)){
            return false;
        }
        const newAccount = new Account(u,p);
        const response = (await accountModel.create(newAccount)).username
        if(response===null){ // Account already exists
            return false;
        }
        return newAccount;
    }

    /**
     * Checks if an account exists, and that the passwords match.
     * Used for authorization / logging in to an account
     * @async
     * @param {string} u The username of the account
     * @param {string} p The password for the account
     * @returns {Promise<IAccount | null>} Return the account if it exists, otherwise null
     */
    async userLogin(u : string, p : string): Promise<null | IAccount> {
        // Validate the input against the regular expression criterias
        if(!this.matchUsername(u)||!this.matchPassword(p)){
            return null;
        }
        const reply = await accountModel.findOne({username : u, password : p},'username');
        return reply;
    }

    /**
     * Change password of a given account
     * @async
     * @param {string} a The username of the account
     * @param {string} op The original password for the account
     * @param {string} np The new password for the account
     * @returns {Promise<boolean>} Returns true if account exists, otherwise null
     */
    async changePassword(a: string, op: string, np: string): Promise<boolean> {
        // Validate username, old & new password against regular expression criterias
        if(!this.matchUsername(a)||!this.matchPassword(op)||!this.matchPassword(np)){
            return false;
        }
        const response = await accountModel.findOneAndUpdate({username : a, password : op},{password: np},{new : true});
        if(response===null){return false;} // Account doesn't exist
        return true;
    }

    /**
     * Retrieves a user's non-sensitive information such as username, settings and preferences.
     * Returns undefined if not found.
     * @async
     * @param {string} username The specified user's username to retrieve information from
     * @returns The user information if found, undefined otherwise
     */
    async getUserInfo(username: string): Promise<Account | undefined> {
        // Validate username input against regular expression criteria
        if(!this.matchUsername(username)){
            return undefined;
        }
        const response = await accountModel.findOne({username : username}).select(['username']);
        if(response===null){
            return undefined;
        }
        return response;
    }

    /**
     * Deletes the user's account, clearing content from their posted posts & comments.
     * Any forums they owned will have their ownership transferred to admin account.
     * @async
     * @param {string} username The specified user's username
     * @param {string} password The password of the user's account
     * @returns True if deletion is successful, False otherwise.
     */
    async deleteAccount(username : string, password : string) : Promise<boolean>{
        // Validate input against regex
        if(!this.matchUsername(username)||!this.matchPassword(password)){
            return false;
        }

        const getUserId = await accountModel.findOne({username : username, password : password});
        if(getUserId===null){return false;} // Account does not exist

        // Clear all comments from this user
        const getUserComments = await commentModel.find({author : getUserId._id});
        getUserComments.forEach(async (comment)=>{
            await postService.deleteComment(comment.id,getUserId);
        });

        // Delete all posts from this user (not clear, actual delete along with potential comments)
        const getUserPosts = await postModel.find({author : getUserId._id});
        getUserPosts.forEach(async (post)=>{
            await commentModel.deleteMany({_id : {$in : post.comments}});
            await postModel.findByIdAndDelete({_id : post._id});
        });

        // Remove the posts from lists of posts on forums
        const removePostsFromForum = await forumModel.updateMany({posts : {$in : getUserPosts}},{$pullAll : {posts : getUserPosts}});
        // Clear forum ownership field for every forum this user has created
        // In the future: Transfer ownership to a forum moderator (i.e next of heir)
        // getDeleted is the DB account to display author as '<deleted>'. A user is unable to have this name -
        // since it goes against the regex constraints.
        const getDeletedId = await accountModel.findOneAndUpdate({username : '<deleted>'},{},{upsert: true, new : true});
        const getUserForums = await forumModel.find({author : getUserId._id});
        getUserForums.forEach(async (forum)=>{
            await forumModel.findByIdAndUpdate({_id : forum._id},{$pull : {users : getUserId._id}, author : getDeletedId._id});
        });

        // Lastly, delete the account of the user itself
        const deleted = await accountModel.findByIdAndDelete(getUserId._id);

        if(deleted===null){return false;} // Failed to delete the account
        return true;
    }
}

export function makeAccountService(){
    return new AccountDBService();
}