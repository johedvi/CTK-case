import { Post } from "../model/Post";
import { Forum } from "../model/Forum";
import { Account } from "../model/Account";
import { Comment } from "../model/Comment";
import { makeForumService } from "../service/forumService";
import { makePostService } from "../service/postService";
import { commentModel } from "../db/comment.db";
import { accountModel } from "../db/account.db";
import { forumModel } from "../db/forum.db";
import { postModel } from "../db/post.db";

const postService = makePostService();
const forumService = makeForumService();

const user = new Account('PostServiceUser','PostServicePassword');
const sndUser = new Account('PostServiceRatee','PostServiceRateePass');
const forumJson = {title : 'Post Service Forum Test', content : 'Post Service Forum Description'};
const postId = Date.now().valueOf();
const postJson = {id : postId, title : 'Post Service Post Test', content : 'Post Service Post Content'};
const commentJson = new Comment(user,"Post Service Test Comment");

// Teardown & setup post service tests
beforeAll(async()=>{
    await postModel.findOneAndDelete({id : postId});
    await accountModel.findOneAndDelete({username : user.username});
    await accountModel.findOneAndDelete({username : sndUser.username});
    await forumModel.findOneAndDelete({title : forumJson.title});
    
    const userObject = await accountModel.create(user);
    const forum = new Forum(forumJson.title,forumJson.content,userObject);
    await forumModel.create(forum);
});


// Ensure that the created post exists in the list of posts of the forum
test("Post Service - User can create a post on a forum",async()=>{
    const findUser = await accountModel.findOne({username : user.username});
    if(findUser===null){fail('Post Service - Test account was not found.')};

    const post = new Post(postJson.id,postJson.title,postJson.content,findUser);
    const response = await forumService.submitPost(forumJson.title,post);
    if(response===false){fail('Post Service - Failed to create post on forum')};

    expect(response.posts.map((post : Post)=>post.id)).toContain(post.id);
    expect(response.posts.map((post : Post)=>post.title)).toContain(post.title);
    expect(response.posts.map((post : Post)=>post.content)).toContain(post.content);
    expect(response.posts.map((post : Post)=>post.author)).toContain(post.author.username);
});

// Ensure the post can be received from post service
test("Post Service - Post can be retrieved",async()=>{
    const response = await postService.getPost(postJson.id);
    if(response===undefined){fail('Post Service - Failed to retrieve existing post')};

    expect(response.author).toEqual(user.username);
    expect(response.title).toEqual(postJson.title);
});

// Ensure that a user can post a comment on a post
test("Post Service - Comment can be created on a post",async()=>{
    const findUser = await accountModel.findOne({username : user.username});
    if(findUser===null){fail('Post Service - Failed to retrieve user')};

    const response = await postService.submitComment(postId,findUser,commentJson.content);
    if(response===false){fail('Post Service - Failed to comment on a post')};

    expect(response.comments.map((comment : Comment)=>comment.author)).toContain(findUser.username);
    expect(response.comments.map((comment : Comment)=>comment.content)).toContain(commentJson.content);
});

// Ensure that a user can vote a comment
test("Post Service - User can vote on a comment",async()=>{
    const getUser = await accountModel.findOne({username : user.username});
    const getComment = await commentModel.findOne({author : getUser?._id});
    if(getUser===null){fail('Post Service - Failed to retrieve user')};
    if(getComment===null){fail('Post Service - Failed to retrieve comment')};

    // A different user should be able to upvote and be added to list of upvoters
    // The creator is added automatically on comment creation, should be indempotent
    const newUser = await accountModel.create(sndUser);
    await postService.voteComment(getComment.id,getUser.username,true);
    await postService.voteComment(getComment.id,newUser.username,true);

    const getUpdComment : Comment|null = await commentModel.findOne({id : getComment.id});
    if(getUpdComment===null){fail('Post Service - Failed to retrieve updated comment object')};
    // If equal then earlier author-upvote never succeeded - meaning its indempotent! (Which is good)
    expect(getUpdComment.upvoters).toEqual([getUser._id,newUser._id]);
});

// The second upvoter from before should be removed from list of upvoters when they downvote

test("Post Service - User upvoting should delete them from downvotes",async()=>{
    const getUser = await accountModel.findOne({username : user.username});
    const getSndUser = await accountModel.findOne({username : sndUser.username});
    const getComment = await commentModel.findOne({author : getUser?._id});
    if(getUser===null){fail('Post Service - Failed to retrieve author user')};
    if(getSndUser===null){fail('Post Service - Failed to retrieve ratee user')};
    if(getComment===null){fail('Post Service - Failed to retrieve comment')};

    // Ratee goes from upvote to downvote - should be removed from upvoters, added to downvoters
    const response = await postService.voteComment(getComment.id,sndUser.username,false);
    expect(response).toEqual(true);

    const getUpdComment : Comment|null = await commentModel.findOne({id : getComment.id});
    if(getUpdComment===null){fail('Post Service - Failed to retrieve updated comment')};

    // Upvoters should only be the author
    expect(getUpdComment.upvoters).toEqual([getUser._id]);
    expect(getUpdComment.downvoters).toEqual([getSndUser._id]);

    await commentModel.findOneAndDelete({id : getComment.id});
});