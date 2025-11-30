# Database & Authentication Setup Guide

## 📦 Overview

This guide covers the complete setup for:
- **MongoDB Database Integration** with Prisma ORM
- **JWT-based Authentication System**
- **User Management & Session Tracking**
- **Password Reset & Email Verification**

---

## 🗄️ Database Models

### Core Models:

1. **User** - Core user information with authentication
2. **UserPreferences** - User settings and configurations
3. **Session** - User sessions and history tracking
4. **Room** - Enhanced room model with Prisma
5. **AuditLog** - Security and action logging
6. **RefreshToken** - JWT refresh token management
7. **PasswordReset** - Password reset tokens
8. **EmailVerification** - Email verification tokens

---

## 🚀 Setup Instructions

### 1. Install Dependencies

Already installed:
```bash
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 2. Configure Database

1. **Create MongoDB Database:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster (free tier available)
   - Create a database user
   - Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
   - Get your connection string

2. **Update `.env.local`:**
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/separa?retryWrites=true&w=majority"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Push Schema to Database

```bash
npx prisma db push
```

This will create all collections in MongoDB.

### 5. Open Prisma Studio (Optional)

```bash
npx prisma studio
```

View and manage your database at `http://localhost:5555`

---

## 🔐 Authentication API Endpoints

### 1. **Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "name": "John Doe",
  "gender": "MALE"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "gender": "MALE",
    "role": "PARTICIPANT"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 2. **Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",  // or username
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { ... },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 3. **Refresh Token**
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

### 4. **Logout**
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

### 5. **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "gender": "MALE",
    "role": "PARTICIPANT",
    "preferences": { ... }
  }
}
```

### 6. **Update Profile**
```http
PATCH /api/auth/me
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "John Updated",
  "bio": "New bio",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 7. **Forgot Password**
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a password reset link will be sent.",
  "resetLink": "http://localhost:3000/reset-password?token=..."
}
```

### 8. **Reset Password**
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGci...",
  "newPassword": "NewSecurePass123!"
}
```

### 9. **Verify Email**
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "eyJhbGci..."
}
```

---

## 🔑 Password Requirements

Passwords must meet the following criteria:
- ✅ At least 8 characters long
- ✅ At least one lowercase letter
- ✅ At least one uppercase letter
- ✅ At least one number
- ✅ At least one special character

---

## 🎯 Token Management

### Access Token:
- **Expires in**: 15 minutes
- **Used for**: API authentication
- **Stored in**: Client memory or secure storage

### Refresh Token:
- **Expires in**: 7 days
- **Used for**: Getting new access tokens
- **Stored in**: Database (can be revoked)
- **Rotation**: New refresh token issued on each refresh

### Token Flow:
```
1. Login → Receive access + refresh token
2. Use access token for API calls
3. When access token expires → Use refresh token to get new tokens
4. Repeat step 2-3
5. On logout → Revoke refresh token
```

---

## 🛡️ Security Features

### Implemented:
✅ **Password Hashing** - bcrypt with salt rounds = 12
✅ **JWT Authentication** - Secure token-based auth
✅ **Refresh Token Rotation** - New token on each refresh
✅ **Token Revocation** - Can revoke tokens on logout
✅ **Password Reset Flow** - Time-limited reset tokens
✅ **Email Verification** - Verify user emails
✅ **Rate Limiting** - Built into existing security system
✅ **IP Tracking** - Track login locations
✅ **Session History** - Complete session tracking

### Best Practices:
- Store JWT_SECRET in environment variables
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Add CSRF protection
- Implement account lockout after failed attempts
- Regular token cleanup (expired tokens)

---

## 📊 Database Schema Overview

### User Relations:
```
User
├── UserPreferences (1:1)
├── Room[] (created rooms)
├── Session[] (session history)
├── AuditLog[] (audit trail)
└── RefreshToken[] (active tokens)
```

### Room Relations:
```
Room
├── User (creator)
├── Session[] (active sessions)
└── AuditLog[] (room audit logs)
```

---

## 🔄 Migration from File-Based Storage

### Steps to Migrate:

1. **Keep existing file-based system** for backward compatibility
2. **Gradually migrate** to database:
   - New users → Database
   - New rooms → Database
   - Sessions → Database
3. **Dual mode operation** during transition
4. **Full migration** after testing

### Migration Script (TODO):
```typescript
// scripts/migrate-to-db.ts
// Migrate existing rooms.json and audit-logs.json to MongoDB
```

---

## 🧪 Testing Authentication

### Using cURL:

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "name": "Test User",
    "gender": "MALE"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "Test123!@#"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <your-access-token>"
```

---

## 📝 Environment Variables

Required:
```env
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional:
```env
# Email service (for password reset & verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# OAuth providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Prisma Client Not Generated
```bash
npx prisma generate
```

### Issue 2: Connection Timeout
- Check MongoDB connection string
- Verify IP whitelist in MongoDB Atlas
- Check firewall settings

### Issue 3: JWT Secret Error
- Ensure JWT_SECRET is set in .env.local
- Use a strong, random secret in production

### Issue 4: Token Expired
- Use refresh token to get new access token
- Implement automatic token refresh in frontend

---

## 🎓 Next Steps

1. **Frontend Integration:**
   - Create auth context/provider
   - Implement token storage
   - Add protected routes
   - Build login/register UI

2. **Email Service:**
   - Set up SMTP service
   - Create email templates
   - Implement email sending

3. **OAuth Integration:**
   - Add Google OAuth
   - Add GitHub OAuth
   - Social login buttons

4. **Advanced Features:**
   - Two-factor authentication
   - Session management UI
   - Account activity logs
   - Security settings page

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [JWT.io](https://jwt.io/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Status**: ✅ Backend Complete
**Next**: Frontend Integration & Email Service
