import { Schema, Model, Callback } from "mongoose"
import { conn } from "./conn";

const commentSchema : Schema = new Schema({

    id : {
        type : Number,
        unique : true
    },
    
    author : {
        type : Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },

    content : {
        type: String,
        required: true
    },

    upvoters : [{
        type : Schema.Types.ObjectId,
        ref : 'Account',
        dropDups : true,
        required : true
    }],

    downvoters : [{
        type : Schema.Types.ObjectId,
        ref  : 'Account',
        dropDups : true,
        required : true
    }]
})
commentSchema.method('rating',function rating(){
    return this.upvoters.length - this.downvoters.length;
})
export const commentModel = conn.model<Comment>("Comment", commentSchema);