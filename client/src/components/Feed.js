import React from 'react';
import Post from './Post';
import './Feed.css';

const Feed = ({ posts }) => {
  // Make sure posts is an array and filter out any invalid posts
  const validPosts = Array.isArray(posts) 
    ? posts.filter(post => 
        post && 
        typeof post === 'object' && 
        post.id && 
        post.user && 
        typeof post.user === 'object')
    : [];

  if (validPosts.length === 0) {
    return (
      <div className="no-posts">
        <p>No posts yet. Be the first to post something!</p>
      </div>
    );
  }

  return (
    <div className="feed-container">
      {validPosts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default Feed; 