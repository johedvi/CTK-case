import { Forum, IForum } from "../model/Forum";
import { Post } from "../model/Post";
import { Account, IAccount } from "../model/Account";
import { forumModel } from "../db/forum.db"
import { postModel } from "../db/post.db";
import { accountModel } from "../db/account.db";
import { commentModel } from "../db/comment.db";

/* Populate() */

export interface IForumService{
    /* Get all available subforums in an array */
    getForums() : Promise<Array<IForum>>;

    /* Checks if a forum exists. Returns the forum if true, undefined otherwise. */
    findForum(input : string) : Promise<Forum | undefined>

    /* Creates a subforum and returns it, returns undefined if error occurs */
    createForum(t : string, d : string, a : string) : Promise<Forum | undefined>;

    /* Submits a post to a subforum. 
    Returns updated forum object if successful, boolean false otherwise */
    submitPost(f : string, p : Post) : Promise<false | Forum>;

    // Deletes a post if the user is authorized (requested by the creator/author)
    deletePost(f : string, p :number, a : IAccount) : Promise<false | Forum>
}

/** @class */
class ForumDBService implements IForumService{

    stripUsers(f : Forum){

    }

    /**
     * Retrieves all existing forums as a list of IForum objects.
     * @async
     * @returns {Promise<Array.<IForum>>} Returns an array of available Forums
     */
    async getForums(): Promise<IForum[]> {
        const response = await forumModel.find().populate('author','username');
        const newForums = response.map(function(i){
            return {title : i.title, description : i.description, author : i.author.username}
        });
        return newForums;
    }

    /**
     * Search for a specific forum. Returns the forum if found, undefined otherwise.
     * @async
     * @param {string} input Forum id
     * @returns {Promise<Forum | undefined>} Return sucessfully fetched Forum, otherwise undefined
     */
    async findForum(input: string): Promise<Forum | undefined> {
        const result = await forumModel.findOne({title : input}).populate([{
            path : 'author',
            transform : a => a = a.username
        },{
            path : 'users',
            transform : u => u = u.username
        },{
            path : 'posts',
            populate : {
                path : 'author',
                transform : a => a = a.username
            },
            transform : p => p = {id : p.id, title : p.title, author : p.author, comments : p.comments.length}
        }]);
        if(result===null){return undefined}
        return result;
    }

    /**
     * Creates a forum and returns the new forum if successful, undefined otherwise.
     * @async
     * @param {string} title Forum title
     * @param {string} description Forum description
     * @param {string} author Forum author
     * @returns {Promise<Forum | undefined>} Return sucessfully created Forum, otherwise undefined
     */
    async createForum(title: string, description: string, author: string): Promise<Forum | undefined> {
        const lookupUser = await accountModel.findOne({username : author}); // Get user object
        if(lookupUser===null){
            return undefined;
        }
        const newForum = new Forum(title,description,lookupUser);
        const response = await (await forumModel.create(newForum)).populate([{
            path: 'author', 
            transform : a=>a=a.username
        },{
            path : 'users',
            transform : u=>u=u.username
        }]
        );
        return response;
    }

    /**
     * Creates a post with Post Model and pushes it to the list of posts of the specified forum.
     * Returns updated Forum if successful - bool false otherwise.
     * @async
     * @param {string} forum Forum title
     * @param {Post} post Post to submit
     * @returns {Promise<Forum | false>} Return sucessfully updated Forum, otherwise false
     */
    async submitPost(forum: string, p: Post): Promise<false | Forum> {
        const query = {title : forum};
        /* Finds the forum and pushes new post to list of posts */
        const createPost = await postModel.create(p);
        const result = await forumModel.findOneAndUpdate(query,{ $push: {posts : createPost}},{new : true}).populate([{
            path : 'author',
            transform : a=>a=a.username
        },{
            path : 'users',
            transform : u=>u=u.username
        },{
            path : 'posts',
            populate : {
                path : 'author',
                transform : a=>a=a.username
            }
        }]);
        if(result===null){
            return false;
        }
        return result;
    }
    
    /**
     * Deletes a post if the user requesting it is authorized (creator of post). Deletes all comments from the post,
     * the post itself and then removes it from the list of posts on the forum it was posted on.
     * @param forum The title of the forum the post was made on
     * @param post The ID of the post to delete
     * @param user The user who requested the deletion (check authorization)
     * @returns Updated forum object, with this post deleted. False otherwise.
     */
    async deletePost(forum : string, post : number, user : IAccount) : Promise<false | Forum>{
        const getUserId = await accountModel.findOne({username : user.username});
        if(getUserId===null){return false;} // The supposed creator does not exist / incorrect session username
        const response = await postModel.findOne({id : post, author : getUserId._id});
        if(response===null){return false;} // Post does not exist
        response.comments.forEach(async(element) => {
            await commentModel.findByIdAndDelete(element);
        });
        const deletePost = await postModel.findOneAndDelete({id : post});
        if(deletePost===null){return false;} // Something has gone wrong between first find and now
        const removePostFromForum = await forumModel.findOneAndUpdate({title : forum},{$pull : {posts : deletePost._id}},{new:true});
        if(removePostFromForum===null){return false;}
        return removePostFromForum;
    }
}
export function makeForumService() : IForumService{
    return new ForumDBService();
}