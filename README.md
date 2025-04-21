# DevHub

DevHub is a full-stack web application that connects developers, allowing them to create profiles, discover other developers, and connect with them.

## Features

- User registration and authentication with JWT
- Profile creation with name, email, GitHub URL, and optional profile image
- Developer discovery and search functionality
- Responsive design for all devices

## Tech Stack

### Backend
- Node.js
- Express.js
- JSON Web Tokens (JWT) for authentication
- File upload with Multer
- JSON file-based data storage

### Frontend
- React
- React Router for navigation
- Context API for state management
- Axios for API requests
- CSS for styling

## Project Structure

```
devhub/
├── client/               # React frontend
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── components/   # Reusable components
│       ├── context/      # React context for state management
│       ├── pages/        # Page components
│       └── utils/        # Utility functions
└── server/               # Node.js backend
    ├── data/             # JSON data storage
    └── uploads/          # User uploaded files
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd devhub
   ```

2. Install server dependencies
   ```
   cd server
   npm install
   ```

3. Install client dependencies
   ```
   cd ../client
   npm install
   ```

### Running the Application

1. Start the server
   ```
   cd server
   npm run dev
   ```

2. Start the client (in a new terminal)
   ```
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/search` - Search users by name 