
interface Session {
    cookie: {
        originalMaxAge: number;
        expires: string;
        secure: boolean;
        httpOnly: boolean;
        path: string;
        sameSite: string;
    }
    passport: {
        user: string
    }
}

interface PrivateMessage {
    author: {
        userID: string;
        username: string;
        displayName: string;
        sessionID: string;
    };
    receiver: string;
    content: {
        type: string;
        content: string
    }
}

interface JoinPrivateMessageRoomData {
    username: string;
    userID: string;
    sessionID: string;

    connectToID: string;
    lastChatID: string;
}

export type { Session, PrivateMessage, JoinPrivateMessageRoomData }