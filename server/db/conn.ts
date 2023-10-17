import { createConnection } from "mongoose";



export const conn = createConnection("mongodb+srv://johndoe:fJIDeFJhaXsaqbNn@dit127.xiqpnxc.mongodb.net/?retryWrites=true&w=majority").useDb('test');