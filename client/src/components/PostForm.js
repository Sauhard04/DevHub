import React, { useState, useRef } from 'react';
import { FaGithub, FaImage } from 'react-icons/fa';
import './PostForm.css';

const PostForm = ({ onPostSubmit }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showGithubInput, setShowGithubInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleGithubClick = () => {
    setShowGithubInput(!showGithubInput);
  };

  const handleGithubChange = (e) => {
    setGithubRepo(e.target.value);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview('');
    fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content && !image && !githubRepo) {
      return; // Don't submit empty posts
    }
    
    // Create post object
    const post = {
      content,
      image,
      githubRepo: githubRepo.trim() || null,
      timestamp: new Date()
    };
    
    // Pass post data to parent component
    onPostSubmit(post);
    
    // Reset form
    setContent('');
    setImage(null);
    setImagePreview('');
    setGithubRepo('');
    setShowGithubInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="post-form-container">
      <form className="post-form" onSubmit={handleSubmit}>
        <textarea
          className="post-content"
          placeholder="What's on your mind?"
          value={content}
          onChange={handleContentChange}
        />
        
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button 
              type="button" 
              className="remove-image-btn"
              onClick={handleRemoveImage}
            >
              ×
            </button>
          </div>
        )}
        
        {showGithubInput && (
          <div className="github-input-container">
            <input
              type="text"
              placeholder="Enter GitHub repository URL"
              value={githubRepo}
              onChange={handleGithubChange}
              className="github-input"
            />
          </div>
        )}
        
        <div className="post-form-actions">
          <div className="post-form-options">
            <button
              type="button"
              className="option-btn"
              onClick={handleImageClick}
              title="Add Image"
            >
              <FaImage />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            <button
              type="button"
              className="option-btn"
              onClick={handleGithubClick}
              title="Add GitHub Repository"
            >
              <FaGithub />
            </button>
          </div>
          
          <button 
            type="submit" 
            className="post-submit-btn"
            disabled={!content && !image && !githubRepo}
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm; 