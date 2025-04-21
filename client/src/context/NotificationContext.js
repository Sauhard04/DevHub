import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../utils/api';
import { AuthContext } from './AuthContext';
import { io } from 'socket.io-client';

export const NotificationContext = createContext();

// Create notification sound URL
const notificationSoundUrl = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=notification-sound-7062.mp3';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);
  const audioRef = useRef(new Audio(notificationSoundUrl));
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('notification_sound_enabled') !== 'false'
  );
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(
    localStorage.getItem('desktop_notifications_enabled') === 'true'
  );
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Save preferences to local storage when they change
  useEffect(() => {
    localStorage.setItem('notification_sound_enabled', soundEnabled);
    localStorage.setItem('desktop_notifications_enabled', desktopNotificationsEnabled);
  }, [soundEnabled, desktopNotificationsEnabled]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user) {
      // Create socket connection
      const newSocket = io('http://localhost:5000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      // Handle connection events
      newSocket.on('connect', () => {
        console.log('Socket connected');
        // Send authentication with user ID
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  // Authenticate socket with user ID when socket and user are available
  useEffect(() => {
    if (socket && user) {
      // Set up real-time notification listener
      socket.on('notification', (notification) => {
        // Play sound if enabled and not a notification we're fetching on initial load
        if (soundEnabled && !loading) {
          playNotificationSound();
        }

        // Show desktop notification if enabled
        if (desktopNotificationsEnabled && !loading) {
          showDesktopNotification(notification);
        }

        setNotifications(prev => {
          // Check if notification already exists to avoid duplicates
          if (prev.some(n => n.id === notification.id)) {
            return prev;
          }
          return [notification, ...prev];
        });
      });
    }
  }, [socket, user, soundEnabled, desktopNotificationsEnabled, loading]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Reset the audio to the beginning
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Error playing sound:', e));
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  // Show desktop notification
  const showDesktopNotification = (notification) => {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notifications");
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      createDesktopNotification(notification);
    }
    // Otherwise, request permission
    else if (Notification.permission !== "denied" && !permissionRequested) {
      setPermissionRequested(true);
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          createDesktopNotification(notification);
        }
      });
    }
  };

  // Create the desktop notification
  const createDesktopNotification = (notification) => {
    try {
      const title = "DevHub Notification";
      let options = {
        body: notification.message,
        icon: '/logo192.png', // Use your app's icon
      };

      const notif = new Notification(title, options);

      // Close notification after 5 seconds
      setTimeout(() => {
        notif.close();
      }, 5000);

      // Handle notification click - navigate to notifications page
      notif.onclick = () => {
        window.focus();
        window.location.href = '/notifications';
        notif.close();
      };
    } catch (error) {
      console.error('Error creating desktop notification:', error);
    }
  };

  // Toggle notification sound
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Toggle desktop notifications
  const toggleDesktopNotifications = () => {
    if (!desktopNotificationsEnabled) {
      // Request permission if not already granted
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setDesktopNotificationsEnabled(true);
          }
        });
      } else if (Notification.permission === "granted") {
        setDesktopNotificationsEnabled(true);
      }
    } else {
      setDesktopNotificationsEnabled(false);
    }
  };

  // Fetch initial notifications
  useEffect(() => {
    const getNotifications = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await fetchNotifications();
        setNotifications(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    getNotifications();
  }, [user]);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  // Get unread notification count
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        soundEnabled,
        toggleSound,
        desktopNotificationsEnabled,
        toggleDesktopNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 