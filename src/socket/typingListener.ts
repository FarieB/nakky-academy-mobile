import { getSocket } from "./socket";

export const startTypingListener = (

    onTyping: (senderId: string) => void,

    onStopTyping: (senderId: string) => void

) => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("typing");
    socket.off("stop_typing");

    socket.on("typing", ({ senderId }) => {

        onTyping(senderId);

    });

    socket.on("stop_typing", ({ senderId }) => {

        onStopTyping(senderId);

    });

};

export const stopTypingListener = () => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("typing");
    socket.off("stop_typing");

};