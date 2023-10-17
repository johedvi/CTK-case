import { Post } from "./Post"; 
import { Account } from "./Account";
import { ObjectId } from "mongodb";


export interface IForum {
    title       : string; // The unqiue ID of the forum - It's title
    description : string; // A short description about this subforum
    author : Account|string;
}


/**
 * A Forum object extends the IForum interface with a list of subscribed users (Account[]) and a list of posts (Post[])
 * @implements {IForum}
 * @param {string} title -  The unqiue ID of the forum - Its title
 * @param {string} description - A short description about this subforum
 * @param {string | Account} author - The creator of the forum
 * @property {Array.<Account>} users -  A list of users subscribed to the forum
 * @property {Array.<Post>} posts -  A list of posts created & available on the forum
 */
export class Forum implements IForum {
    title       : string; // The unqiue ID of the forum - Its title
    description : string; // A short description about this subforum
    author      : Account; // The creator of the forum
    users       : Account[]; // A list of users subscribed to the forum
    posts       : Post[]; // A list of posts created & available on the forum

    constructor(title : string, description : string, author : Account){
        this.title       = title;
        this.description = description;
        this.author      = author;
        this.users       = [author];
        this.posts       = [];
    }
    /* Retrieve the lists of posts in this subforum */
    getPosts(){
        return this.posts;
    }

    /* Add / publish a post to this subforum */
    addPost(post : Post){
        const oldLength = this.posts.length;
        const newLength = this.posts.push(post);
        if(oldLength>=newLength) return false;
        return true;
    }

    /* When a user joins a subforum they are added to the users list */
    joinForum(user : Account){
        this.users.push(user);
        return true;
    }

    /* When a user leaves the subforum they are removed from the users list
        Returns true if successful, false otherwise */
    leaveForum(user : Account){
        const index = this.users.findIndex(u => u===user);
        if(index!==-1){
            const f = this.users.splice(index,1);
            return f[0]===user;
        }
        return false;
    }
}