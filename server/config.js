const path = require('path');

module.exports = {
  development: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'devhub-secret-key',
    uploadPath: 'uploads',
    dataPath: 'data'
  },

  production: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    uploadPath: process.env.UPLOAD_PATH || 'uploads',
    dataPath: process.env.DATA_PATH || 'data'
  }
}; 