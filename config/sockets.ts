import socketIO from 'socket.io';
import { z } from "zod"

import PrivateMessages from "../models/privateMessage"

import { io } from '..';
import { sessionStore } from "./databases"

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
        sessionStore.get(parsedAuthData.data.sessionID, (err, session) => {
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

            authorID: z.string().length(32),
            recipientID: z.string().length(32),

            messageID: z.string().length(81).refine((messageID: string) => {
                const messageIDArray = messageID.split("_")
                if (messageIDArray[0].length !== 64) return false;
                if (messageIDArray[1].length !== 16) return false;
                return true
            }),

            content: z.string().min(1).max(2000),

            createdAt: z.number(),
        }).required().safeParse(rawPayload)

        if (!parsedPayload.success) return socket.emit("error", "invalid-parameters")

        socket.to([parsedPayload.data.authorID, parsedPayload.data.recipientID].sort().join("")).emit("private message", parsedPayload.data)

        // Store the message
        const privateMessage = new PrivateMessages({
            ...parsedPayload.data,
            chatID: [parsedPayload.data.authorID, parsedPayload.data.recipientID].sort().join("")
        })
        privateMessage.save()
    })
})
