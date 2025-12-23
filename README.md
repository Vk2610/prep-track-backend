# PrepTrack Backend API

Production-ready backend for PrepTrack - A MERN SaaS application for CAT exam aspirants.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the backend directory:
```bash
cp .env.example .env
```

Update the `.env` file with your values:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT signing
- `PORT` - Server port (default: 5000)

### 3. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   ├── authMiddleware.js     # JWT & role-based auth
│   └── errorMiddleware.js    # Global error handler
├── models/
│   └── User.js               # User schema
├── routes/
│   └── authRoutes.js         # Auth endpoints
├── utils/
│   └── asyncHandler.js       # Async error wrapper
├── .env.example              # Environment template
├── .gitignore                # Git exclusions
├── package.json              # Dependencies
└── server.js                 # Entry point
```

## 🔑 API Endpoints

### Authentication Routes (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  }
  ```

#### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** Same as register

#### Get Profile (Protected)
- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2023-12-22T00:00:00.000Z"
    }
  }
  ```

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT authentication with configurable expiry
- ✅ Role-based access control (student/admin)
- ✅ Input validation with express-validator
- ✅ CORS configuration
- ✅ MongoDB injection prevention (Mongoose sanitization)

## 🧪 Testing

Use **Postman**, **Thunder Client**, or **curl** to test the API:

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get profile (use token from login response)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/preptrack` |
| `JWT_SECRET` | Secret for JWT signing | `your_secret_key` |
| `JWT_EXPIRE` | Token expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Security:** CORS, Helmet (recommended for production)

## 📌 Next Steps

1. ✅ Backend authentication complete
2. ⏳ Await user confirmation
3. ⏳ Frontend development
4. ⏳ Feature modules (exams, progress tracking, etc.)
