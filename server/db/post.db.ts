import { Schema, Model } from "mongoose";
import { conn } from "./conn";
import { Post } from "../model/Post";

const postSchema: Schema = new Schema({

    id : {
        type : Number,
        unique : true,
        required : true
    },

    title: {

        type: String,
        min : 1,
        max : 128,
        required: true

    },

    content: {

        type: String,
        min : 1,
        max : 15000,
        required: true

    },

    author: {

        type: Schema.Types.ObjectId,
        ref : 'Account',
        required: true

    },

    comments: [{
        type : Schema.Types.ObjectId,
        ref : 'Comment'
    }]

});

export const postModel = conn.model<Post>("Post", postSchema);