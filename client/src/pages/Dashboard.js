import React, { useState, useEffect, useContext } from 'react';
import { fetchPosts, createPost } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import PostForm from '../components/PostForm';
import Feed from '../components/Feed';
import './Dashboard.css';

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useContext(AuthContext);

  // Load posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await fetchPosts();
        setPosts(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading posts:', err);
        setError('Failed to load posts');
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Handle post submission
  const handlePostSubmit = async (postData) => {
    try {
      // Show optimistic update with a temporary ID
      const tempPost = {
        id: `temp-${Date.now()}`,
        content: postData.content,
        imageUrl: postData.image ? URL.createObjectURL(postData.image) : null,
        githubRepo: postData.githubRepo,
        timestamp: new Date(),
        user: {
          id: currentUser.id,
          name: currentUser.name,
          profileImage: currentUser.profileImage
        },
        likes: [],
        comments: []
      };
      
      // Add to the beginning of the posts array
      setPosts(prevPosts => [tempPost, ...prevPosts]);
      
      // Send to the server
      const newPost = await createPost(postData);
      
      // Replace the temporary post with the actual post from the server
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === tempPost.id ? newPost : post
        )
      );
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
      
      // Remove the temporary post on error
      setPosts(prevPosts => 
        prevPosts.filter(post => post.id !== `temp-${Date.now()}`)
      );
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-container">
          <div className="post-form-section">
            <PostForm onPostSubmit={handlePostSubmit} />
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="feed-section">
            <Feed posts={posts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 