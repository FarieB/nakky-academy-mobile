import { getSocket } from "./socket";

export const startNotificationBadgeListener = (
    callback: (count: number) => void
) => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("notification_badge");

    socket.on(
        "notification_badge",
        ({ unread }) => {
            callback(unread);
        }
    );

};

export const stopNotificationBadgeListener = () => {

    const socket = getSocket();

    if (!socket) return;

    socket.off("notification_badge");

};