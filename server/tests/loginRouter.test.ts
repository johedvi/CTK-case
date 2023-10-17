import * as SuperTest from "supertest";
import { testApp } from "../indextest";
import { Account } from "../model/Account";
import { accountModel } from "../db/account.db";

const server = testApp.listen(0);
const request = SuperTest.default(server);

const user = new Account('LoginRouterUser','LoginRouterPassword');

// Teardown & setup
beforeAll(async()=>{
    await accountModel.findOneAndDelete({username : user.username});
});

// Close the server
afterAll(async()=>{
    server.close();
})

// Creating an account will assign the request with the corresponding session-cookie
test("Login Router - User can create an account and be assigned a session",async()=>{
    const response = await request.put("/login").send(user);
    expect(response.statusCode).toEqual(201);

    const cookie = response.headers['set-cookie']; // Our assigned session cookie
    expect(cookie).toBeTruthy(); // Should not be empty - (we can't read the session id)
});

// Logging out will clear the users session
test("Login Router - User can log out from their account",async()=>{
    const response = await request.get("/login/logout");
    expect(response.statusCode).toEqual(302); // Redirected to main page on log out, default code 302

    const cookie = response.headers['set-cookie'];
    expect(cookie).toBeFalsy();
});

// Logging into an existing account should give them a session-cookie
test("Login Router - User can log in to an existing account",async()=>{
    const response = await request.post("/login").send(user);
    expect(response.statusCode).toEqual(200);

    const cookie = response.headers['set-cookie'];
    expect(cookie).toBeTruthy();
});