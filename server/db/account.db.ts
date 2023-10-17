import {Schema, Model} from "mongoose";

import {Account} from "../model/Account";

import { conn } from "./conn";


const accountSchema : Schema = new Schema({
 username : {

 type : String,

 required : true,

 unique: true,
 
 min: 3,
 
 max : 64

 },

 password : {

 type : String,

 required : true,

 min : 8,

 max : 64

 }

});
export const accountModel = conn.model<Account>('Account', accountSchema);