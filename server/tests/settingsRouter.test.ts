import * as SuperTest from "supertest";
import { testApp } from "../indextest";

import { Post } from "../model/Post";
import { Forum } from "../model/Forum";
import { Comment } from "../model/Comment";
import { Account } from "../model/Account";

import { postModel } from "../db/post.db";
import { forumModel } from "../db/forum.db";
import { commentModel } from "../db/comment.db";
import { accountModel } from "../db/account.db";

import { makeForumService } from "../service/forumService";
import { makePostService } from "../service/postService";

const forumService = makeForumService();
const postService = makePostService();

const server = testApp.listen(0);
const request = SuperTest.default(server);

const user = new Account('SettingsRouterUser','SettingsRouterPass'); // Will be deleted
const newPassword = "SettingsRouterNewPass";
const updatedUser = new Account(user.username,newPassword);
const user2 = new Account('SettingsRouterUser2',"SettingsRouterPass2"); // User1 will have comments on this users post

const comment = new Comment(user,"Settings Router Comment that is deleted");
const comment2 = new Comment(user,"Settings Router Comment that is NOT deleted");
const postId = Date.now().valueOf();
const postId2 = Date.now().valueOf()+1; //Avoid duplicate key problem
const post = new Post(postId,"Settings Router Post","Content of Settings Router Post",user);
const post2 = new Post(postId2,"Settings Router Post 2","This post should not be deleted, but its comment will be cleared",user2);
const forum = new Forum("SettingsRouterForum","Settings Router Forum Test",user);

// Teardown & setup
beforeAll(async()=>{
    // If tests succeed this should be deleted, but just in case we add it here.
    await accountModel.findOneAndDelete({username : user.username});
    await accountModel.findOneAndDelete({username : user2.username});
    await commentModel.findOneAndDelete({content : comment.content});
    await commentModel.findOneAndDelete({content : comment2.content});
    await postModel.findOneAndDelete({id : postId});
    await postModel.findOneAndDelete({id : postId2});
    await forumModel.findOneAndDelete({title : forum.title});
});

// Close the server
afterAll(async()=>{
    server.close();
})

test("Settings Router - User can change their password",async()=>{
    // Create the test account and save the cookie
    const response = await request.put("/login").send(user);
    expect(response.statusCode).toEqual(201);
    const cookie = response.headers['set-cookie'];

    const changePassWordJson = {password : user.password, newPassword : newPassword};
    const reply = await request.post("/settings").set('Cookie',cookie).send(changePassWordJson);
    expect(reply.statusCode).toEqual(200);
    const getNewPass = await accountModel.findOne({username : user.username});
    if(getNewPass===null){
        fail("Settings Router - Failed to retrieve existing account after password change");
    }
    expect(getNewPass.password).toEqual(newPassword);
});

// Deleting an account will: 
// Clear the author and content field on all comments they've created,
// Delete posts they've made including potential comments on it
// Delete them from forums they've created, setting new owner as (temporary) <deleted> account.
test("Settings Router - User can delete their account",async()=>{
    // Get session cookie for user 1 (test above changed their password)
    const response = await request.post("/login").send(updatedUser);
    expect(response.statusCode).toEqual(200);
    const cookie = response.headers['set-cookie'];
    // Setup
    const getTestUserId = await accountModel.findOne({username : user.username});
    const getTestUser2Id = await accountModel.create(user2);
    if(getTestUserId===null){fail("Settings Router - Failed to retrieve existing user")};
    const createForum = await forumService.createForum(forum.title,forum.description,user.username);
    if(createForum===undefined){fail("Settings Router - Failed to create a forum")};

    const newPost = new Post(postId,post.title,post.content,getTestUserId);
    const createPost = await forumService.submitPost(forum.title,newPost);
    if(createPost===false){fail("Settings Router - Failed to create a post on a forum")};
    const newPost2 = new Post(postId2,post2.title,post2.content,getTestUser2Id);
    const create2ndPost = await forumService.submitPost(forum.title,newPost2);
    if(create2ndPost===false){fail("Settings Router - Failed to create the second post")};

    const createComment = await postService.submitComment(postId,comment.author,comment.content);
    if(createComment===false){fail("Settings Router - Failed to create comment")};
    const create2ndComment = await postService.submitComment(postId2,comment2.author,comment2.content);
    if(create2ndComment===false){fail("Settings Router - Failed to create 2nd comment")};
    const sndCommentId = create2ndComment.comments[0];

    /* Mental image of the setup: 
    User 1 owns a forum, and has a post on that forum and a comment on that post.
    User 2 has a post on that same forum, and User 1 has a comment on that post.
    After User 1 deletes their account, the Forum should display <deleted> as forum creator,
    The first post & comment should be deleted,
    The second post (by User 2) should remain but the comment by User 1 should be 'CLEARED', not deleted.
    */
   // Send delete request to router
   const deleteJson = {password : updatedUser.password};
   const deleteUser = await request.post("/settings/delete").set('Cookie',cookie).send(deleteJson);
   expect(deleteUser.statusCode).toEqual(200);

   const getForum = await forumModel.findOne({title : forum.title}).populate('author');
   if(getForum===null){fail("Settings Router - Forum not found after account deletion")};
   expect(getForum.author.username).toEqual("<deleted>");
   expect(getForum.title).toEqual(forum.title);
   expect(getForum.description).toEqual(forum.description);


   const getPost = await postModel.findOne({id : postId}); // This should have been deleted
   expect(getPost).toBeNull();
   const getPost2 = await postModel.findOne({id : postId2}).populate('author');
   if(getPost2===null){fail("Settings Router - Failed to retrieve post that should exist")};
   expect(getPost2.author.username).toEqual(post2.author.username);
   expect(getPost2.content).toEqual(post2.content);

   const getComment = await commentModel.findOne({content : comment.content});
   expect(getComment).toBeNull(); // This should be deleted along with the first post
   const getComment2 : Comment | null = await commentModel.findOne({id : sndCommentId.id}).populate('author');
   if(getComment2===null){fail("Settings Router - Failed to retrieve comment that should exist")};
   expect(getComment2.author.username).toEqual("<deleted>"); // The comment has successfully been cleared of info
})