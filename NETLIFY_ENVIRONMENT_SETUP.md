# 🎯 Netlify Environment Setup - Step by Step

## ✅ FIXED: js/main.js 404 Error

The missing `js/main.js` file has been removed from index.html. This was causing the 404 error. Frontend should now load properly.

---

## 📍 WHERE TO FIND NETLIFY ENVIRONMENT VARIABLES

### **Step 1: Go to Your Netlify Dashboard**
- Visit: https://app.netlify.com
- Log in with your account
- Click on your site from the list

### **Step 2: Navigate to Settings**
```
Your Site Dashboard
    ↓
    Top Menu → "Site Settings" (or Settings gear icon)
    ↓
    Left Sidebar → "Build & Deploy"
    ↓
    Expand "Environment"
    ↓
    Click "Edit variables"
```

### **Step 3: Add Environment Variables**

In the Environment Variables section, click "Add a variable" and add these three:

**Variable 1:**
```
Key:   BACKEND_URL
Value: https://your-backend-api.com/api/v1
```
*(Replace `your-backend-api.com` with your actual backend URL)*

**Variable 2:**
```
Key:   VITE_API_URL
Value: https://your-backend-api.com/api/v1
```

**Variable 3:**
```
Key:   REACT_APP_API_URL
Value: https://your-backend-api.com/api/v1
```

### **Step 4: Save and Redeploy**

1. Click **"Save"** after adding variables
2. Go back to **"Deploys"** tab
3. Find your latest deployment
4. Click the **three dots (...)** → **"Trigger deploy"** → **"Deploy site"**

---

## 📸 VISUAL GUIDE (If you're still confused)

### Path: Netlify Dashboard → Settings → Build & Deploy → Environment

```
┌─────────────────────────────────────────────────────────┐
│  Netlify Dashboard (app.netlify.com)                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Your Sites                                             │
│  ├─ your-site-name.netlify.app  ← Click here          │
│  └─ (other sites)                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Site Dashboard                                         │
├─────────────────────────────────────────────────────────┤
│  Top Menu Tabs:                                         │
│  Deploys | Previews | Analytics | Settings | Domains   │
│                                          ↑              │
│                                    Click "Settings"     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Site Settings                                          │
├─────────────────────────────────────────────────────────┤
│  Left Sidebar:                                          │
│  ├─ General                                             │
│  ├─ Domain management                                   │
│  ├─ Redirects and rewrites                              │
│  ├─ Forms                                               │
│  ├─ Environment                     ← Click here        │
│  ├─ Build & Deploy                                      │
│  └─ ...                                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Build environment variables                            │
│  [Edit variables] button                                │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Add a variable                                      ││
│  │                                                     ││
│  │ Key:   BACKEND_URL                                 ││
│  │ Value: https://your-backend.com/api/v1             ││
│  │                                                     ││
│  │ [Add] [Save]                                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 QUICK LINKS

- **Netlify Dashboard:** https://app.netlify.com
- **Site Settings:** https://app.netlify.com/teams/[YOUR-TEAM]/sites/[YOUR-SITE]/settings/general
- **Environment Docs:** https://docs.netlify.com/environment-variables/overview/

---

## 🆘 If You Still Can't Find It

**Option 1: Check if you're in the right place**
- [ ] You're logged into Netlify (not just the site)
- [ ] You clicked on your actual site name
- [ ] You're in "Site Settings" (not "Team Settings")
- [ ] You're looking at "Build & Deploy" → "Environment"

**Option 2: Use this direct URL pattern**
```
https://app.netlify.com/teams/YOUR-TEAM/sites/YOUR-SITE/settings/env
```
Replace:
- `YOUR-TEAM` - your Netlify team name (usually your username)
- `YOUR-SITE` - your site name (from the dashboard)

**Option 3: Contact Netlify Support**
- Click the chat button in Netlify Dashboard
- They can help you find environment settings

---

## ✅ AFTER SETTING VARIABLES

1. **Redeploy your site:**
   - Go to "Deploys" tab
   - Find latest deployment
   - Click "..." → "Trigger deploy"

2. **Verify it worked:**
   - After deploy completes, open your site
   - Open DevTools (F12) → Console
   - Should see: `📍 Using environment-injected backend URL`
   - Look for your correct backend API URL

3. **Test login:**
   - Log in with test account
   - Should see "✅ Welcome [Name]!"
   - Should redirect to dashboard
   - Should NOT see 404 or CORS errors

---

## 🚨 COMMON MISTAKES

❌ **Wrong:** Trying to set variables in "Team Settings"
✅ **Right:** Go to specific Site Settings → Build & Deploy → Environment

❌ **Wrong:** Adding variables before deployment
✅ **Right:** Add variables THEN redeploy to apply them

❌ **Wrong:** Using localhost API URL (http://localhost:5000)
✅ **Right:** Use full production URL (https://your-backend.com/api/v1)

❌ **Wrong:** Forgetting to redeploy after adding variables
✅ **Right:** Always redeploy for changes to take effect

---

## 📝 BACKEND CONFIGURATION CHECKLIST

Also make sure your BACKEND has these settings in its `.env.production`:

```env
CORS_ORIGIN=https://your-site.netlify.app
JWT_SECRET=your_secret_key
PORT=5000 (or your backend port)
DB_HOST=your-database-host
```

The `CORS_ORIGIN` is critical - it must match your Netlify site URL exactly!

---

## 🎯 FINAL CHECKLIST

Before testing login:

- [ ] Frontend js/main.js removed (just fixed)
- [ ] Netlify environment variables set:
  - [ ] BACKEND_URL
  - [ ] VITE_API_URL
  - [ ] REACT_APP_API_URL
- [ ] Site redeployed after setting variables
- [ ] Backend CORS_ORIGIN set to your Netlify URL
- [ ] Backend is deployed and running
- [ ] Backend health check works: `/health` endpoint responds

Then test:
- [ ] Open your Netlify site
- [ ] Check console for "Using environment-injected backend URL"
- [ ] Try to login
- [ ] Should redirect to dashboard (NOT login page)

---

**Questions?** Check DEPLOYMENT_GUIDE_COMPLETE.md for more detailed setup instructions.
