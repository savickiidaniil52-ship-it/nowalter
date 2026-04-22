# NoWalter — Pastebin

## Deploy on Render.com

### Step 1 — Upload to GitHub
```bash
git init
git add .
git commit -m "Initial NoWalter"
git remote add origin https://github.com/YOUR_USERNAME/nowalter.git
git push -u origin main
```

### Step 2 — Create Web Service on Render
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
4. Add Environment Variable:
   - `SESSION_SECRET` = any random long string
5. Add Disk (for SQLite persistence):
   - Mount Path: `/opt/render/project/src/data`
   - Size: 1 GB
6. Click **Deploy**

### Features
- ✅ Public paste view (no login required)
- ✅ Create pastes (anonymous or logged in)
- ✅ Public / Private pastes
- ✅ User registration & login
- ✅ **First registered user = ADMIN automatically**
- ✅ Admin panel: see all users + passwords (hashes), assign roles, ban/delete
- ✅ Roles: user, vip, elite, premium, admin
- ✅ Admin can promote others to admin
- ✅ Search pastes
- ✅ View/copy/delete pastes

### Admin Panel
- Go to `/admin` (only visible after login as admin)
- Dashboard with stats
- Users tab: full credentials DB with password hashes
- Pastes tab: manage all pastes

### First Time
1. Register on the site → you become admin automatically
2. Go to Admin panel → manage everything
