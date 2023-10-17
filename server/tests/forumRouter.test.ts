import { Forum } from "../model/Forum";
import * as SuperTest from "supertest";
import { testApp } from "../indextest";
import { accountModel } from "../db/account.db";
import { forumModel } from "../db/forum.db";

const server = testApp.listen(0);
const request = SuperTest.default(server);
/* Some global values to use in our tests in this suite */
const user = {username : "ForumRouterUser", password : "ForumRouterPass"};
const forum = {title : 'ForumTest', description : 'Forum Router test description'};

/* Restore the database - since other tests runs in parallel we want to only delete documents
used in THIS suite as to not ruin other tests */
beforeAll(async()=>{
    await accountModel.findOneAndDelete({username : user.username});
    await forumModel.findOneAndDelete({title : forum.title});
});

// Close the server
afterAll(async()=>{
    server.close();
})

test("Forum Router - Create new forum with new account test", async () => {
    // Create the author of the forum
    const createUser = await request.put("/login").send(user);
    expect(createUser.statusCode).toEqual(201);
    const cookie = createUser.headers['set-cookie']; // Our session to use in subsequent requests

    // Create the forum as that author
    const res1 = await request.put("/forum").set('Cookie',cookie).send(forum);
    expect(res1.statusCode).toEqual(201);
    expect(res1.body.title).toEqual(forum.title);
    expect(res1.body.description).toEqual(forum.description);
    // Username is not returned in creation of forum (not populated, and shouldn't be!)

    // Check that the newly created forum exists on the frontend & with correct data
    const res2 = await request.get("/forum");
    expect(res2.statusCode).toEqual(200);
    expect(res2.body.map((forum : Forum) => forum.title)).toContain(forum.title);
    expect(res2.body.map((forum : Forum) => forum.description)).toContain(forum.description);
    expect(res2.body.map((forum : Forum) => forum.author)).toContain(user.username);
});

afterAll(async()=>{
    server.close();
})

test("Forum Router - Retrieve specific forum test", async() => {
    // Get forum from previous test
    const response = await request.get("/forum/"+forum.title);
    expect(response.status).toEqual(200);
    expect(response.body.title).toEqual(forum.title);
    expect(response.body.description).toEqual(forum.description);
    expect(response.body.author).toEqual(user.username);
    expect(response.body.users).toContain(user.username);

    // Expecting posts is tested in postRouter test suite
});