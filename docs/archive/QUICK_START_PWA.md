# 🚀 Quick Start Guide - PWA Phase 2

## ⚡ 3-Minute Setup

### Step 1: Generate VAPID Keys (30 seconds)
```bash
cd FunModels/AntiGravity/Separa
node scripts/generate-vapid-keys.js
```

### Step 2: Create .env.local (1 minute)
Copy the output from Step 1 and create `.env.local`:

```env
# Copy from .env.example first
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/separa"
JWT_SECRET=your-super-secret-jwt-key

# Add these from Step 1 output
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BDx..."
VAPID_PRIVATE_KEY="abc..."
VAPID_EMAIL="mailto:admin@separa.app"
```

### Step 3: Update Database (30 seconds)
```bash
npx prisma generate
npx prisma db push
```

### Step 4: Build & Test (1 minute)
```bash
npm run build
npm start
```

Open http://localhost:3000 and wait:
- ⏱️ 30 seconds → Install prompt appears
- ⏱️ 60 seconds → Notification prompt appears

## ✅ That's It!

Your PWA is now:
- 📱 Installable on mobile & desktop
- 🔔 Ready for push notifications
- 💾 Caching assets for offline use
- 🚀 Optimized for performance

---

## 🧪 Test Notifications

Open browser console and run:
```javascript
// Test local notification
new Notification('Test from Separa', {
  body: 'It works! 🎉',
  icon: '/icons/icon-192x192.png'
});
```

---

## 📝 Next Steps

Generate app icons using:
https://www.pwabuilder.com/imageGenerator

Then move to **Phase 3: Mobile UI Optimizations**!
