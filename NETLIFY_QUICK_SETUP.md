# Netlify Deployment - Quick Setup (5 Minutes)

## This is the fastest way to deploy your PWA to Netlify

### Step 1: Prepare Your Repository (1 minute)

```bash
# Make sure everything is committed
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

Your repository should have:
- ✅ `index.html`
- ✅ `manifest.json`
- ✅ `sw.js`
- ✅ `netlify.toml` (we created this)
- ✅ `assets/` folder with all files

---

### Step 2: Deploy Frontend to Netlify (2 minutes)

1. **Go to:** https://app.netlify.com/start
2. **Click:** "Connect to Git" → Choose your Git provider
3. **Select:** Your PWA LET repository
4. **Click:** "Deploy site"

**Done!** Netlify automatically deploys. Get your URL from the Netlify dashboard.

Example: `https://pwa-let-2024.netlify.app`

---

### Step 3: Deploy Backend (1 minute)

Choose the easiest option for you:

#### **Option A: Heroku** (Recommended - Free tier)
```bash
cd backend
heroku create your-app-name
heroku config:set CORS_ORIGIN=https://your-netlify-url.netlify.app
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-user
heroku config:set DB_PASSWORD=your-password
git push heroku main
```
Backend URL: `https://your-app-name.herokuapp.com`

#### **Option B: Railway.app** (Modern - $5 credit)
1. Go to https://railway.app
2. Connect GitHub
3. Deploy backend & MySQL
4. Set environment variables in Railway UI

#### **Option C: Other** (See DEPLOYMENT_GUIDE.md)
- DigitalOcean, AWS, Linode, etc.

---

### Step 4: Connect Backend to Frontend (1 minute)

1. **In Netlify Dashboard:** Settings → Environment variables
2. **Add variable:**
   - Key: `BACKEND_URL`
   - Value: `https://your-backend-url.com/api/v1`

3. **Trigger redeploy:** Deploys → Trigger deploy → Clear cache and redeploy

---

### Step 5: Test (Done!)

1. **Visit your Netlify URL**
2. **Open browser console:** F12
3. **Look for:** `📍 Using environment-injected backend URL`
4. **Try to login** - should work with your backend!

---

## 🎯 How It Works

**Local Development (Still Works!):**
```bash
# Terminal 1
cd backend && npm run dev     # Backend on localhost:5000

# Terminal 2  
npx http-server --port 8080  # Frontend on localhost:8080

# ApiService automatically uses localhost:5000 ✅
```

**Netlify Production:**
- Frontend deployed on Netlify CDN
- Backend URL from `BACKEND_URL` environment variable
- Works automatically - no code changes needed! ✅

---

## 📋 Quick Checklist

- [ ] Repository pushed to GitHub
- [ ] Netlify site created from Git
- [ ] Backend deployed (Heroku/Railway/other)
- [ ] `BACKEND_URL` set in Netlify environment variables
- [ ] Frontend redeployed (cache cleared)
- [ ] Browser console shows correct backend URL
- [ ] Login page loads
- [ ] Backend health check works

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend URL not showing** | Trigger redeploy, clear browser cache |
| **CORS errors** | Check CORS_ORIGIN in backend includes Netlify domain |
| **Login fails** | Check backend is running, test: `curl https://your-backend-url.com/api/v1/health` |
| **Console blank** | Trigger rebuild in Netlify, wait for deploy to complete |

---

## 📚 Next Steps

- Read [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md) for detailed guide
- Read [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for backend options
- Check [DEPLOYMENT_QUICKSTART.md](../DEPLOYMENT_QUICKSTART.md) for other platforms

---

## 🎉 Done!

Your PWA LET app is now live on Netlify with a backend of your choice!

**Share your Netlify URL:** `https://your-site.netlify.app`

**Debugging still works locally:** `http://localhost:8080` (frontend) + `http://localhost:5000` (backend)

### Environment Detection Logic

```
If you're on localhost → uses localhost:5000
If you're on Netlify → uses BACKEND_URL from environment variables
If you're on custom domain → uses that domain + /api/v1
```

No configuration needed! It just works. 🚀
