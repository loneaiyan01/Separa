# 🚀 Deployment Checklist for Separa

## Issues Fixed

### ✅ 1. Room Password Field Not Showing
**Problem:** When manually entering a room code, the password field was hidden.
**Solution:** Changed condition from `{roomId && (` to `{(roomId || enteredRoomID) && (` to show password field in both scenarios.

### ✅ 2. "Join Room" Button Redirecting Unnecessarily  
**Problem:** Clicking "Join Room" from /rooms page would redirect to home and require re-entering credentials.
**Solution:** 
- Added password prompt in RoomCard when joining locked rooms
- Password is stored temporarily in sessionStorage
- LobbySelection component auto-loads the password from sessionStorage
- Better UX with visual indicators for locked rooms

### ✅ 3. Room Password Visual Improvements
**Problem:** Users couldn't tell if a room required a password.
**Solution:**
- Added "(Required)" label for locked rooms
- Amber border and lock icon for locked rooms
- Helper text showing room is locked
- Auto-fetch room info to determine if locked

## Required Environment Variables

For the app to work properly online, you MUST set these environment variables:

### Essential Variables (Required)
```env
# LiveKit Configuration (for video/audio)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional (for Legacy Password System)
```env
# Legacy passwords for Sister/Host roles
NEXT_PUBLIC_HOST_PASSWORD=your-host-password
NEXT_PUBLIC_SISTER_PASSWORD=your-sister-password
```

### Not Required (Using JSON File Storage)
```env
# These are NOT needed since we're using local JSON storage
# DATABASE_URL=...
# JWT_SECRET=...
```

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   cd FunModels/AntiGravity/Separa
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_LIVEKIT_URL`
     - `LIVEKIT_API_KEY`
     - `LIVEKIT_API_SECRET`
     - `NEXT_PUBLIC_HOST_PASSWORD`
     - `NEXT_PUBLIC_SISTER_PASSWORD`
   - Click "Deploy"

3. **Important Note About Data Persistence**
   - Currently using JSON file storage (`data/rooms.json`)
   - This works locally but **will NOT persist** on Vercel (file system is read-only)
   - **Solution:** You need to implement database storage (see below)

### Option 2: Other Platforms (Netlify, Railway, etc.)

Same steps as Vercel, but make sure to:
1. Set all environment variables
2. Build command: `npm run build`
3. Output directory: `.next`

## 🚨 Critical Issue: Data Persistence

### Current Setup (Development Only)
- Rooms stored in `data/rooms.json`
- Works locally but **NOT in production** (Vercel/Netlify have read-only file systems)

### Solutions for Production:

#### Option A: Use MongoDB (Recommended)
1. Create free MongoDB Atlas account
2. Get connection string
3. Add to environment variables:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/separa"
   ```
4. Uncomment database code in:
   - `src/lib/storage.ts` (switch from JSON to MongoDB)
   - `src/lib/prisma.ts`

#### Option B: Use PostgreSQL with Prisma
1. Create database (Supabase, Railway, etc.)
2. Add connection string:
   ```env
   DATABASE_URL="postgresql://..."
   ```
3. Run migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

#### Option C: Use Vercel KV (Redis)
1. Add Vercel KV to your project
2. Update `src/lib/storage.ts` to use KV instead of JSON

## Testing Checklist

Before deploying, test these scenarios:

### ✅ Room Creation
- [ ] Can create brothers-only room
- [ ] Can create sisters-only room  
- [ ] Can create mixed room
- [ ] Can create open room
- [ ] Can create locked room with password
- [ ] Room appears in /rooms list

### ✅ Room Joining
- [ ] Can join unlocked room directly
- [ ] Password prompt appears for locked rooms when clicking "Join Room"
- [ ] Password field shows in lobby with "(Required)" label
- [ ] Can join with correct password
- [ ] Cannot join with wrong password
- [ ] Proper error messages displayed

### ✅ Video/Audio
- [ ] Video/audio works after joining
- [ ] Gender segregation works (brothers can't see sisters, etc.)
- [ ] Host can see everyone

### ✅ UI/UX
- [ ] Browse rooms from home page works
- [ ] Copy room link works
- [ ] Lock/unlock room works
- [ ] Delete room works
- [ ] Responsive on mobile

## Current Room Passwords (for Testing)

From `data/rooms.json`:

| Room ID | Room Name | Password | Hash in DB |
|---------|-----------|----------|------------|
| 03e17f741a66b7d5 | Test Brothers Room | `test123` | ecd71870... |
| 33c7c7fd52471379 | Muneeb Baya | (ask creator) | cd838f8f... |
| d84456539c4cb9d5 | Community Meeting | (ask creator) | d8593183... |
| 3241da6e35ff697d | Labeeb and Aiyan | (ask creator) | 05cce134... |
| a105c30396f87439 | Sisters Study Group | (no password) | - |

## Quick Fixes Applied

### File: `src/components/LobbySelection.tsx`
1. Added `useEffect` import
2. Added `roomInfo` state to track if room is locked
3. Added `useEffect` to fetch room info on mount
4. Updated password field to show "(Required)" for locked rooms
5. Added visual indicators (amber border, warning text)
6. Load password from sessionStorage if coming from RoomCard

### File: `src/components/RoomCard.tsx`
1. Modified `handleJoinRoom` to prompt for password if room is locked
2. Store password in sessionStorage temporarily
3. Redirect to home with room ID

## Next Steps

1. ✅ Test locally to ensure all fixes work
2. 🔄 Choose a database solution (MongoDB recommended)
3. 🔄 Update storage layer to use database
4. 🔄 Set up environment variables in deployment platform
5. 🔄 Deploy to production
6. 🔄 Test all scenarios in production

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all environment variables are set
3. Check that LiveKit credentials are correct
4. Ensure data persistence solution is implemented

---
**Last Updated:** January 2025
**Version:** 1.0.0
