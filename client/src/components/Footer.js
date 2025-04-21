import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <p>&copy; {new Date().getFullYear()} DevHub. All rights reserved.</p>
        <p>Connect with developers around the world.</p>
      </div>
    </footer>
  );
};

export default Footer; 