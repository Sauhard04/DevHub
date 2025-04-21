import axios from 'axios';

// Get all users
export const fetchUsers = async () => {
  try {
    const res = await axios.get('/api/users');
    return res.data;
  } catch (err) {
    console.error('Error fetching users:', err);
    throw err;
  }
};

// Get user by ID
export const fetchUserById = async (userId) => {
  try {
    const res = await axios.get(`/api/users/${userId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching user:', err);
    throw err;
  }
};

// Search users by name
export const searchUsers = async (query) => {
  try {
    const res = await axios.get(`/api/users/search?query=${query}`);
    return res.data;
  } catch (err) {
    console.error('Error searching users:', err);
    throw err;
  }
};

/**
 * Extracts GitHub username from URL
 * @param {string} url GitHub profile URL
 * @returns {string|null} GitHub username or null if invalid URL
 */
const extractGitHubUsername = (url) => {
  if (!url) return null;

  try {
    console.log('Extracting username from GitHub URL:', url);

    // First, try to handle URLs with extra parts or trailing components
    // Example: https://github.com/username/repositories or https://github.com/username?tab=repositories
    // Match the username part regardless of what follows
    const mainRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)(?:\/.*|\?.*|#.*)?$/;
    const mainMatch = url.match(mainRegex);

    if (mainMatch && mainMatch[1]) {
      console.log('Extracted username via main regex:', mainMatch[1]);
      return mainMatch[1];
    }

    // Try a simpler regex focusing just on the username part
    const simpleRegex = /github\.com\/([a-zA-Z0-9-]+)/;
    const simpleMatch = url.match(simpleRegex);

    if (simpleMatch && simpleMatch[1]) {
      console.log('Extracted username via simple regex:', simpleMatch[1]);
      return simpleMatch[1];
    }

    // If URL is just the username
    if (/^[a-zA-Z0-9-]+$/.test(url)) {
      console.log('URL appears to be just the username:', url);
      return url;
    }

    console.log('Could not extract GitHub username from URL:', url);
    console.log('Please use format: https://github.com/username');
    return null;
  } catch (error) {
    console.error('Error extracting GitHub username:', error);
    return null;
  }
};

/**
 * Fetches GitHub repositories for a user
 * @param {string} githubUrl User's GitHub profile URL
 * @returns {Promise<Array>} List of repositories
 */
export const fetchGitHubRepos = async (githubUrl) => {
  try {
    if (!githubUrl) {
      console.log('No GitHub URL provided for fetching repositories');
      return [];
    }

    // Trim the URL to remove any whitespace
    const trimmedUrl = githubUrl.trim();
    console.log('Processing GitHub URL (trimmed):', trimmedUrl);

    const username = extractGitHubUsername(trimmedUrl);
    if (!username) {
      console.error('Could not extract valid GitHub username from URL:', trimmedUrl);
      console.log('Please ensure the GitHub URL is in the format: https://github.com/username');
      return [];
    }

    console.log(`Making GitHub API request for username: "${username}"`);

    // Create a clean axios instance without auth headers to avoid CORS issues
    const githubAxios = axios.create();
    delete githubAxios.defaults.headers.common['x-auth-token']; // Remove auth token for GitHub API calls

    const apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`;
    console.log('GitHub API request URL:', apiUrl);

    const response = await githubAxios.get(apiUrl);
    console.log('GitHub API response status:', response.status);

    if (response.status === 200) {
      if (!Array.isArray(response.data)) {
        console.error('GitHub API returned non-array data:', response.data);
        return [];
      }

      if (response.data.length === 0) {
        console.log(`User "${username}" doesn't have any public repositories`);
        return [];
      }

      const repos = response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language
      }));
      console.log(`Successfully fetched ${repos.length} repositories for ${username}`);
      return repos;
    } else {
      console.error('GitHub API returned non-200 status:', response.status);
      return [];
    }
  } catch (err) {
    // Handle rate limiting
    if (err.response && err.response.status === 403) {
      console.error('GitHub API rate limit exceeded');
      console.log('Try again later or use a GitHub token for higher rate limits');
      return [];
    }

    // Handle user not found
    if (err.response && err.response.status === 404) {
      console.error(`GitHub user not found: "${extractGitHubUsername(githubUrl) || githubUrl}"`);
      console.log('Check that the username is correct and the user exists on GitHub');
      return [];
    }

    console.error('Error fetching GitHub repositories:', err.message || err);
    if (err.response) {
      console.error('Error response data:', err.response.data);
      console.error('Error response status:', err.response.status);
    }
    return [];
  }
};

// Update user profile
export const updateUserProfile = async (userId, userData) => {
  try {
    const res = await axios.put(`/api/users/${userId}`, userData);
    return res.data;
  } catch (err) {
    console.error('Error updating user profile:', err);
    throw err;
  }
};

// Delete user profile photo
export const deleteUserPhoto = async (userId) => {
  try {
    const res = await axios.delete(`/api/users/${userId}/photo`);
    return res.data;
  } catch (err) {
    console.error('Error deleting user photo:', err);
    throw err;
  }
};

// Get all connections for a user
export const fetchUserConnections = async (userId) => {
  try {
    const res = await axios.get(`/api/connections/${userId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching connections:', err);
    throw err;
  }
};

// Send a connection request
export const sendConnectionRequest = async (userId) => {
  try {
    const res = await axios.post('/api/connections/request', { userId });
    return res.data;
  } catch (err) {
    console.error('Error sending connection request:', err);
    throw err;
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (requestId) => {
  try {
    const res = await axios.put(`/api/connections/accept/${requestId}`);
    return res.data;
  } catch (err) {
    console.error('Error accepting connection request:', err);
    throw err;
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (requestId) => {
  try {
    const res = await axios.put(`/api/connections/reject/${requestId}`);
    return res.data;
  } catch (err) {
    console.error('Error rejecting connection request:', err);
    throw err;
  }
};

// Remove an existing connection
export const removeConnection = async (connectionId) => {
  try {
    const res = await axios.delete(`/api/connections/${connectionId}`);
    return res.data;
  } catch (err) {
    console.error('Error removing connection:', err);
    throw err;
  }
};

// Get all notifications for the current user
export const fetchNotifications = async () => {
  try {
    const res = await axios.get('/api/notifications');
    return res.data;
  } catch (err) {
    console.error('Error fetching notifications:', err);
    throw err;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const res = await axios.put(`/api/notifications/${notificationId}/read`);
    return res.data;
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const res = await axios.put('/api/notifications/read-all');
    return res.data;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    throw err;
  }
};

// Create a new post
export const createPost = async (postData) => {
  try {
    const formData = new FormData();

    if (postData.content) {
      formData.append('content', postData.content);
    }

    if (postData.image) {
      formData.append('image', postData.image);
    }

    if (postData.githubRepo) {
      formData.append('githubRepo', postData.githubRepo);
    }

    const res = await axios.post('/api/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return res.data;
  } catch (err) {
    console.error('Error creating post:', err);
    throw err;
  }
};

// Get feed posts
export const fetchPosts = async () => {
  try {
    const res = await axios.get('/api/posts');
    return res.data;
  } catch (err) {
    console.error('Error fetching posts:', err);
    throw err;
  }
};

// Like or unlike a post
export const toggleLike = async (postId) => {
  try {
    const res = await axios.put(`/api/posts/${postId}/like`);
    return res.data;
  } catch (err) {
    console.error('Error toggling like:', err);
    throw err;
  }
};

// Add comment to a post
export const addComment = async (postId, text) => {
  try {
    const res = await axios.post(`/api/posts/${postId}/comment`, { text });
    return res.data;
  } catch (err) {
    console.error('Error adding comment:', err);
    throw err;
  }
};

// Fetch GitHub README content for a repository
export const fetchGitHubReadme = async (repoUrl) => {
  console.log('Fetching GitHub README for repo:', repoUrl);

  try {
    // Extract owner and repo name from the URL
    const urlParts = repoUrl.replace(/\/$/, '').split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    if (!owner || !repo) {
      console.error('Invalid GitHub repo URL format:', repoUrl);
      throw new Error('Invalid GitHub repository URL');
    }

    // Create a clean axios instance without auth headers to avoid CORS issues
    const githubAxios = axios.create();
    delete githubAxios.defaults.headers.common['x-auth-token']; // Remove auth token for GitHub API calls

    // First try to get the default README
    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
      console.log('Making request to:', apiUrl);

      const res = await githubAxios.get(apiUrl);

      // The content is base64 encoded, so we need to decode it
      const readmeContent = atob(res.data.content);
      return {
        content: readmeContent,
        url: repoUrl
      };
    } catch (readmeErr) {
      console.warn('No README found in repository root, trying with alternative names');
      // If default README not found, try common alternatives
      const commonNames = ['README.md', 'Readme.md', 'readme.md', 'README.txt', 'readme.txt'];

      for (const name of commonNames) {
        try {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${name}`;
          const res = await githubAxios.get(apiUrl);

          // The content is base64 encoded, so we need to decode it
          const readmeContent = atob(res.data.content);
          return {
            content: readmeContent,
            url: repoUrl
          };
        } catch (err) {
          continue; // Try next name
        }
      }

      // If we got here, no README was found
      throw new Error('No README file found in repository');
    }
  } catch (err) {
    console.error('Error fetching GitHub README:', err);
    console.error('Error details:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    throw err;
  }
};

/**
 * Fetches posts for a specific user
 * @param {string} userId User ID
 * @returns {Promise<Array>} List of posts
 */
export const fetchUserPosts = async (userId) => {
  try {
    if (!userId) {
      console.error('No user ID provided for fetching posts');
      return [];
    }

    console.log('Fetching posts for user ID:', userId);
    const response = await axios.get(`/api/posts/user/${userId}`);
    console.log('Posts API response:', response.status, response.data);

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.warn('Posts API returned unexpected data format:', response.data);
      return [];
    }
  } catch (err) {
    console.error('Error fetching user posts:', err);
    return [];
  }
};

// Update a post
export const updatePost = async (postId, postData) => {
  try {
    const formData = new FormData();

    if (postData.content !== undefined) {
      formData.append('content', postData.content);
    }

    if (postData.image) {
      formData.append('image', postData.image);
    }

    if (postData.githubRepo !== undefined) {
      formData.append('githubRepo', postData.githubRepo);
    }

    const res = await axios.put(`/api/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return res.data;
  } catch (err) {
    console.error('Error updating post:', err);
    throw err;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    const res = await axios.delete(`/api/posts/${postId}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting post:', err);
    throw err;
  }
}; 