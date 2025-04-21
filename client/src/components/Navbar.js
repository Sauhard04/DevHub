import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, currentUser } = useContext(AuthContext);
  const { getUnreadCount } = useContext(NotificationContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Update the unread count on component mount and when notifications change
  useEffect(() => {
    if (isAuthenticated) {
      setUnreadCount(getUnreadCount());

      // Set up interval to check for new unread count every 5 seconds
      const intervalId = setInterval(() => {
        setUnreadCount(getUnreadCount());
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, getUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="logo">
          DevHub
        </Link>
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Dashboard
            </NavLink>
            <NavLink to="/connections" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Connections
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => isActive ? "nav-link notification-link active" : "nav-link notification-link"}>
              Notifications
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              About
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "user-avatar-link active" : "user-avatar-link"}>
              <img
                src={currentUser?.profileImage || 'https://via.placeholder.com/40'}
                alt={currentUser?.name || 'Profile'}
                className="user-avatar"
              />
            </NavLink>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              About
            </NavLink>
            <NavLink to="/login" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Register
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 