import React, { useState, useEffect } from 'react';
import { FaGithub, FaThumbsUp, FaComment, FaShare, FaRegThumbsUp, FaExternalLinkAlt } from 'react-icons/fa';
import { toggleLike, addComment, fetchGitHubReadme } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import './Post.css';

const Post = ({ post }) => {
  const [localPost, setLocalPost] = useState(post || {});
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [readmeContent, setReadmeContent] = useState('');
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState('');
  const navigate = useNavigate();

  // Update localPost when post changes from parent
  useEffect(() => {
    if (post && typeof post === 'object') {
      setLocalPost(post);
    }
  }, [post]);

  // Fetch README content when githubRepo is present
  useEffect(() => {
    const loadReadme = async () => {
      if (!post.githubRepo) return;
      
      setReadmeLoading(true);
      setReadmeError('');
      
      try {
        const readmeData = await fetchGitHubReadme(post.githubRepo);
        setReadmeContent(readmeData.content);
      } catch (err) {
        console.error('Error fetching README:', err);
        setReadmeError('Could not load repository README');
      } finally {
        setReadmeLoading(false);
      }
    };
    
    if (post.githubRepo) {
      loadReadme();
    }
  }, [post.githubRepo]);

  if (!post || typeof post !== 'object') {
    return null; // Don't render invalid posts
  }

  const { id, content, imageUrl, githubRepo, user, timestamp } = post;
  
  // Ensure user object exists
  if (!user || typeof user !== 'object') {
    return null;
  }
  
  // Format timestamp safely
  const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
  
  // Check if the post is liked by current user
  const userId = localStorage.getItem('userId');
  const isLiked = Array.isArray(localPost.likes) && 
    localPost.likes.some(like => like.userId === userId);

  // Format comment timestamps safely
  const formatCommentDate = (timestamp) => {
    return timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
  };

  // Get first 2-3 lines of README for preview
  const getReadmePreview = () => {
    if (!readmeContent) return '';
    
    const lines = readmeContent.split('\n').filter(line => line.trim());
    const previewLines = lines.slice(0, 3);
    return previewLines.join('\n');
  };

  // Navigate to post detail page
  const navigateToPost = () => {
    navigate(`/post/${id}`);
  };

  // Handle like toggle
  const handleLike = async () => {
    if (!userId) {
      setError('You must be logged in to like posts');
      return;
    }

    try {
      setError('');
      const updatedPost = await toggleLike(id);
      if (updatedPost) {
        setLocalPost(updatedPost);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like status. Please try again.');
    }
  };

  // Handle showing/hiding comments
  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to comment');
      return;
    }
    
    if (!commentText.trim()) return;
    
    try {
      setError('');
      setIsSubmitting(true);
      const updatedPost = await addComment(id, commentText);
      if (updatedPost) {
        setLocalPost(updatedPost);
        setCommentText('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="post-item">
      <div className="post-header">
        <div className="post-user-info">
          <img 
            src={user.profileImage || 'https://via.placeholder.com/40'} 
            alt={user.name || 'User'} 
            className="post-avatar" 
          />
          <div>
            <h3 className="post-username">{user.name || 'Unknown User'}</h3>
            <span className="post-time">{formattedDate}</span>
          </div>
        </div>
      </div>
      
      {content && <p className="post-content">{content}</p>}
      
      {imageUrl && (
        <div className="post-image-container">
          <img src={imageUrl} alt="Post content" className="post-image" />
        </div>
      )}
      
      {githubRepo && (
        <div className="github-content">
          <a 
            href={githubRepo} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="github-repo-link"
          >
            <span className="github-icon"><FaGithub /></span>
            <span>{typeof githubRepo === 'string' && githubRepo.includes('/') 
              ? githubRepo.split('/').slice(-2).join('/')
              : 'GitHub Repository'}</span>
          </a>
          
          {readmeLoading && (
            <div className="readme-loading">Loading repository README...</div>
          )}
          
          {readmeError && (
            <div className="readme-error">{readmeError}</div>
          )}
          
          {!readmeLoading && !readmeError && readmeContent && (
            <div className="readme-preview">
              <pre className="readme-text">{getReadmePreview()}</pre>
              <a 
                href={githubRepo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="more-link"
              >
                more... <FaExternalLinkAlt size={12} />
              </a>
            </div>
          )}
        </div>
      )}
      
      {error && <div className="post-error">{error}</div>}
      
      <div className="post-stats">
        {Array.isArray(localPost.likes) && localPost.likes.length > 0 && (
          <div className="likes-count">
            <FaThumbsUp size={12} className="stats-icon" />
            <span>{localPost.likes.length}</span>
          </div>
        )}
        
        {Array.isArray(localPost.comments) && localPost.comments.length > 0 && (
          <div className="comments-count" onClick={toggleComments}>
            <span>{localPost.comments.length} comment{localPost.comments.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      <div className="post-actions">
        <button 
          className={`post-action-btn ${isLiked ? 'active' : ''}`}
          onClick={handleLike}
        >
          <span className="action-icon">
            {isLiked ? <FaThumbsUp size={14} /> : <FaRegThumbsUp size={14} />}
          </span>
          <span className="action-text">Like</span>
        </button>
        <button 
          className={`post-action-btn ${showComments ? 'active' : ''}`}
          onClick={toggleComments}
        >
          <span className="action-icon"><FaComment size={14} /></span>
          <span className="action-text">Comment</span>
        </button>
        <button 
          className="post-action-btn"
          onClick={navigateToPost}
        >
          <span className="action-icon"><FaShare size={14} /></span>
          <span className="action-text">View</span>
        </button>
      </div>
      
      {showComments && (
        <div className="comments-section">
          {Array.isArray(localPost.comments) && localPost.comments.length > 0 && (
            <div className="comments-list">
              {localPost.comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <img 
                    src={comment.user.profileImage || 'https://via.placeholder.com/40'} 
                    alt={comment.user.name || 'User'} 
                    className="comment-avatar" 
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.user.name || 'Unknown User'}</span>
                      <span className="comment-time">{formatCommentDate(comment.timestamp)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              className="comment-input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              className="comment-submit-btn"
              disabled={!commentText.trim() || isSubmitting}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Post; 