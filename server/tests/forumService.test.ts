import { Forum, IForum } from "../model/Forum";
import { makeForumService } from "../service/forumService";
// Instantiate the models to avoid 'MissingSchemaError' during testing
require("../db/post.db");
require("../db/comment.db");
import { conn } from "../db/conn";
import { Post } from "../model/Post";
import { accountModel } from "../db/account.db";
import { forumModel } from "../db/forum.db";
import { postModel } from "../db/post.db";
const forumService = makeForumService();

const user = {username : 'ForumServiceUser', password : 'ForumServicePass'};
const forum = {title : 'ForumService', description : 'Forum Service test'};
const postId = Date.now().valueOf();

// Teardown & setup database before testing
beforeAll(async()=>{
    await accountModel.findOneAndDelete({username : user.username});
    await forumModel.findOneAndDelete({title : forum.title});
    await postModel.findOneAndDelete({id : postId});
    await accountModel.create(user);
})

// Create a forum and ensure valid response and matching title, description and creator (author)
test("Forum Service - Forum Creation test",async()=>{
    const response = await forumService.createForum(forum.title,forum.description,user.username);
    expect(response!==undefined);
    if(response===undefined){fail('Forum Service - Forum creation failed')};

    expect(response.title).toEqual(forum.title);
    expect(response.description).toEqual(forum.description);
    expect(response.author).toEqual(user.username);
});

// Ensure that the created forum can be retrieved and exists in the list of forums
test("Forum Service - Retrieve list of existing forums",async()=>{
    const response = await forumService.getForums();
    expect(response!==undefined);
    if(response===undefined){fail('Forum Service - Failed to retrieve existing forums')};

    expect(response.map((forum : IForum)=>forum.title)).toContain(forum.title);
    expect(response.map((forum : IForum)=>forum.description)).toContain(forum.description);
    expect(response.map((forum : IForum)=>forum.author)).toContain(user.username);
});

// Ensure that the created forum can be found and retrieved in specific
test("Forum Service - Find a specific forum",async()=>{
    const response = await forumService.findForum(forum.title);
    expect(response!==undefined)
    if(response===undefined){fail('Forum Service - Failed to find existing forum')};

    expect(response.title).toEqual(forum.title);
    expect(response.description).toEqual(forum.description);
    expect(response.users).toContain(user.username);
    expect(response.author).toEqual(user.username);
});

test("Forum Service - Submit a post to a forum",async()=>{
    const getUser = await accountModel.findOne({username : user.username})
    if(getUser===null){fail('Forum Service - Failed to submit due to user not existing')};
    const post = new Post(postId,'Forum Service Post Title','Forum Service Post Content',getUser);
    const response = await forumService.submitPost(forum.title,post);
    expect(response!==false);
    if(response===false){fail('Forum Service - Failed to submit post to forum')};

    expect(response.posts.map((post : Post)=>post.title)).toContain(post.title);
    expect(response.posts.map((post : Post)=>post.content)).toContain(post.content);
    expect(response.posts.map((post : Post)=>post.author)).toContain(user.username);
    expect(response.posts.map((post : Post)=>post.id)).toContain(post.id);
})