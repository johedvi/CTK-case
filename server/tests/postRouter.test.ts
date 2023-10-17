import * as SuperTest from "supertest";
import { testApp } from "../indextest";
import { Post } from "../model/Post";
import { Forum } from "../model/Forum";
import { Account } from "../model/Account";
import { postModel } from "../db/post.db";
import { forumModel } from "../db/forum.db";
import { accountModel } from "../db/account.db";
import { commentModel } from "../db/comment.db";
import { Comment, IComment } from "../model/Comment";

const server = testApp.listen(0);
const request = SuperTest.default(server);

// These objects won't be sent to the router itself, but we want to fetch these values
const account = new Account('PostRouterUser','PostRouterPass');
const account2 = new Account('PostRouterRatee','PostRouterRateePass');
const forum = new Forum('Post Router Test Forum','Post Router Test Forum Description',account);
const post1 = new Post(-1,'Post Router Test Post','Post Router Test Post Content',account);
const post2 = new Post(-2,'Post Router Test Post 2','Post Router Test Post Content 2',account);
const comment1 = new Comment(account,'Post Router Test Comment');
const comment2 = new Comment(account,'Post Router Test Comment 2');

//Teardown & setup, create forum that our posts will be tested on
beforeAll(async()=>{
    await commentModel.findOneAndDelete({content : comment1.content});
    await commentModel.findOneAndDelete({content : comment2.content});
    await forumModel.findOneAndDelete({title : forum.title});
    await postModel.findOneAndDelete({title : post1.title});
    await postModel.findOneAndDelete({title : post2.title});
    await accountModel.findOneAndDelete({username : account.username});
    await accountModel.findOneAndDelete({username : account2.username});

    const newUser = await accountModel.create(account);
    const newUser2 = await accountModel.create(account2);
    const newForum = new Forum(forum.title,forum.description,newUser);
    await forumModel.create(newForum);
});

// Close the server
afterAll(async()=>{
    server.close();
})

// Ensure a user can create several posts (in case bug occurs for >1 posts)
test("Post Router - Create posts in a forum",async()=>{
    // Get cookie by logging into an account
    const getCookie = await request.post("/login").send(account);
    expect(getCookie.statusCode).toEqual(200);
    const cookie = getCookie.headers['set-cookie'];

    // Create posts on this forum
    const post1json = {fid : forum.title, title : post1.title, content : post1.content};
    const post1res = await request.put("/forum/"+forum.title+"/post").set('Cookie',cookie).send(post1json);
    const post2json = {fid : forum.title, title : post2.title, content : post2.content};
    const post2res = await request.put("/forum/"+forum.title+"/post").set('Cookie',cookie).send(post2json);

    const res1 = await request.get("/forum/"+forum.title);
    expect(res1.statusCode).toEqual(200);
    expect(res1.body.posts.map((post : Post)=>post.title)).toEqual([post1.title,post2.title]);
    expect(res1.body.posts.map((post : Post)=>post.author)).toContain(account.username);
})

// Ensure a user can create several comments (in case bug occurs for >1 comments)
test("Post Router - User can create comments on a post",async()=>{
    // Get cookie by logging into an account
    const getCookie = await request.post("/login").send(account);
    expect(getCookie.statusCode).toEqual(200);
    const cookie = getCookie.headers['set-cookie'];

    // Get ID of post and create comment
    const getPostId = await postModel.findOne({title : post1.title});
    const sendComment = {content : comment1.content};
    const sendComment2 = {content : comment2.content};
    const commentres = await request.put("/forum/"+forum.title+"/post/"+getPostId?.id+"/comment").set('Cookie',cookie).send(sendComment);
    const commentres2 = await request.put("/forum/"+forum.title+"/post/"+getPostId?.id+"/comment").set('Cookie',cookie).send(sendComment2);
    expect(commentres.statusCode).toEqual(201);
    expect(commentres2.statusCode).toEqual(201);

    expect(commentres2.body.comments.map((comment : Comment)=>comment.author)).toContain(comment1.author.username);
    expect(commentres2.body.comments.map((comment : Comment)=>comment.content)).toContain(comment1.content);
    expect(commentres2.body.comments.map((comment : Comment)=>comment.content)).toContain(comment2.content);
})

// If a user upvotes then they are removed from the list of downvoters, and vice versa,
// Comment rating should match (upvoters - downvoters).
test("Post Router - User can vote on a comment",async()=>{
    // Log in as a second user, i.e not the comment creator
    const getCookie = await request.post("/login").send(account2);
    expect(getCookie.statusCode).toEqual(200);
    const cookie = getCookie.headers['set-cookie'];

    // Get ID of post
    const getPostId = await postModel.findOne({title : post1.title});
    if(getPostId===null){fail('Post Router - Failed to retrieve post')};

    // Get ID of comment to vote on
    const getCommentId = await commentModel.findOne({content : comment1.content});
    if(getCommentId===null){fail('Post Router - Failed to retrieve comment')};

    // Vote 'True' means upvote, 'False' means downvote
    const upvotejson = {comment : getCommentId.id, vote : true};
    const downvotejson = {comment : getCommentId.id, vote : false};

    const upvoteres = await request.post("/forum/"+forum.title+"/post/"+getPostId.id+"/comment").set('Cookie',cookie).send(upvotejson);
    expect(upvoteres.statusCode).toEqual(200);

    // Author of comment is added to list of upvoters automatically, rating should equal 2
    const getUpdatedComment = await request.get("/forum/"+forum.title+"/post/"+getPostId.id);
    expect(getUpdatedComment.statusCode).toEqual(200);
    expect(getUpdatedComment.body.comments.map((comment : IComment)=>comment.rating)).toContain(2);

    // Ratee should be removed from upvoters and added to list of downvoters
    const downvoteres = await request.post("/forum/"+forum.title+"/post/"+getPostId.id+"/comment").set('Cookie',cookie).send(downvotejson);
    expect(downvoteres.statusCode).toEqual(200);

    // Upvoters should equal [Author], and Downvoters = [Ratee] meaning a rating of 0
    const getUpdatedComment2 = await request.get("/forum/"+forum.title+"/post/"+getPostId.id);
    expect(getUpdatedComment2.statusCode).toEqual(200);
    expect(getUpdatedComment2.body.comments.map((comment : IComment)=>comment.rating)).toContain(0);
});

// Deleting a post will delete its comments and remove it from the list of posts on the forum it was submitted towards
test("Post Router - User can delete their own post",async()=>{
    // Get cookie by logging into an account, this is the earlier post creator
    const getCookie = await request.post("/login").send(account);
    expect(getCookie.statusCode).toEqual(200);
    const cookie = getCookie.headers['set-cookie'];

    // Get ID of post
    const getPostId = await postModel.findOne({title : post1.title});
    if(getPostId===null){fail('Post Router - Failed to retrieve post')};

    const response = await request.delete("/forum/"+forum.title+"/post/"+getPostId.id).set('Cookie',cookie);
    expect(response.statusCode).toEqual(200);
    
    const findPost = await postModel.findOne({title : post1.title});
    const findComment = await commentModel.findOne({content : comment1.content});
    const getForum = await forumModel.findOne({title : forum.title}).populate('posts');
    if(getForum===null){fail("Post Router - Failed to retrieve existing forum")};

    expect(findPost).toBeNull(); // Post should be deleted
    expect(findComment).toBeNull(); // Comment on the post should be deleted
    expect(getForum.posts.map((post : Post)=>post.title)).toEqual([post2.title]); // First post should not be in the list anymore
})