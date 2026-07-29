import { getSocket } from "./socket";

export const startUnreadListener = (
    callback: (counts: any[]) => void
) => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("unread_counts");

    socket.on(
        "unread_counts",
        callback
    );

};

export const stopUnreadListener = () => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("unread_counts");

};