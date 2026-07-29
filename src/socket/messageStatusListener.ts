import { getSocket } from "./socket";

export const startMessageStatusListener = (
    callback: (status: any) => void
) => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("message_status");

    socket.on(
        "message_status",
        callback
    );

};

export const stopMessageStatusListener = () => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("message_status");

};