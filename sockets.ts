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
    const parsedAuthData = z.object({
        username: z.string().min(3).max(16),
        sessionID: z.string()
    }).required().safeParse(socket.handshake.auth)

    if (!parsedAuthData.success) {
        socket.emit("error", "missing-parameters")
        return socket.disconnect()
    }

    try {
        sessionStore.get(parsedAuthData.data.sessionID, (err: Error | undefined, session: Session | null) => {
            if (err) {
                socket.emit("error", "server-error")
                return socket.disconnect()
            }

            if (session == null) {
                socket.emit("error", "invalid-session")
                return socket.disconnect()
            }

            if (Date.now() > new Date(session.cookie.expires).getTime()) {
                socket.emit("error", "expired-session")
                return socket.disconnect()
            }

            if (session.passport.user !== parsedAuthData.data.username) {
                socket.emit("error", "unauthorized")
                return socket.disconnect()
            }

        })
    } catch (err) {
        return socket.emit("error", "server-error")
    }

    socket.on("join private chat room", (rawPayload: unknown) => {
        const parsedPayload = z.object({
            userID: z.string().length(32),
            connectToID: z.string().length(32)
        }).required().safeParse(rawPayload)

        if (!parsedPayload.success) return socket.emit("error", "invalid-parameters")

        // Leave all current rooms the user is in
        const userRooms = Array.from(socket.rooms)
        for (let i = 0; i < userRooms.length; i++) {
            socket.leave(userRooms[i])
        }

        // Join the new room, it's made into an array, sorted and then joined
        // So both parties join the same room
        socket.join([parsedPayload.data.userID, parsedPayload.data.connectToID].sort().join(""))
        socket.join(parsedPayload.data.userID)
    })

    socket.on("private message", (rawPayload: unknown) => {
        const parsedPayload = z.object({
            author: z.string().min(3).max(16),

            userID: z.string().length(32),
            sendToID: z.string().length(32),

            messageID: z.string().length(16),

            // attachments: z.array(z.string()),
            // embeds:  z.array(z.string()),
            // mentions: z.array(z.string()),
            content: z.string().min(1).max(2000),

            createdAt: z.number(),
        }).required().safeParse(rawPayload)

        if (!parsedPayload.success) return socket.emit("error", "invalid-parameters")

        socket.to([parsedPayload.data.userID, parsedPayload.data.sendToID].sort().join("")).emit("private message", parsedPayload.data)
    })
})
