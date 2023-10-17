import mongoose, {Schema, Model} from "mongoose";
import {Forum} from "../model/Forum";
import { conn } from "./conn";


const forumSchema : Schema = new Schema({

 title : {

 type : String,

 required : true,

 unique : true

 },

 description : {

 type : String,

 required : true

 },

 
author : {
  type : Schema.Types.ObjectId,
  ref: 'Account',
  required : true
},

users : [{
  type : Schema.Types.ObjectId,
  ref : 'Account',
  required : true
}],

 posts : [{
  type : Schema.Types.ObjectId,
  ref : 'Post'
 }]
}
);
export const forumModel = conn.model<Forum>('Forum', forumSchema);