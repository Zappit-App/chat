import mongoStore from 'connect-mongo';
import socketIO from 'socket.io';
import { z } from "zod"

import type { Session } from "./types"

import { io } from '.';

// Declare the store to be used to authenticate data
const sessionStore = mongoStore.create({
    mongoUrl: process.env.MONGODB_URI as string,
})

io.on("connection", (socket: socketIO.Socket) => {
    socket.on("join private chat room", (rawPayload: unknown) => {
        const payloadScheme = z.object({
            auth: z.object({
                username: z.string().min(3).max(16),
                sessionID: z.string()
            }),
            data: z.object({
                userID: z.string().length(32),
                connectToID: z.string().length(32)
            })
        }).required()

        const parsedPayload = payloadScheme.safeParse(rawPayload)
        if (!parsedPayload.success) return; // TODO: Maybe send an error to the user
        const { data, auth } = parsedPayload.data;

        try {
            sessionStore.get(auth.sessionID, (err: Error | undefined, session: Session | null) => {
                if (err || !session) return;
                if (session.passport.user !== auth.username) return;

                // Leave all current rooms the user is in
                const userRooms = Array.from(socket.rooms)
                for (let i = 0; i < userRooms.length; i++) {
                    socket.leave(userRooms[i])
                }

                // Join the new room, it's made into an array, sorted and then joined
                // So both parties join the same room
                socket.join([data.userID, data.connectToID].sort().join(""))
                socket.join(data.userID)
            })
        }
        catch (err) {
            return; // TODO: Maybe send an error to the user
        }
    })

    socket.on("private message", (rawPayload: unknown) => {
        const payloadScheme = z.object({
            auth: z.object({
                username: z.string().min(3).max(16),
                sessionID: z.string()
            }),
            data: z.object({
                author: z.string().min(3).max(16),

                userID: z.string().length(32),
                sendToID: z.string().length(32),

                messageID: z.string().length(16),

                // attachments: z.array(z.string()),
                // embeds:  z.array(z.string()),
                // mentions: z.array(z.string()),
                content: z.string().min(1).max(2000),

                createdAt: z.number(),
            })
        })

        const parsedPayload = payloadScheme.safeParse(rawPayload)
        if (!parsedPayload.success) return;
        const { data, auth } = parsedPayload.data;

        try {
            sessionStore.get(auth.sessionID, (err: Error | undefined, session: Session | null) => {
                if (err || !session) return;
                if (session.passport.user !== auth.username) return;

                socket.to([data.userID, data.sendToID].sort().join("")).emit("private message", data)
            })
        }
        catch (err) {
            return; // TODO: Maybe send an error to the user
        }
    })
})
