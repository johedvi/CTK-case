import express from "express";
import { Response, Request } from "express";
import { Forum, IForum } from "../model/Forum";
import { Account } from "../model/Account";
import { makeForumService } from "../service/forumService";
const forumService = makeForumService();

/* Allows this file to be exported/used in index.ts */
export const forumRouter = express.Router();

forumRouter.use(express.json());
/** @module ForumRouter */


/** 
 * Request to retrieve all subforums 
 * @async
 * @method GET /forum
 * @returns {Array.<IForum>} Returns the available forums
 * @throws {Internal} Error retrieving forums
 */

forumRouter.get('/', async(
    req: Request,
    res: Response<Array<IForum> | string>
) => {
    try { /* Send back all forums if possible */
        const forums = await forumService.getForums();
        res.status(200).send(forums);
    } catch(e : any){ /* Else server error */
        res.status(500).send(e.message);
    }
});


/** 
 * Request to create new forum
 * @async
 * @method PUT /forum
 * @returns {Forum} Returns the created forum
 * @throws Bad PUT call - User not logged in
 * @throws Bad PUT call - Bad input
 * @throws Bad PUT call - Forum title already exists
 * @throws {Interal} Something went wrong
 */
forumRouter.put('/', async(
    req: Request<{},{},{title : string, description : string}> & {
        session : {
            user? : Account
        }
    },
    res: Response<Forum | string>
) => {
    try {
        if(req.session.user===undefined){ // must be logged in
            res.status(401).send(`Bad PUT request to Forum --- User must be logged in`);
            return;
        }
        const title = req.body.title;
        const description = req.body.description;
        const author = req.session.user.username;
        /* Check for bad input */
        if(typeof(title)!=="string"||
        typeof(description)!=="string"||
        typeof(author)!=="string"){res.status(400).send("Bad input");return;}
        /* Else... */
        const newForum = await forumService.createForum(title,description,author);
        if(newForum===undefined){
            res.status(409).send(`Bad PUT request to Forum --- Forum Name ${title} is already taken.`);
            return;
        }
        res.status(201).send(newForum);
    } catch(e:any){
        res.status(500).send(e.message);
    }
});

/** 
 * Retrieve specific forum on /forum/ID
 * @async
 * @method GET /forum/:id
 * @param {string} id - Title of the forum
 * @returns {Forum} Returns the fetched forum
 * @throws Bad GET call - Missing id
 * @throws Bad GET call - Forum not found
 * @throws {Interal} Something went wrong
 */
forumRouter.get("/:id",async(
    req: Request<{ id: string }, {}, {}>,
    res: Response<Forum | string>
) => {
    try{
        if(req.params.id==null){ // No forum specified
            res.status(400).send(`Bad GET call to ${req.originalUrl} --- missing id param.`);
            return;
        }
        const forum = await forumService.findForum(req.params.id);
        if(forum==undefined){ // Forum doesn't exist
            res.status(404).send(`Bad GET call to ${req.originalUrl} --- Forum ${req.params.id} not found.`);
            return;
        }
        res.status(200).send(forum);
    }catch(e:any){
        res.status(500).send(e.message);
    }
});

/** 
 * Delete forum if and only if authorized
 * @async
 * @method DELETE /forum/:id
 * @param {string} id - Title of the forum
 * @returns {void}
 * @throws Bad DELETE call - Unauthorised
 * @throws Bad DELETE call - Missing id
 * @throws Bad DELETE call - Forum does not exist
 * @throws {Interal} - Something went wrong
 */
forumRouter.delete('/:id',async(
    req : Request<{ id : string}, {}, {}> & {
        session : {
            user? : Account
        }
    },
    res : Response<string>
)=>{
    try{
        if(req.session.user===undefined){
            res.status(403).send(`Bad DELETE call to ${req.originalUrl} --- Unauthorised`);
            return;
        }
        if(req.params.id===null){
            res.status(400).send(`Bad DELETE call to ${req.originalUrl} --- missing id param`);
            return;
        }
        const getForum = await forumService.findForum(req.params.id);
        if(getForum === undefined){
            res.status(404).send(`Bad DELETE call to ${req.originalUrl} --- forum ${req.params.id} does not exist`);
            return;
        }
    }catch(e:any){
        res.status(500).send(`Internal server error - Unable to delete forum ${req.params.id}`);
    }
})