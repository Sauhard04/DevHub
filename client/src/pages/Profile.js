import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaGithub } from 'react-icons/fa';
import {
  fetchUserById,
  fetchGitHubRepos,
  updateUserProfile,
  deleteUserPhoto,
  fetchUserPosts,
  updatePost,
  deletePost
} from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const { currentUser, logout, updateUser } = useContext(AuthContext);
  const [userToShow, setUserToShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
  });
  const [formError, setFormError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [repos, setRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState(null);
  const navigate = useNavigate();

  // Check if viewing own profile or another user's profile
  const isOwnProfile = !id || (currentUser && id === currentUser.id);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (isOwnProfile) {
          // If viewing own profile, use currentUser data
          setUserToShow(currentUser);
          setEditForm({
            name: currentUser.name,
            username: currentUser.username,
          });
        } else {
          // If viewing another user's profile, fetch their data
          const response = await fetchUserById(id);
          setUserToShow(response);
          setEditForm({
            name: response.name,
            username: response.username,
          });
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    if (isOwnProfile && currentUser) {
      fetchUserData();
    } else if (!isOwnProfile) {
      fetchUserData();
    }
  }, [id, isOwnProfile, currentUser]);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!userToShow?.github) return;

      setReposLoading(true);
      setReposError(null);

      try {
        const response = await fetchGitHubRepos(userToShow.github);
        setRepos(response);
      } catch (err) {
        console.error('Error fetching GitHub repos:', err);
        setReposError(err.response?.data?.message || 'Failed to load repositories');
      } finally {
        setReposLoading(false);
      }
    };

    fetchRepos();
  }, [userToShow?.github]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setFormError('');
    setUpdateSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: userToShow?.name || '',
      username: userToShow?.username || '',
    });
    setNewProfileImage(null);
    setPreviewImage(null);
    setFormError('');
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setNewProfileImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !currentUser.id) return;

    try {
      setLoading(true);
      await deleteUserPhoto(currentUser.id);

      // Update local state
      const updatedUser = {
        ...currentUser,
        profileImage: 'https://via.placeholder.com/150'
      };

      updateUser(updatedUser);
      setUpdateSuccess('Profile photo removed successfully');
      setLoading(false);
    } catch (err) {
      console.error('Error removing photo:', err);
      setFormError('Failed to remove profile photo');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setUpdateSuccess('');

    // Basic validation
    if (editForm.username.trim() === '') {
      setFormError('Username cannot be empty');
      return;
    }

    if (editForm.name.trim() === '') {
      setFormError('Name cannot be empty');
      return;
    }

    if (!currentUser || !currentUser.id) return;

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('name', editForm.name);

      if (newProfileImage) {
        formData.append('profileImage', newProfileImage);
      }

      const updatedUser = await updateUserProfile(currentUser.id, formData);

      // Update context and local state
      updateUser(updatedUser);
      setIsEditing(false);
      setNewProfileImage(null);
      setPreviewImage(null);
      setUpdateSuccess('Profile updated successfully');
      setLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setFormError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!userToShow) {
    return (
      <div className="container">
        <div className="alert alert-danger">User not found</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {updateSuccess && (
          <div className="alert alert-success">{updateSuccess}</div>
        )}

        <div className="profile-container">
          {isEditing ? (
            <div className="edit-profile-section">
              <h2>Edit Profile</h2>
              {formError && <div className="alert alert-danger">{formError}</div>}

              <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="profile-image-edit">
                  <img
                    src={previewImage || userToShow.profileImage}
                    alt={userToShow.name}
                    className="profile-img"
                  />
                  <div className="image-edit-controls">
                    <label htmlFor="profileImage" className="btn btn-secondary btn-sm">
                      Change Photo
                    </label>
                    <input
                      type="file"
                      id="profileImage"
                      ref={fileInputRef}
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={handleRemovePhoto}
                    >
                      Remove Photo
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={editForm.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={editForm.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="profile-header">
                <img
                  src={userToShow.profileImage || 'https://via.placeholder.com/150'}
                  alt={userToShow.name}
                  className="profile-img"
                />
                <h1 className="profile-title">{userToShow.name}</h1>
                <p className="profile-username">@{userToShow.username}</p>
              </div>

              <div className="profile-info">
                {userToShow.email && (
                  <div className="profile-info-item">
                    <span className="profile-label">Email:</span>
                    <span className="profile-value">{userToShow.email}</span>
                  </div>
                )}

                {userToShow.github && (
                  <div className="profile-info-item">
                    <span className="profile-label">GitHub:</span>
                    <span className="profile-value">
                      <a
                        href={userToShow.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-link"
                      >
                        {userToShow.github.replace(/^(https?:\/\/)?(www\.)?/i, '')}
                      </a>
                      <small
                        style={{
                          display: 'block',
                          marginTop: '5px',
                          fontSize: '0.8em',
                          opacity: 0.7
                        }}
                      >
                        Make sure this is your GitHub profile URL, not a repository URL
                      </small>
                    </span>
                  </div>
                )}
              </div>

              {isOwnProfile && (
                <div className="profile-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}

          {userToShow && !isEditing && (
            <div className="repo-section">
              <h2 className="repo-title">GitHub Repositories</h2>

              {!userToShow.github && (
                <div className="no-github-url">
                  No GitHub profile URL has been added to this profile
                </div>
              )}

              {userToShow.github && (
                <>
                  {reposLoading && <div className="repo-loading">Loading repositories...</div>}

                  {reposError && (
                    <div className="repo-error">
                      {reposError}
                      <div className="github-url-display">
                        <p>GitHub URL: <code>{userToShow.github}</code></p>
                      </div>
                    </div>
                  )}

                  {!reposLoading && !reposError && repos.length === 0 && (
                    <div className="no-repos">
                      <p>No public repositories found</p>
                      <div className="github-url-display">
                        <p>GitHub URL: <code>{userToShow.github}</code></p>
                        <p>Troubleshooting tips:</p>
                        <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                          <li>Make sure the GitHub profile URL is correct (should be in the format: <code>https://github.com/username</code>)</li>
                          <li>Check that the user has public repositories</li>
                          <li>Verify there are no network connectivity issues</li>
                          <li>GitHub API has rate limits - you might need to wait if you've made too many requests</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {!reposLoading && !reposError && repos.length > 0 && (
                    <div className="repo-list">
                      {repos.map(repo => (
                        <div key={repo.id} className="repo-card">
                          <h3 className="repo-name">
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="repo-link"
                            >
                              {repo.name}
                            </a>
                          </h3>
                          <p className="repo-description">
                            {repo.description || 'No description available'}
                          </p>
                          {repo.language && (
                            <div className="repo-details">
                              <span className="repo-language">
                                <span className={`language-color language-${repo.language.toLowerCase()}`}></span>
                                {repo.language}
                              </span>
                              {repo.stars > 0 && (
                                <span className="repo-stars">
                                  <span className="star-icon"></span>
                                  {repo.stars}
                                </span>
                              )}
                              {repo.forks > 0 && (
                                <span className="repo-forks">
                                  <span className="fork-icon"></span>
                                  {repo.forks}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 