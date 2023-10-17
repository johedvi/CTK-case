import express from "express";
import { forumRouter } from "./router/forumRouter";
import { postRouter } from "./router/postRouter";
import { loginRouter } from "./router/loginRouter";
import { settingsRouter } from "./router/settingsRouter";
import { userRouter } from "./router/userRouter";
import session from "express-session";
import cors from "cors";
export const testApp = express(); // The development server (different ports required for parallel Router testing)

/* APP FOR TESTING */
testApp.use(session({
    secret : "tempsecretkey", // Replace with .env file
    resave : true,
    cookie : {
        maxAge : 1000*60*60*24, // Session lives for 24 hours
        secure : false          // Allows for super-test to bypass session (only use during development)
    },
    saveUninitialized : true
}));
testApp.use(cors({
    origin : true,
    credentials : true
}));
/* Allows the use of JSON in response/request */
testApp.use(express.json());
testApp.use("/forum",forumRouter);               // Handle all /forum requests
testApp.use("/forum/:forumId/post", postRouter); // Handle post / comment requests
testApp.use("/login",loginRouter);               // Sign up, log in, log out
testApp.use("/settings",settingsRouter);
testApp.use("/profile",userRouter);