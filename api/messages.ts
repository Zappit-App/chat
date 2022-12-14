import express from "express";
import { z } from "zod";

import privateMessages from "../models/privateMessage";
import { sessionStore } from "../config/databases";

import { Session } from "../types";

const router = express.Router();

router.post("/get-messages", (req: express.Request, res: express.Response) => {
    const parsedBody = z
        .object({
            auth: z.object({
                username: z.string().min(3).max(16),
                sessionID: z.string(),
            }),
            data: z.object({
                chatID: z.string().length(64),
                chatSkipIndex: z.number(),
            }),
        })
        .required()
        .safeParse(req.body);

    if (!parsedBody.success) return res.status(400).send("invalid-parameters");

    sessionStore.get(parsedBody.data.auth.sessionID, async (err, session: Session | null) => {
        if (err) return res.status(500).send("server-error");
        if (!session || session.passport.user !== parsedBody.data.auth.username)
            return res.status(403).send("unauthorized");

        const messages = await privateMessages
            .find({ chatID: parsedBody.data.data.chatID })
            .limit(50)
            .sort({ createdAt: -1 })
            .skip(50 * parsedBody.data.data.chatSkipIndex);

        res.send(messages);
    });
});

module.exports = router;
