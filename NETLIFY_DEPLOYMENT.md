# Deploy to Netlify - Complete Guide

This guide walks you through deploying the PWA LET frontend to Netlify while keeping localhost for debugging.

---

## 🎯 Overview

**Frontend (Netlify):**
- Static files served globally on fast CDN
- Automatic deployment from Git
- Free HTTPS and custom domains
- Optimized caching

**Backend (Separate Service):**
- Node.js server running on your chosen platform
- Handles all API requests
- Database connection
- File uploads

---

## 📋 Prerequisites

1. Frontend repository on GitHub (or GitLab/Bitbucket)
2. Backend deployed on a server (Heroku, Railway, AWS, etc.)
3. Netlify account (free signup at netlify.com)

---

## ⚡ Step 1: Prepare Your Frontend

### 1.1 Ensure GitHub is Set Up

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: PWA LET - Ready for Netlify deployment"

# Push to GitHub
git push origin main
```

### 1.2 Verify Key Files Exist

Your repository should have:
- ✅ `index.html` - Main login page
- ✅ `manifest.json` - PWA manifest
- ✅ `sw.js` - Service Worker
- ✅ `student/` folder - Student pages
- ✅ `teacher/` folder - Teacher pages
- ✅ `assets/` folder - JS, CSS, images
- ✅ `netlify.toml` - Netlify configuration (we created this)

---

## 🚀 Step 2: Deploy Frontend to Netlify

### 2.1 Connect Repository

1. **Go to Netlify:** https://app.netlify.com
2. **Click "New site from Git"**
3. **Choose Git provider:** GitHub (or GitLab/Bitbucket)
4. **Select repository:** Your PWA LET repo
5. **Click "Deploy site"**

Netlify will automatically deploy your site! 🎉

### 2.2 Set Build Command (Optional)

If you don't need a build step:
- **Build command:** (leave empty)
- **Publish directory:** `.`

If you have a build process:
- **Build command:** `npm run build`
- **Publish directory:** `build` or `dist`

---

## 🔌 Step 3: Deploy Backend

Choose one option:

### Option A: Heroku (Easiest for Beginners)

```bash
cd backend

# Install Heroku CLI
npm install -g heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-mysql-host
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-password
heroku config:set DB_NAME=pwa_let_db
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set CORS_ORIGIN=https://your-netlify-site.netlify.app

# Create Procfile in root
echo "web: cd backend && npm start" > Procfile

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

Your backend URL will be: `https://your-app-name.herokuapp.com`

### Option B: Railway.app (Modern)

1. **Go to:** https://railway.app
2. **Create project from GitHub**
3. **Select your repository**
4. **Add service:** Backend
5. **Set environment variables** in Railway UI
6. **Deploy:** Auto-deploys on push

Railway will give you a URL like: `https://your-app-random.railway.app`

### Option C: DigitalOcean, AWS, Linode, etc.

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed instructions.

**Your backend URL will be:** `https://your-domain.com` or `https://your-server-ip.com`

---

## 🔗 Step 4: Connect Frontend to Backend

### 4.1 Set Netlify Environment Variable

1. **Go to Netlify site settings:** https://app.netlify.com/sites/your-site
2. **Go to:** Site settings → Build & deploy → Environment
3. **Click "Add environment variables"**
4. **Add variable:**
   - **Key:** `BACKEND_URL`
   - **Value:** `https://your-backend-url.com/api/v1`

Example values:
- Heroku: `https://your-app-name.herokuapp.com/api/v1`
- Railway: `https://your-app-random.railway.app/api/v1`
- DigitalOcean: `https://api.yourdomain.com/api/v1`

### 4.2 Trigger New Deploy

1. **In Netlify:** Deploys → Trigger deploy → Clear cache and redeploy
2. OR **push to GitHub** to trigger automatic deploy

---

## 🧪 Step 5: Test Your Deployment

### 5.1 Test Frontend

1. **Go to your Netlify URL:** `https://your-site.netlify.app`
2. **Open browser console:** F12 → Console
3. **Should see:** `📍 Using environment-injected backend URL: https://...`
4. **Try to login** (will fail if backend not set up yet)

### 5.2 Test Backend

```bash
# Test health endpoint
curl https://your-backend-url.com/api/v1/health

# Should return:
# {"status":"Server is running","timestamp":"2024-..."}
```

### 5.3 Test Connection

1. **Open frontend** on Netlify
2. **Open browser console:** F12
3. **Look for:**
   - ✅ `🔐 ApiService initialized` with correct backend URL
   - ✅ No CORS errors
   - ✅ Network requests going to backend

---

## 🐛 Step 6: Debug Locally with Localhost

Your code still supports localhost debugging! Here's how:

### 6.1 Local Development Setup

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd root-directory
npx http-server --port 8080
```

Frontend runs on: `http://localhost:8080`

### 6.2 How It Works

When you visit `http://localhost:8080`:
1. ApiService detects hostname = `localhost`
2. Automatically connects to `http://localhost:5000/api/v1`
3. ✅ No configuration needed!

When you visit Netlify deployment:
1. ApiService detects Netlify domain
2. Uses `BACKEND_URL` environment variable you set
3. Connects to your production backend
4. ✅ Works automatically!

---

## 📊 Architecture

```
Local Development:
┌─────────────────────────────────────────┐
│ http://localhost:8080 (Frontend)        │
│ - index.html, student/, teacher/        │
│ - assets/scripts/, assets/styles/       │
└────────────────────┬────────────────────┘
                     │ API Calls
                     ↓ http://localhost:5000
┌─────────────────────────────────────────┐
│ http://localhost:5000 (Backend)         │
│ - npm run dev                           │
│ - Handles /api/v1/* routes              │
│ - Connected to local MySQL              │
└─────────────────────────────────────────┘


Production Deployment:
┌──────────────────────────────────────────────────┐
│ https://your-site.netlify.app (Frontend)         │
│ - Served from Netlify CDN                        │
│ - BACKEND_URL = https://backend-url/api/v1       │
└────────────────────┬─────────────────────────────┘
                     │ API Calls
                     ↓ https://backend-url/api/v1
┌──────────────────────────────────────────────────┐
│ https://backend-url (Backend)                    │
│ - Running on Heroku / Railway / DigitalOcean     │
│ - Connected to production MySQL                  │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Environment Variables Reference

### Netlify Frontend

| Variable | Example | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `https://api.example.com/api/v1` | Backend API endpoint |
| `NODE_ENV` | `production` | Environment type |

**How to set:** Site settings → Build & deploy → Environment variables

### Backend (Heroku/Railway/DigitalOcean)

| Variable | Example | Description |
|----------|---------|-------------|
| `DB_HOST` | `db.example.com` | Database host |
| `DB_USER` | `admin` | Database user |
| `DB_PASSWORD` | `****` | Database password |
| `DB_NAME` | `pwa_let_db` | Database name |
| `JWT_SECRET` | (random string) | JWT signing key |
| `CORS_ORIGIN` | `https://your-site.netlify.app` | Allowed frontend domain |
| `NODE_ENV` | `production` | Environment type |

---

## 📝 Common Tasks

### Update Frontend

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Netlify auto-deploys! Check Deploys tab for status
```

### Update Backend Environment Variables

**Heroku:**
```bash
heroku config:set VARIABLE_NAME=new_value
heroku logs --tail  # View logs after deploy
```

**Railway/Netlify UI:**
1. Go to service settings
2. Update environment variable
3. Auto-redeploys

### Rebuild Frontend Cache

In Netlify:
1. **Deploys** tab
2. **Trigger deploy**
3. Select **Clear cache and redeploy**

---

## 🆘 Troubleshooting

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
1. Check backend `CORS_ORIGIN` includes your Netlify domain
2. Set to: `https://your-site.netlify.app`
3. Redeploy backend

### Backend URL Not Found

**Error:** `Cannot reach backend URL`

**Solution:**
1. In Netlify, check `BACKEND_URL` is set correctly
2. Test backend with: `curl https://your-backend-url.com/api/v1/health`
3. Verify backend is deployed and running

### Console Shows Localhost

**Error:** Frontend tries to connect to localhost:5000 in production

**Solution:**
1. Check Netlify environment variables are set
2. Trigger rebuild: Deploys → Trigger deploy
3. Clear browser cache (Ctrl+Shift+Delete)

### Local Development Broken

**Error:** Localhost frontend can't reach localhost backend

**Solution:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
npx http-server --port 8080

# Verify both are running
curl http://localhost:5000/api/v1/health
curl http://localhost:8080/index.html
```

### Login Not Working

**Steps to debug:**
1. Open browser console (F12)
2. Check Network tab for failed requests
3. Check backend logs
4. Verify database connection

---

## ✅ Deployment Checklist

- [ ] Frontend pushed to GitHub
- [ ] GitHub repo is public (or Netlify has access)
- [ ] Netlify site created from Git
- [ ] Backend deployed (Heroku/Railway/etc.)
- [ ] Backend CORS_ORIGIN set to Netlify domain
- [ ] Netlify `BACKEND_URL` environment variable set
- [ ] Backend database configured
- [ ] Database migrations run
- [ ] Frontend health check passes (console logs correct backend URL)
- [ ] Backend health endpoint works (curl test)
- [ ] Login page loads
- [ ] Login/signup works with backend

---

## 📚 Next Steps

1. **Monitor your site:**
   - Netlify Analytics tab
   - Backend logs (Heroku/Railway dashboard)

2. **Set up monitoring:**
   - Netlify deploy notifications
   - Error tracking (Sentry, LogRocket)
   - Backend logs (PM2, Docker, systemd)

3. **Custom domain (optional):**
   - In Netlify: Site settings → Domain settings
   - Add your custom domain
   - DNS configuration guide will appear

4. **Enable analytics:**
   - Netlify: Build settings → Enable analytics
   - Track site performance and usage

---

## 🎉 You're Deployed!

Your PWA LET application is now live! Users can access it at:
- **Frontend:** `https://your-site.netlify.app`
- **Backend API:** `https://your-backend-url.com`

**For debugging:**
- **Local dev:** `http://localhost:8080` (frontend) + `http://localhost:5000` (backend)
- **Production:** Netlify domain + your backend URL

---

## 📞 Support Links

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Heroku Deployment](https://devcenter.heroku.com/)
- [Railway Docs](https://docs.railway.app/)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
