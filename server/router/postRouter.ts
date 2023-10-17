import express, { Request, Response } from "express";
import { Post, IPost } from "../model/Post";
import { IAccount } from "../model/Account";
import { Forum } from "../model/Forum";
import { forumModel } from "../db/forum.db";
import { accountModel } from "../db/account.db";
import { makePostService } from "../service/postService";
import { makeForumService } from "../service/forumService";
import { makeAccountService } from "../service/accountService";
const postService = makePostService();
const forumService = makeForumService();
const accountService = makeAccountService();


/* MergeParams allows router to find "forumId" */
export const postRouter = express.Router({mergeParams : true});
/* Dev notes: forumId = forum specific ID, 
                id = post specific ID
i.e /forum/<forumId>/post/<id> */

/** @module PostRouter */

/** 
 * Retrieve all posts inside subforum
 * @async
 * @method GET /forum/:forumId/post
 * @param {string} fid - Forum id
 * @returns {Array.<Post>} Returns an array of Posts for Forum <fid>
 * @throws Bad GET call - Forum not found
 * @throws {Internal} Server error
 */
postRouter.get('/',async(
    req : Request<{},{},{fid : string}>,
    res : Response<Post[] | string>
) => {
    try{
        /* Find if the given forum exists, if so retrieve its posts */
        const exist = await forumService.findForum(req.body.fid);
        if(exist==null){
            res.status(404).send(`Forum ${req.body.fid} not found.`);
            return;
        }
        res.status(200).send(exist.posts);
    }catch(e:any){res.status(500).send(e.message);}
});

/** 
 * Creates a post in a specific subforum
 * @async
 * @method PUT /forum/:forumId/post
 * @param {string} fid - Forum id
 * @param {string} title - Post title
 * @param {string} content - Post content
 * @returns {Forum} Returns the updated Froum
 * @throws Bad PUT call - Forum not found
 * @throws Bad PUT call - User not signed in
 * @throws Bad PUT call - User does not exist
 * @throws {Internal} Server error
 */
postRouter.put('/',async(
    req : Request<{},{},{fid : string, title : string, content : string}> &
    {
        session : {
            user? : IAccount
        }
    },
    res : Response<Forum | String>
) =>{
    try{
        /* Check if forum exists */ 
        const forumExists = await forumService.findForum(req.body.fid);
        if(forumExists==undefined){
            res.status(404).send(`Forum ${req.body.fid} not found.`);
            return;
        }
        /* Check logged in */
        if(req.session.user===undefined){
            res.status(401).send(`Bad PUT request to /post --- User most be signed in`);
            return;
        }
        /* Check if user exists */
        const getUserId = await accountService.getUserInfo(req.session.user.username);
        if(getUserId===undefined){
            res.status(500).send(`Bad PUT request to /post --- User does not exist`);
            return;
        }
        /* Create post and add to list of posts to specified forum */
        const postId = Date.now().valueOf();
        const createPost = new Post(postId,req.body.title,req.body.content,getUserId);
        const updatedForumObject = await forumService.submitPost(req.body.fid,createPost);
        if(updatedForumObject===false){
            res.status(500).send(`Error at updating forum posts`);
            return;
        }
        /* Forum successfully updated, return new forum object */
        res.status(201).send(updatedForumObject);
    }catch(e:any){res.status(500).send(e.message);}
});

/** 
 * Retrieve a post in a specific subforum
 * @async
 * @method GET /forum/:forumId/post/:pid
 * @param {string} forumId - Forum id
 * @param {number} pid - Post id
 * @returns {IPost} Returns the fetched Post
 * @throws Bad GET call - Post not found
 * @throws {Internal} Server error
 */
postRouter.get("/:pid",async(
    req : Request<{forumId : string, pid : number},{},{}> & {
        session : {
            user? : IAccount
        }
    },
    res : Response<IPost |String>
)=>{
    try{
        const getPost = await postService.getPost(req.params.pid);
        const user = req.session.user;
        if(getPost==null){
            res.status(404).send(`Bad GET call to ${req.originalUrl} --- Post does not exist.`);
            return;
        }
        // The user fetching the post is also the author, add a new field giving them the option to delete it
        // Note: When requesting to delete, authorization is still required for safety.
        if(user!==undefined && getPost.author===user.username){
            const canDeletePost = {id : getPost.id, title : getPost.title, content : getPost.content, author : getPost.author, comments : getPost.comments, candelete : true};
            res.status(200).send(canDeletePost);
            return;
        }
        res.status(200).send(getPost);
    }catch(e : any){
        res.status(500).send(`Unable to retrieve post ${req.params.pid} from forum ${req.params.forumId} with error ${e.message}`);
    }
});

postRouter.delete("/:pid",async(
    req : Request<{forumId : string, pid : number},{},{}> & {
        session : {
            user? : IAccount
        }
    },
    res : Response
)=>{
    try{
        const forumId = req.params.forumId;
        const postId = req.params.pid;
        const user = req.session.user;
        // Check if the user is signed in
        if(user===undefined){
            res.status(401).send("You must be signed in to delete a post");
            return;
        }
        // Check if the input is of the correct type
        if(typeof(forumId)!=='string'||typeof(postId)!=='string'){
            res.status(400).send(`Specified forum and post id are of incorrect type. Expected string, got ${typeof(forumId)}`);
            return;
        }
        const response = await forumService.deletePost(forumId,postId,user);
        if(response===false){
            res.status(403).send("You are not authorized for this action");
            return;
        }
        res.status(200).send("Post successfully deleted");
    }catch(e:any){

    }
})

/** 
 * Comment on a specific post
 * @async
 * @method PUT /forum/:forumId/post/:pid/comment
 * @param {string} forumId - Forum id
 * @param {number} pid - Post id
 * @param {string} content - Comment content
 * @returns {IPost} Returns the updated post
 * @throws Bad PUT call - User not logged in
 * @throws {Internal} Server error
 */
postRouter.put("/:pid/comment", async(
    req : Request<{forumId : string, pid : number},{},{content : string}> & {
        session : {
            user? : IAccount
        }
    },
    res : Response<IPost|String>
)=>{
    try{
        /* Check if user is authorized */
        if(req.session.user===undefined){
            res.status(401).send(`Bad PUT to ${req.originalUrl} --- Unauthorized, user must be logged in`);
            return;
        }
        /* Create comment and add it to list of comments to this post */
        const response = await postService.submitComment(req.params.pid,req.session.user,req.body.content);
        /* If False, user does not exist OR failure to create comment / push to comments[] */
        if(response===false){
            res.status(500).send(`Bad PUT to ${req.originalUrl} --- Authorization- or comment issue`);
            return;
        }
        res.status(201).send(response);
    } catch(e:any){
        res.status(500).send(`Server error ${e.message}`);
    }
})

/** 
 * Upvotes / downvotes a comment on a post
 * @async
 * @method PUT /forum/:forumId/post/:pid/comment
 * @param {string} forumId - Forum id
 * @param {string} pid - Post id
 * @param {string} comment - Comment id
 * @throws Bad POST call - Bad input
 * @throws Bad POST call - User not logged in
 * @throws {Internal} Server error
 */
postRouter.post("/:pid/comment", async(
    req : Request<{forumId : string, pid : number},{},{comment : number, vote : boolean}> & {
        session : {
            user? : IAccount
        }
    },
    res : Response<String>
    )=>{
        const comment = req.body.comment;
        const vote = req.body.vote;
        /* Type checking requests input */
        if(typeof(comment)!=='number'||typeof(vote)!=='boolean'){
            res.status(400).send(`Expected comment id of type number, vote of type boolean, got ${typeof(comment)} and ${typeof(vote)}`);
            return;
        }
        /* Check if user is signed in / has a session */
        if(req.session.user===undefined){
            res.status(401).send(`User must be logged in to vote`);
            return;
        }
        const result = postService.voteComment(comment,req.session.user.username,vote);
        if(!result){
            res.status(500).send(`Comment voting error`);
            return;
        }
        res.status(200).send(`Voting successful`);
    }
)

/** 
 * Upvotes / downvotes a comment on a post
 * @async
 * @method DELETE /forum/:forumId/post/:pid/comment/:cid
 * @param {string} forumId - Forum id
 * @param {string} pid - Post id
 * @param {string} cid - Comment ID
 * @throws Bad POST call - Bad input
 * @throws Bad POST call - User not logged in
 * @throws {Internal} Server error
 */
postRouter.delete("/:pid/comment/:cid", async(
    req : Request<{forumId : string, pid : number, cid : number},{},{}> & {
        session : {
            user? : IAccount
        }
    },
    res : Response<Boolean|String>
    )=>{
        const forumId = req.params.forumId;
        const postId = req.params.pid;
        const commentId = req.params.cid;
        const user = req.session.user;

        /* Type checking requests input
            Since they're parameters they're all of type string.
         */
        if(typeof(commentId)!=='string'){
            res.status(400).send(`Expected comment id of type string, got ${typeof(commentId)}`);
            return;
        }
        if(typeof(forumId)!=='string'){
            res.status(400).send(`Expected forum id of type string, got ${typeof(forumId)}`);
            return;
        }
        if(typeof(postId)!=='string'){
            res.status(400).send(`Expected forum id of type string, got ${typeof(postId)}`);
            return;
        }

        /* Check if user is signed in / has a session */
        if(user===undefined){
            res.status(401).send(`You must be signed in to perform this action.`);
            return;
        }
        
        const deleteComment = await postService.deleteComment(commentId,user);
        // User did not create the comment / unauthorized (or comment does not exist)
        if(deleteComment===false){
            res.status(403).send(`User is not authorized for this action`);
            return;
        }
        res.status(200).send(`Comment has been removed`);
    }
)


