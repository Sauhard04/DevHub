const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config');

// Get environment configuration
const env = process.env.NODE_ENV || 'development';
const currentConfig = config[env];

if (!currentConfig) {
  console.error(`Configuration not found for environment: ${env}`);
  process.exit(1);
}

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File paths
const UPLOAD_PATH = path.join(__dirname, currentConfig.uploadPath);
const DATA_PATH = path.join(__dirname, currentConfig.dataPath);

// Ensure directories exist
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(UPLOAD_PATH));

// Serve static files from the React app in production
if (env === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Socket.IO connection management
const connectedUsers = new Map(); // Map to store user ID -> socket ID

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user authentication and store their ID
  socket.on('authenticate', (userId) => {
    if (userId) {
      console.log(`User ${userId} authenticated with socket ${socket.id}`);
      connectedUsers.set(userId, socket.id);

      // Send existing notifications to the user
      sendUnreadNotifications(userId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove user from connected users
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Helper function to send notification to a specific user
const sendNotificationToUser = (userId, notification) => {
  const socketId = connectedUsers.get(userId);

  if (socketId) {
    io.to(socketId).emit('notification', notification);
    console.log(`Notification sent to user ${userId}`);
  } else {
    console.log(`User ${userId} is not connected, notification stored only`);
  }
};

// Helper function to send existing unread notifications to a user
const sendUnreadNotifications = (userId) => {
  const notifications = getNotifications();
  const userUnreadNotifications = notifications.filter(
    n => n.userId === userId && !n.read
  );

  if (userUnreadNotifications.length > 0) {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      userUnreadNotifications.forEach(notification => {
        io.to(socketId).emit('notification', notification);
      });
      console.log(`Sent ${userUnreadNotifications.length} unread notifications to user ${userId}`);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Data storage (in a real app, this would be a database)
const DATA_FILE = path.join(DATA_PATH, 'users.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper function to read users
const getUsers = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write users
const saveUsers = (users) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

// Data storage for posts
const POSTS_FILE = path.join(DATA_PATH, 'posts.json');

// Initialize posts file if it doesn't exist
if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([]));
}

// Data storage for notifications
const NOTIFICATIONS_FILE = path.join(DATA_PATH, 'notifications.json');

// Initialize notifications file if it doesn't exist
if (!fs.existsSync(NOTIFICATIONS_FILE)) {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([]));
}

// Helper function to read posts
const getPosts = () => {
  const data = fs.readFileSync(POSTS_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write posts
const savePosts = (posts) => {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

// Helper function to read notifications
const getNotifications = () => {
  const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write notifications
const saveNotifications = (notifications) => {
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
};

// Data storage for connections
const CONNECTIONS_FILE = path.join(DATA_PATH, 'connections.json');

// Initialize connections file if it doesn't exist
if (!fs.existsSync(CONNECTIONS_FILE)) {
  fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify([]));
}

// Helper function to read connections
const getConnections = () => {
  const data = fs.readFileSync(CONNECTIONS_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper function to write connections
const saveConnections = (connections) => {
  fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
};

// Helper function to create a notification
const createNotification = (userId, type, message, data = {}) => {
  const notifications = getNotifications();

  const newNotification = {
    id: Date.now().toString(),
    userId,
    type,
    message,
    data,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.unshift(newNotification);
  saveNotifications(notifications);

  // Send real-time notification if user is connected
  sendNotificationToUser(userId, newNotification);

  return newNotification;
};

// JWT Secret (in a real app, use environment variable)
const JWT_SECRET = 'devhub-secret-key';

// Routes
// Register a new user
app.post('/api/users/register', upload.single('profileImage'), (req, res) => {
  try {
    const { name, email, github, linkedin, password, username } = req.body;
    const users = getUsers();

    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Check if username already exists
    if (users.some(user => user.username === username)) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      username,
      github,
      linkedin,
      password: hashedPassword,
      profileImage: req.file
        ? `/uploads/${req.file.filename}`
        : 'https://via.placeholder.com/150',
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    saveUsers(users);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/users/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const users = getUsers();

    // Find user by username
    const user = users.find(user => user.username === username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware for auth
const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get all users
app.get('/api/users', auth, (req, res) => {
  try {
    const users = getUsers();
    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/users/me', auth, (req, res) => {
  try {
    const users = getUsers();
    const user = users.find(user => user.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
app.get('/api/users/search', auth, (req, res) => {
  try {
    const { query } = req.query;
    const users = getUsers();

    if (!query) {
      return res.json([]);
    }

    // Search for users by name
    const results = users.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase())
    );

    // Return results without passwords
    const resultsWithoutPasswords = results.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(resultsWithoutPasswords);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', auth, (req, res) => {
  try {
    const users = getUsers();
    const user = users.find(user => user.id === req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Posts Routes
// Create a new post
app.post('/api/posts', auth, upload.single('image'), (req, res) => {
  try {
    const { content, githubRepo } = req.body;
    const users = getUsers();
    const posts = getPosts();

    // Find the current user
    const user = users.find(user => user.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new post
    const newPost = {
      id: Date.now().toString(),
      content: content || '',
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      githubRepo: githubRepo || null,
      likes: [],
      comments: [],
      user: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage
      },
      timestamp: new Date().toISOString()
    };

    // Save post
    posts.unshift(newPost); // Add to beginning of array
    savePosts(posts);

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts
app.get('/api/posts', auth, (req, res) => {
  try {
    const posts = getPosts();
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by user ID
app.get('/api/posts/user/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching posts for user ID:', userId);

    if (!userId) {
      console.log('No userID provided in request');
      return res.status(400).json({ message: 'User ID is required' });
    }

    const posts = getPosts();
    console.log('Total posts in database:', posts.length);

    // Filter posts by user ID
    const userPosts = posts.filter(post => {
      const matches = post.user && post.user.id === userId;
      console.log(`Post ${post.id} by user ${post.user?.id} matches ${userId}:`, matches);
      return matches;
    });

    console.log('Found posts for user:', userPosts.length);
    res.json(userPosts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like or unlike a post
app.put('/api/posts/:id/like', auth, (req, res) => {
  try {
    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === req.params.id);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];
    const userLikeIndex = post.likes.findIndex(like => like.userId === req.user.id);
    const users = getUsers();
    const currentUser = users.find(user => user.id === req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Toggle like status
    if (userLikeIndex !== -1) {
      // Unlike
      post.likes.splice(userLikeIndex, 1);
    } else {
      // Like
      post.likes.push({
        userId: currentUser.id,
        name: currentUser.name,
        timestamp: new Date().toISOString()
      });

      // Create notification for post owner if liker is not the post owner
      if (currentUser.id !== post.user.id) {
        createNotification(
          post.user.id,
          'like',
          `${currentUser.name} liked your post`,
          {
            postId: post.id,
            likerName: currentUser.name,
            likerImage: currentUser.profileImage,
            postContent: post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : ''
          }
        );
      }
    }

    // Save updated posts
    savePosts(posts);

    res.json(post);
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to a post
app.post('/api/posts/:id/comment', auth, (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === req.params.id);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];
    const users = getUsers();
    const user = users.find(user => user.id === req.user.id);

    // Add comment
    const newComment = {
      id: Date.now().toString(),
      text,
      user: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage
      },
      timestamp: new Date().toISOString()
    };

    post.comments.push(newComment);

    // Save updated posts
    savePosts(posts);

    // Create notification for post owner if the commenter is not the post owner
    if (user.id !== post.user.id) {
      createNotification(
        post.user.id,
        'comment',
        `${user.name} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        {
          postId: post.id,
          commentId: newComment.id,
          commenterName: user.name,
          commenterImage: user.profileImage,
          commentText: text
        }
      );
    }

    res.json(post);
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a post
app.put('/api/posts/:id', auth, upload.single('image'), (req, res) => {
  try {
    const { content, githubRepo } = req.body;
    const { id } = req.params;

    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure post belongs to current user
    if (posts[postIndex].user.id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this post' });
    }

    // Update post fields
    if (content !== undefined) {
      posts[postIndex].content = content;
    }

    if (githubRepo !== undefined) {
      posts[postIndex].githubRepo = githubRepo === '' ? null : githubRepo;
    }

    // Update image if provided
    if (req.file) {
      posts[postIndex].imageUrl = `/uploads/${req.file.filename}`;
    }

    // Save updated posts
    savePosts(posts);

    res.json(posts[postIndex]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
app.delete('/api/posts/:id', auth, (req, res) => {
  try {
    const { id } = req.params;

    const posts = getPosts();
    const postIndex = posts.findIndex(post => post.id === id);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure post belongs to current user
    if (posts[postIndex].user.id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    // Remove post
    const deletedPost = posts.splice(postIndex, 1)[0];

    // Save updated posts
    savePosts(posts);

    res.json({ message: 'Post deleted successfully', post: deletedPost });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Notifications Routes
// Get all notifications for the current user
app.get('/api/notifications', auth, (req, res) => {
  try {
    const notifications = getNotifications();

    // Filter notifications for the current user
    const userNotifications = notifications.filter(notification =>
      notification.userId === req.user.id
    );

    res.json(userNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
app.put('/api/notifications/:id/read', auth, (req, res) => {
  try {
    const notifications = getNotifications();
    const notificationIndex = notifications.findIndex(n => n.id === req.params.id);

    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Ensure notification belongs to current user
    if (notifications[notificationIndex].userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Mark notification as read
    notifications[notificationIndex].read = true;
    saveNotifications(notifications);

    res.json(notifications[notificationIndex]);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', auth, (req, res) => {
  try {
    const notifications = getNotifications();

    // Mark all notifications for the current user as read
    const updatedNotifications = notifications.map(notification => {
      if (notification.userId === req.user.id) {
        return { ...notification, read: true };
      }
      return notification;
    });

    saveNotifications(updatedNotifications);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send connection request
app.post('/api/connections/request', auth, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const users = getUsers();
    const currentUser = users.find(user => user.id === req.user.id);
    const targetUser = users.find(user => user.id === userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.id === targetUser.id) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if a connection already exists
    const connections = getConnections();
    const existingConnection = connections.find(
      conn => (conn.user1Id === currentUser.id && conn.user2Id === targetUser.id) ||
        (conn.user1Id === targetUser.id && conn.user2Id === currentUser.id)
    );

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    // Create new direct connection
    const newConnection = {
      id: Date.now().toString(),
      user1Id: currentUser.id,
      user2Id: targetUser.id,
      status: 'accepted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    connections.push(newConnection);
    saveConnections(connections);

    // Create notification for the other user
    createNotification(
      targetUser.id,
      'new_connection',
      `${currentUser.name} connected with you`,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userImage: currentUser.profileImage
      }
    );

    res.status(201).json({ message: 'Connected successfully', connection: newConnection });
  } catch (error) {
    console.error('Create connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a connection
app.delete('/api/connections/:connectionId', auth, (req, res) => {
  try {
    const { connectionId } = req.params;
    const connections = getConnections();
    const connectionIndex = connections.findIndex(conn => conn.id === connectionId);

    if (connectionIndex === -1) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Only allow users involved in the connection to remove it
    const connection = connections[connectionIndex];
    if (connection.user1Id !== req.user.id && connection.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to remove this connection' });
    }

    const removedConnection = connections.splice(connectionIndex, 1)[0];
    saveConnections(connections);

    res.json({ message: 'Connection removed successfully', connection: removedConnection });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all connections for a user
app.get('/api/connections/:userId', auth, (req, res) => {
  try {
    const { userId } = req.params;
    const connections = getConnections();
    const users = getUsers();

    // Get all accepted connections where the user is either user1 or user2
    const userConnections = connections.filter(conn =>
      (conn.user1Id === userId || conn.user2Id === userId) &&
      conn.status === 'accepted'
    );

    // Enrich the connection data with user information
    const enrichedConnections = userConnections.map(conn => {
      const otherUserId = conn.user1Id === userId ? conn.user2Id : conn.user1Id;
      const otherUser = users.find(user => user.id === otherUserId);

      if (!otherUser) {
        return null;
      }

      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
          profileImage: otherUser.profileImage,
          githubUrl: otherUser.githubUrl
        },
        createdAt: conn.createdAt
      };
    }).filter(conn => conn !== null);

    res.json(enrichedConnections);
  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
app.put('/api/connections/accept/:requestId', auth, (req, res) => {
  try {
    const { requestId } = req.params;
    const connections = getConnections();
    const users = getUsers();

    // Find the connection request
    const connectionIndex = connections.findIndex(conn => conn.id === requestId);
    if (connectionIndex === -1) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    const connection = connections[connectionIndex];

    // Ensure the current user is the request recipient
    if (connection.requesterId === req.user.id) {
      return res.status(403).json({ message: 'Cannot accept your own request' });
    }

    if (connection.user1Id !== req.user.id && connection.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to accept this request' });
    }

    if (connection.status === 'accepted') {
      return res.status(400).json({ message: 'Connection already accepted' });
    }

    // Update connection status
    connection.status = 'accepted';
    connection.updatedAt = new Date().toISOString();
    connections[connectionIndex] = connection;
    saveConnections(connections);

    // Get user info for notification
    const currentUser = users.find(user => user.id === req.user.id);

    // Create notification for the requester
    createNotification(
      connection.requesterId,
      'connection_accepted',
      `${currentUser.name} accepted your connection request`,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userImage: currentUser.profileImage
      }
    );

    res.json({ message: 'Connection request accepted', connection });
  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject connection request
app.put('/api/connections/reject/:requestId', auth, (req, res) => {
  try {
    const { requestId } = req.params;
    const connections = getConnections();
    const users = getUsers();

    // Find the connection request
    const connectionIndex = connections.findIndex(conn => conn.id === requestId);
    if (connectionIndex === -1) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    const connection = connections[connectionIndex];

    // Ensure the current user is the request recipient
    if (connection.requesterId === req.user.id) {
      return res.status(403).json({ message: 'Cannot reject your own request' });
    }

    if (connection.user1Id !== req.user.id && connection.user2Id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to reject this request' });
    }

    if (connection.status === 'rejected') {
      return res.status(400).json({ message: 'Connection already rejected' });
    }

    // Update connection status
    connection.status = 'rejected';
    connection.updatedAt = new Date().toISOString();
    connections[connectionIndex] = connection;
    saveConnections(connections);

    // Get user info for notification
    const currentUser = users.find(user => user.id === req.user.id);

    // Create notification for the requester
    createNotification(
      connection.requesterId,
      'connection_rejected',
      `${currentUser.name} rejected your connection request`,
      {
        userId: currentUser.id,
        userName: currentUser.name,
        userImage: currentUser.profileImage
      }
    );

    res.json({ message: 'Connection request rejected', connection });
  } catch (error) {
    console.error('Reject connection request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve React app in production
if (env === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Start the server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${env}`);
});

// Export the Express app for Vercel
module.exports = app;