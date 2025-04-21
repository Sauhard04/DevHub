import React, { useContext, useEffect, useState } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { FaBell, FaComment, FaHeart, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useContext(NotificationContext);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'post':
        navigate(`/post/${notification.postId}`);
        break;
      case 'comment':
        navigate(`/post/${notification.postId}`);
        break;
      case 'connection':
        navigate(`/profile/${notification.senderId}`);
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FaHeart className="notification-icon like" />;
      case 'comment':
        return <FaComment className="notification-icon comment" />;
      case 'connection_request':
        return <FaUserPlus className="notification-icon connection" />;
      case 'connection_accepted':
        return <FaUserPlus className="notification-icon connection" />;
      case 'connection_rejected':
        return <FaUserMinus className="notification-icon connection" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  const getNotificationMessage = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.data.likerName} liked your post${notification.data.postContent ? `: "${notification.data.postContent}"` : ''}`;
      case 'comment':
        return `${notification.data.commenterName} commented on your post: "${notification.data.commentText}"`;
      case 'connection_request':
        return `${notification.data.userName} sent you a connection request`;
      case 'connection_accepted':
        return `${notification.data.userName} accepted your connection request`;
      case 'connection_rejected':
        return `${notification.data.userName} rejected your connection request`;
      default:
        return notification.message;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
      return 'just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // More than 7 days
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {notifications.length > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="no-notifications">
            <FaBell className="no-notifications-icon" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-content">
                  {getNotificationIcon(notification.type)}
                  <div className="notification-details">
                    <p className="notification-message">
                      {getNotificationMessage(notification)}
                    </p>
                    <span className="notification-time">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                </div>
                {!notification.read && <div className="unread-indicator" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 