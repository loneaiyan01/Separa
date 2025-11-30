# 🚀 Quick Start Guide

## ⚡ Local Development Setup (5 minutes)

### 1. Create Environment File

```bash
# Copy the example file
cp .env.local.example .env.local
```

### 2. Update .env.local with Your Values

**Minimum Required (to run locally):**

```env
# LiveKit (REQUIRED - get from https://cloud.livekit.io/)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Database (use placeholder for now)
DATABASE_URL="mongodb://localhost:27017/separa"

# JWT Secret (use any random string for dev)
JWT_SECRET="my-dev-secret-key-123"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Legacy Passwords
NEXT_PUBLIC_HOST_PASSWORD="host123"
NEXT_PUBLIC_SISTER_PASSWORD="sister123"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Open Browser

Navigate to: http://localhost:3000

---

## 🌐 Vercel Deployment Setup

### Step 1: Add Environment Variables in Vercel

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add these variables (for all environments: Production, Preview, Development):

```
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
DATABASE_URL=mongodb://localhost:27017/separa
JWT_SECRET=your-production-secret-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_HOST_PASSWORD=host123
NEXT_PUBLIC_SISTER_PASSWORD=sister123
```

### Step 2: Redeploy

Either:
- Push to GitHub (auto-deploy)
- Click "Redeploy" in Vercel dashboard

---

## 📝 Getting LiveKit Credentials

### Free Tier Available!

1. Go to https://cloud.livekit.io/
2. Sign up (free tier: 50 GB/month)
3. Create a new project
4. Copy the credentials:
   - **URL**: `wss://your-project.livekit.cloud`
   - **API Key**: From Settings
   - **API Secret**: From Settings

---

## 🗄️ Database Setup (Optional - Only if using Auth features)

### Quick MongoDB Atlas Setup:

1. **Sign up**: https://www.mongodb.com/cloud/atlas
2. **Create free cluster** (M0 Sandbox - Free forever)
3. **Create database user**:
   - Database Access → Add New User
   - Username: `separa-user`
   - Password: Generate secure password
4. **Whitelist IPs**:
   - Network Access → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0`
5. **Get connection string**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password

**Update .env.local:**
```env
DATABASE_URL="mongodb+srv://separa-user:your-password@cluster.mongodb.net/separa?retryWrites=true&w=majority"
```

### Initialize Database:

```bash
npx prisma db push
```

---

## ✅ Verify Setup

### Test Checklist:

- [ ] Run `npm run dev` successfully
- [ ] Open http://localhost:3000
- [ ] See the landing page
- [ ] Try entering a room ID
- [ ] Create a room via "Browse Existing Rooms"
- [ ] Join a created room
- [ ] Video/audio works

---

## 🐛 Common Issues

### Issue: "Cannot find module '@prisma/client'"
**Solution:**
```bash
npx prisma generate
```

### Issue: "DATABASE_URL not set"
**Solution:** Make sure `.env.local` exists with `DATABASE_URL` set

### Issue: "LiveKit connection failed"
**Solution:** Check your LiveKit credentials in `.env.local`

### Issue: "Build fails on Vercel"
**Solution:** 
1. Add all environment variables in Vercel
2. Make sure `DATABASE_URL` is set (even with placeholder)

### Issue: "Room not found" when creating rooms
**Solution:** This is expected if using file-based storage. Rooms are stored in `data/rooms.json`

---

## 🎯 Feature Status

| Feature | Status | Required Env Vars |
|---------|--------|-------------------|
| Video Calls | ✅ Working | LiveKit credentials |
| Room Creation | ✅ Working | None (file-based) |
| Room Joining | ✅ Working | None |
| User Authentication | ⚠️ Available (DB required) | DATABASE_URL, JWT_SECRET |
| Password Reset | ⚠️ Available (DB + Email required) | All auth vars + SMTP |
| Email Verification | ⚠️ Available (DB + Email required) | All auth vars + SMTP |

---

## 📚 Next Steps

1. **Test the app locally** ✅
2. **Deploy to Vercel** ✅
3. **Set up MongoDB** (when ready for auth)
4. **Configure email** (when ready for password reset)
5. **Add OAuth** (optional)

---

## 💡 Tips

- **Development**: Use placeholder `DATABASE_URL`, auth endpoints won't work but everything else will
- **Production**: Set up real MongoDB when you want to use authentication features
- **Security**: Change `JWT_SECRET` and passwords in production
- **LiveKit**: Free tier is generous, upgrade when needed

---

**Need Help?**
- Check `DATABASE_AUTH_SETUP.md` for detailed auth setup
- Check `SECURITY_FEATURES.md` for security docs
- Check error logs in terminal for specific issues
