import React, { useState, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    github: '',
    linkedin: '',
    password: '',
    profileImage: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [formError, setFormError] = useState('');
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setFormData({
        ...formData,
        profileImage: file
      });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      // Create FormData for file upload
      const userData = new FormData();
      userData.append('name', formData.name);
      userData.append('email', formData.email);
      userData.append('username', formData.username);
      userData.append('github', formData.github);
      userData.append('linkedin', formData.linkedin);
      userData.append('password', formData.password);

      if (formData.profileImage) {
        userData.append('profileImage', formData.profileImage);
      }

      await register(userData);
      navigate('/login');
    } catch (err) {
      setFormError(error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="form-container">
          <h2 className="form-title">Create your account</h2>

          {formError && (
            <div className="alert alert-danger">{formError}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
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
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="github">GitHub URL</label>
              <input
                type="url"
                id="github"
                name="github"
                className="form-control"
                value={formData.github}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedin">LinkedIn URL</label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                className="form-control"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://www.linkedin.com/in/yourprofile"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                required
              />
              <small className="form-text">
                Password must be at least 6 characters
              </small>
            </div>

            <div className="form-group">
              <label>Profile Image (Optional)</label>
              <div className="input-group">
                <label htmlFor="profileImage" className="custom-file-upload">
                  {formData.profileImage ? 'Change Image' : 'Choose Image'}
                </label>
                <input
                  type="file"
                  id="profileImage"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </div>

              {previewImage && (
                <div className="text-center mt-2">
                  <img
                    src={previewImage}
                    alt="Profile Preview"
                    className="profile-image-preview"
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Register
              </button>
            </div>
          </form>

          <div className="auth-redirect">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 