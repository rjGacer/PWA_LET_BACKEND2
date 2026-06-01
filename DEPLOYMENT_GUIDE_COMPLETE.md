# Complete Deployment Guide for LearnIQ

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Netlify + External Backend Deployment](#netlify--external-backend-deployment)
3. [Troubleshooting Login & Dashboard Issues](#troubleshooting-login--dashboard-issues)

---

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Frontend Setup (Localhost)

1. **Install dependencies:**
```bash
npm install
# or
yarn install
```

2. **Create .env.local file:**
```bash
cp .env.example .env.local
```

3. **Configure .env.local for local development:**
```env
VITE_API_URL=http://localhost:5000/api/v1
REACT_APP_API_URL=http://localhost:5000/api/v1
NODE_ENV=development
VITE_DEBUG=true
```

4. **Start frontend development server:**
```bash
npm run dev
# Frontend will be available at http://localhost:3000 or http://localhost:5173
```

### Backend Setup (Localhost)

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env.local file in backend folder:**
```bash
cp .env.example .env.local
```

4. **Configure backend .env.local:**
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=pwa_let_db
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key_change_this
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000
```

5. **Set up database:**
```bash
npm run migrate
npm run seed
```

6. **Start backend server:**
```bash
npm run dev
# Backend will be available at http://localhost:5000
```

### Verify Local Setup

1. Open browser to `http://localhost:3000` (or `http://localhost:5173`)
2. You should see LearnIQ homepage
3. Try logging in:
   - **Student email:** student@example.com (if seeded)
   - **Teacher email:** teacher@example.com (if seeded)
4. After login, you should be redirected to dashboard

---

## Netlify + External Backend Deployment

### Prerequisites
- Netlify account (free: netlify.com)
- Backend deployed and running (Heroku, AWS, DigitalOcean, etc.)
- Backend URL (e.g., `https://pwa-let-backend.herokuapp.com`)

### Step 1: Prepare Frontend for Netlify

1. **Ensure build is optimized:**
```bash
npm run build  # If you have a build script
```

2. **Create netlify.toml in root (already done):**
The file already includes:
- SPA routing configuration
- Header settings for PWA
- Environment variable templates

### Step 2: Configure Environment Variables in Netlify UI

1. Go to **Netlify Dashboard** → Select your site
2. Navigate to **Settings** → **Build & Deploy** → **Environment**
3. Add environment variables for **Production**:

```
BACKEND_URL=https://your-backend-api.com/api/v1
VITE_API_URL=https://your-backend-api.com/api/v1
REACT_APP_API_URL=https://your-backend-api.com/api/v1
NODE_ENV=production
```

Replace `https://your-backend-api.com` with your actual backend URL.

### Step 3: Deploy Frontend to Netlify

**Option A: GitHub Integration (Recommended)**
1. Push your code to GitHub
2. Go to Netlify Dashboard
3. Click "New site from Git"
4. Connect GitHub repository
5. Configure build settings:
   - **Build command:** `npm run build` (if applicable) or leave empty for static
   - **Publish directory:** `.` (root directory)
6. Click "Deploy"

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Step 4: Configure Backend

1. **Update CORS in backend .env.production:**
```env
CORS_ORIGIN=https://your-site.netlify.app
```

2. **For backend on Heroku:**
```bash
heroku config:set CORS_ORIGIN=https://your-site.netlify.app
```

3. **Restart backend**

### Step 5: Verify Netlify Deployment

1. Visit your Netlify site: `https://your-site.netlify.app`
2. Open browser DevTools (F12) → **Console**
3. You should see: `🔧 API Config initialized` with correct backend URL
4. Try logging in and verify dashboard redirects work

---

## Troubleshooting Login & Dashboard Issues

### Issue 1: Welcome Message Shows but Can't Access Dashboard

**Symptoms:**
- "✅ Welcome [Name]!" shows
- Page doesn't redirect or redirects but shows login page again

**Causes & Fixes:**

1. **Check API URL Configuration**
   - Open DevTools → Console
   - Look for: `🔧 API Config initialized`
   - Verify backend URL is correct
   - For Netlify: Should show your backend API URL, not localhost:5000

2. **Check localStorage**
   - DevTools → Application → Local Storage
   - Verify these keys exist:
     - `authToken` (should have a JWT token)
     - `userRole` (should be "student" or "teacher")
     - `userName` (should have user's name)

3. **Check Network Requests**
   - DevTools → Network tab
   - Look for failed requests to `/api/v1/auth/login`
   - Common errors:
     - **404:** Backend endpoint not found
     - **500:** Server error - check backend logs
     - **CORS error:** Backend CORS not configured correctly

4. **Verify Backend is Running**
   ```bash
   curl https://your-backend-api.com/health
   # Should return: {"status": "Server is running", "timestamp": "..."}
   ```

5. **Check student-auth-guard.js logs**
   - DevTools → Console
   - Should see messages like:
     - `✓ Token verified successfully`
     - `✓ Student token verified successfully`

### Issue 2: CORS Error on Login

**Symptoms:**
- Error: "Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy"

**Solution:**
1. Update backend CORS configuration:
   ```env
   CORS_ORIGIN=https://your-site.netlify.app
   ```

2. If using multiple frontend URLs:
   ```env
   CORS_ORIGIN=https://your-site.netlify.app,https://staging.your-site.netlify.app
   ```

3. Restart backend
4. Clear browser cache and try again

### Issue 3: Backend API URL Not Detected Correctly

**For Localhost:**
- Frontend on: `http://localhost:3000`
- Backend should be on: `http://localhost:5000`
- Check .env.local has: `VITE_API_URL=http://localhost:5000/api/v1`

**For Netlify:**
- Check environment variables are set in Netlify UI
- Verify `BACKEND_URL` or `VITE_API_URL` is correct
- DevTools Console should show correct backend URL

### Issue 4: Token Verification Fails

**Symptoms:**
- Redirect to dashboard happens but immediately redirects back to login
- Console shows: `❌ Token verification failed. Logging out.`

**Causes:**
1. **Backend `/api/v1/auth/verify` endpoint not working**
   - Check backend logs
   - Verify endpoint is implemented in auth routes

2. **JWT token expired or invalid**
   - Check backend JWT_SECRET matches
   - Verify JWT_EXPIRY is set correctly

3. **Network timeout during verification**
   - Backend taking too long to respond
   - Check backend performance and database connection

**Fix:**
```bash
# Backend: Check token verification endpoint
curl -X POST https://your-backend-api.com/api/v1/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Environment Variable Reference

### Frontend (.env.local or .env.production)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api/v1        # Local dev
REACT_APP_API_URL=http://localhost:5000/api/v1   # Local dev

# Or for production
VITE_API_URL=https://your-backend-api.com/api/v1
REACT_APP_API_URL=https://your-backend-api.com/api/v1

# Node environment
NODE_ENV=development|production

# Debug
VITE_DEBUG=true|false
```

### Backend (backend/.env.local or backend/.env.production)
```env
# Server
PORT=5000
NODE_ENV=development|production

# Database
DB_HOST=localhost|remote-host
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=pwa_let_db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000,https://your-site.netlify.app

# Frontend URL
FRONTEND_URL=http://localhost:3000|https://your-site.netlify.app
```

---

## Quick Checklist for Deployment

- [ ] Frontend .env.production has correct BACKEND_URL
- [ ] Backend .env.production has correct CORS_ORIGIN
- [ ] Netlify environment variables are set
- [ ] Backend health check returns 200 status
- [ ] Backend CORS is configured for Netlify domain
- [ ] Browser console shows correct API URL
- [ ] localStorage contains authToken after login
- [ ] student-auth-guard.js shows token verification success
- [ ] Dashboard loads without redirect loop
- [ ] Can see welcome message with user's name
- [ ] Can click menu items and navigate pages

---

## Support

If issues persist:
1. Check backend logs: `npm run dev` in backend folder
2. Check frontend console: DevTools → Console
3. Check network requests: DevTools → Network tab
4. Verify all environment variables are set
5. Clear browser cache: Ctrl+Shift+Delete
6. Try incognito mode to rule out cache issues
