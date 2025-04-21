import React, { useState, useEffect, useContext } from 'react';
import { fetchUserConnections, removeConnection, fetchUsers, sendConnectionRequest } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Connections.css';
import { FaGithub } from 'react-icons/fa';

const Connections = () => {
  const { currentUser } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('connections');
  const [processingConnections, setProcessingConnections] = useState([]);

  // Load user connections
  useEffect(() => {
    const loadConnections = async () => {
      if (!currentUser || !currentUser.id) {
        console.log('No current user or user ID');
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log('Loading connections for user:', currentUser.id);
        const data = await fetchUserConnections(currentUser.id);
        console.log('Received connections data:', data);

        if (Array.isArray(data)) {
          console.log('Setting connections:', data);
          setConnections(data);
        } else {
          console.error('Invalid connections data:', data);
          setError('Failed to load connections: Invalid data format');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading connections:', err);
        setError('Failed to load connections');
        setLoading(false);
      }
    };

    loadConnections();
  }, [currentUser]);

  // Load suggested connections
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!currentUser) return;

      try {
        const users = await fetchUsers();
        // Filter out current user and existing connections
        const existingConnectionIds = connections.map(conn => conn.user.id);

        const filtered = users.filter(user =>
          user.id !== currentUser.id &&
          !existingConnectionIds.includes(user.id)
        );
        setSuggestedUsers(filtered);
      } catch (err) {
        console.error('Error loading suggested users:', err);
      }
    };

    if (!loading && connections.length >= 0) {
      loadSuggestions();
    }
  }, [currentUser, connections, loading]);

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await removeConnection(connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    } catch (err) {
      console.error('Error removing connection:', err);
      setError('Failed to remove connection');
    }
  };

  const handleConnect = async (userId) => {
    try {
      setProcessingConnections(prev => [...prev, userId]);
      await sendConnectionRequest(userId);

      // Update suggested users to remove the connected user
      setSuggestedUsers(prev => prev.filter(user => user.id !== userId));

      // Reload connections to include the new connection
      const data = await fetchUserConnections(currentUser.id);
      setConnections(data);

      setProcessingConnections(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('Error connecting with user:', err);
      setError('Failed to connect with user');
      setProcessingConnections(prev => prev.filter(id => id !== userId));
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conn.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuggestions = suggestedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="connections-page">
      <div className="container">
        <div className="connections-container">
          <div className="connections-header">
            <h1 className="page-title">Connections</h1>
            <div className="connections-search">
              <input
                type="text"
                placeholder="Search connections..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          </div>

          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
              onClick={() => setActiveTab('connections')}
            >
              My Connections
            </button>
            <button
              className={`tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              Suggestions
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {activeTab === 'connections' && (
            <div className="connections-list">
              {loading ? (
                <div className="loading">Loading connections...</div>
              ) : filteredConnections.length === 0 ? (
                <div className="no-connections">
                  {searchTerm
                    ? 'No connections matching your search'
                    : 'You have no connections yet. Check out suggestions to find developers to connect with.'}
                </div>
              ) : (
                filteredConnections.map(connection => (
                  <div key={connection.id} className="connection-card">
                    <div className="connection-avatar">
                      <img
                        src={connection.user.profileImage || 'https://via.placeholder.com/60'}
                        alt={connection.user.name}
                      />
                    </div>
                    <div className="connection-info">
                      <h3 className="connection-name">{connection.user.name}</h3>
                      <p className="connection-username">@{connection.user.username}</p>
                      {connection.user.githubUrl && (
                        <a
                          href={connection.user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="github-link"
                        >
                          <FaGithub className="github-icon" />
                          GitHub Profile
                        </a>
                      )}
                      <p className="connection-since">
                        Connected since: {new Date(connection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveConnection(connection.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="suggestions-list">
              {suggestedUsers.length === 0 ? (
                <div className="no-suggestions">
                  {searchTerm
                    ? 'No suggestions matching your search'
                    : 'No suggestions available at the moment.'}
                </div>
              ) : (
                filteredSuggestions.map(user => (
                  <div key={user.id} className="suggestion-card">
                    <div className="suggestion-avatar">
                      <img
                        src={user.profileImage || 'https://via.placeholder.com/60'}
                        alt={user.name}
                      />
                    </div>
                    <div className="suggestion-info">
                      <h3 className="suggestion-name">{user.name}</h3>
                      <p className="suggestion-username">@{user.username}</p>
                      {user.githubUrl && (
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="github-link"
                        >
                          <FaGithub className="github-icon" />
                          GitHub Profile
                        </a>
                      )}
                    </div>
                    <button
                      className="btn-connect"
                      onClick={() => handleConnect(user.id)}
                      disabled={processingConnections.includes(user.id)}
                    >
                      {processingConnections.includes(user.id) ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections; 