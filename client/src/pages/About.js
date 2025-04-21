import React from 'react';
import './About.css';

// Import team profile images
import sauhardImage from '../assets/dev_images/sauhard.jpg';
import rahulImage from '../assets/dev_images/rahul.jpg';
import sachinImage from '../assets/dev_images/sachin.jpg';
import prashantImage from '../assets/dev_images/prashant.jpg';
import madhuImage from '../assets/dev_images/madhu.jpg';

const About = () => {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: 'Sauhard Kaushik',
      designation: 'Full Stack Developer',
      image: sauhardImage,
      github: 'https://github.com/Sauhard04',
      linkedin: 'https://www.linkedin.com/in/sauhardkaushik/'
    },
    {
      id: 2,
      name: 'Rahul Yaduvanshi',
      designation: 'Full Stack Developer',
      image: rahulImage,
      github: 'https://github.com/rahulglacs',
      linkedin: 'https://www.linkedin.com/in/rahul-yaduvanshi-473160277/'
    },
    {
      id: 4,
      name: 'Sachin Thakur',
      designation: 'Full Stack Developer',
      image: sachinImage,
      github: 'https://github.com/sachinGlacs',
      linkedin: 'https://www.linkedin.com/in/sachin-thakur-8910b5295/'
    },
    {
      id: 3,
      name: 'Prashant Singh',
      designation: 'Full Stack Developer',
      image: prashantImage,
      github: 'https://github.com/Prashantsingh052',
      linkedin: 'https://linkedin.com/in/prashant-singh-493142300/'
    },
    {
      id: 5,
      name: 'Madhu Solanki',
      designation: 'Full Stack Developer',
      image: madhuImage,
      github: 'https://github.com/Madhusolanki48',
      linkedin: 'https://www.linkedin.com/in/madhu-solanki-969a21266'
    }
  ];

  return (
    <div className="about-page">
      <div className="container">
        <div className="about-container">
          <h1 className="page-title">About Us</h1>
          
          <div className="about-content">
            <div className="about-section">
              <h2>Our Mission</h2>
              <p>
                At DevHub, we're dedicated to creating a collaborative platform for developers to share ideas,
                showcase projects, and build a supportive community. Our goal is to empower developers of all 
                skill levels to connect, learn, and grow together.
              </p>
            </div>

            <div className="about-section">
              <h2>Our Story</h2>
              <p>
                DevHub was founded in 2025 by a group of passionate developers who saw the need for a dedicated
                space where developers could network, share knowledge, and collaborate on projects. What started
                as a small community has grown into a thriving ecosystem of technology enthusiasts.
              </p>
            </div>
          </div>

          <div className="team-section">
            <h2>Meet Our Team</h2>
            <div className="team-grid">
              {teamMembers.map(member => (
                <div className="profile-card" key={member.id}>
                  <div className="profile-image-container">
                    <img src={member.image} alt={member.name} className="profile-image" />
                  </div>
                  <div className="profile-info">
                    <h3 className="profile-name">{member.name}</h3>
                    <p className="profile-designation">{member.designation}</p>
                    <div className="social-links">
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-icon github-icon" title="GitHub">
                      </a>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon linkedin-icon" title="LinkedIn">
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About; 