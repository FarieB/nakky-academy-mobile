import { useEffect, useState } from "react";
import API from "../services/api";

import {
  startNotificationBadgeListener,
  stopNotificationBadgeListener,
} from "../socket/notificationBadgeListener";

export default function useNotificationBadge() {

    const [badge, setBadge] = useState(0);

    useEffect(() => {

        loadBadge();

        startNotificationBadgeListener(setBadge);

        return () => {
            stopNotificationBadgeListener();
        };

    }, []);

    const loadBadge = async () => {

        try {

            const res = await API.get(
                "/notifications/unread-count"
            );

            setBadge(res.data.unread);

        } catch {}

    };

    return badge;
}