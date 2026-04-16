import { useEffect, useMemo, useState } from "react";
import {
  clearAdminNotifications,
  clearUserNotifications,
  fetchAdminNotifications,
  fetchUserNotifications,
  markAdminNotificationRead,
  markUserNotificationRead
} from "../api/notifications.js";
import { getAdminUser, getUser, isAdminLoggedIn, isUserLoggedIn } from "../utils/auth.js";

function NotificationCenter({ liveNotifications = [] }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const adminLoggedIn = isAdminLoggedIn();
  const userLoggedIn = isUserLoggedIn();
  const admin = getAdminUser();
  const user = getUser();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (adminLoggedIn) {
          const response = await fetchAdminNotifications();
          setNotifications(response.data);
        } else if (userLoggedIn) {
          const response = await fetchUserNotifications();
          setNotifications(response.data);
        } else {
          setNotifications([]);
        }
        setError("");
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadNotifications();
  }, [adminLoggedIn, userLoggedIn]);

  useEffect(() => {
    if (!liveNotifications.length) {
      return;
    }

    const next = liveNotifications.filter((item) => {
      if (adminLoggedIn) {
        return item.audience === "admin";
      }

      if (userLoggedIn) {
        return item.audience === "user" && item.targetUserId === user?.id;
      }

      return false;
    });

    if (next.length > 0) {
      setNotifications((current) => {
        const merged = [...next.reverse(), ...current];
        const unique = merged.filter(
          (item, index, array) =>
            array.findIndex((candidate) => candidate._id === item._id) === index
        );
        return unique.slice(0, 30);
      });
    }
  }, [adminLoggedIn, liveNotifications, user?.id, userLoggedIn]);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  const handleRead = async (notification) => {
    try {
      if (adminLoggedIn) {
        await markAdminNotificationRead(notification._id);
      } else if (userLoggedIn) {
        await markUserNotificationRead(notification._id);
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item
        )
      );
    } catch (markError) {
      setError(markError.message);
    }
  };

  const handleClearAll = async () => {
    try {
      if (adminLoggedIn) {
        await clearAdminNotifications();
      } else if (userLoggedIn) {
        await clearUserNotifications();
      }

      setNotifications([]);
      setError("");
    } catch (clearError) {
      setError(clearError.message);
    }
  };

  if (!adminLoggedIn && !userLoggedIn) {
    return null;
  }

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-center__trigger"
        onClick={() => setOpen((current) => !current)}
      >
        Notifications
        {unreadCount > 0 ? <span className="notification-center__count">{unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-center__panel card">
          <div className="notification-center__header">
            <strong>
              {adminLoggedIn ? admin?.email || "Admin" : user?.email || "User"}
            </strong>
            <div className="notification-center__actions">
              <span>{unreadCount} unread</span>
              {notifications.length > 0 ? (
                <button
                  type="button"
                  className="notification-center__clear"
                  onClick={handleClearAll}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          {error ? <p className="message message--error">{error}</p> : null}

          <div className="notification-center__list">
            {notifications.length === 0 ? <p>No notifications yet.</p> : null}

            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                className={`notification-item ${notification.isRead ? "notification-item--read" : ""}`}
                onClick={() => handleRead(notification)}
              >
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationCenter;
