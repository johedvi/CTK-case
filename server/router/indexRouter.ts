import express, { Request, Response } from "express";
const router = express.Router();

router.get("/index",
    async (req : Request, res : Response) => {
        res.status(200).sendFile("index.html", {root : '../client/public/'});
});

module.exports = router;