# LearnIQ Auth & Deployment Fix Summary

## What Was Fixed

### 1. **Login to Dashboard Redirect Issue** ✅
   - **Problem:** Users saw "Welcome" message but couldn't access the dashboard
   - **Root Cause:** 
     - API URL detection was incorrect for Netlify deployments
     - Token verification was failing silently
     - Redirect used relative paths that didn't work in all deployments
   
   - **Solution:**
     - Created unified `api-config.js` with comprehensive API URL detection
     - Fixed both `auth-guard.js` files to use the unified config
     - Updated login redirect to use absolute paths
     - Added fallback logic for multiple deployment scenarios

### 2. **Netlify + External Backend Support** ✅
   - Enhanced `netlify.toml` with proper routing and headers
   - Added environment variable injection support
   - Configured CORS headers for frontend-backend communication
   - Created environment-specific configuration files

### 3. **Localhost Development Support** ✅
   - Automatic detection of localhost:5000 backend
   - Support for frontend on ports 3000, 5173, and others
   - Local network IP detection (192.168.x.x, 10.x.x.x)
   - Proper CORS configuration for local development

---

## Files Modified

### Frontend Configuration
1. **`assets/scripts/api-config.js`** - Unified API configuration with fallback logic
2. **`assets/scripts/ApiService.js`** - Updated to use unified API config
3. **`assets/scripts/auth-guard.js`** - Now uses unified config for token verification
4. **`assets/scripts/student-auth-guard.js`** - Now uses unified config for token verification
5. **`index.html`** - Fixed login redirect to use absolute paths
6. **`netlify.toml`** - Enhanced for production deployment

### Configuration Files Created
1. **`.env.example`** - Template for frontend environment variables
2. **`.env.local`** - Local development configuration (localhost)
3. **`.env.production`** - Production configuration (Netlify)
4. **`.env.local` (backend)** - Backend local development config
5. **`.env.production` (backend)** - Backend production config

### Setup & Documentation
1. **`DEPLOYMENT_GUIDE_COMPLETE.md`** - Complete deployment and troubleshooting guide
2. **`setup-local.ps1`** - Windows setup script
3. **`setup-local.sh`** - Linux/Mac setup script

---

## How the Fix Works

### API URL Detection Priority (in order)

**Frontend (api-config.js):**
1. `window.BACKEND_URL` (manual override)
2. Environment variables (`VITE_API_URL`, `REACT_APP_API_URL`)
3. `sessionStorage`/`localStorage` (user-set backend URL)
4. Localhost detection → uses port 5000
5. Local network IP detection → uses port 5000
6. Same-domain deployment (production)

**Backend Auth Verification:**
- Uses the same API URL detection logic
- Includes fallback for when api-config.js hasn't loaded
- Works for all deployment scenarios

### Deployment Scenarios Supported

#### Localhost Development
- Frontend: `http://localhost:3000` or `http://localhost:5173`
- Backend: `http://localhost:5000`
- Auto-detection works automatically

#### Netlify + External Backend
- Frontend: `https://your-site.netlify.app`
- Backend: `https://your-backend-api.com`
- Configure via Netlify environment variables

#### Same-Domain Production
- Both served from same domain (e.g., `https://example.com`)
- Backend API behind `/api/v1` proxy
- Auto-detection works automatically

#### Local Network (Mobile Testing)
- Frontend: `http://192.168.1.x:3000`
- Backend: `http://192.168.1.x:5000`
- Auto-detection works automatically

---

## Quick Start

### For Local Development

1. **Run setup script:**
   ```bash
   # Windows
   .\setup-local.ps1
   
   # Mac/Linux
   chmod +x setup-local.sh
   ./setup-local.sh
   ```

2. **Configure database:**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

3. **Start both services:**
   ```bash
   # Terminal 1 - Frontend
   npm run dev
   
   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

4. **Access application:**
   - Open `http://localhost:3000`
   - Login with test credentials
   - Verify dashboard loads

### For Netlify Deployment

1. **Set environment variables in Netlify UI:**
   ```
   BACKEND_URL=https://your-backend-api.com/api/v1
   VITE_API_URL=https://your-backend-api.com/api/v1
   REACT_APP_API_URL=https://your-backend-api.com/api/v1
   ```

2. **Configure backend CORS:**
   ```env
   CORS_ORIGIN=https://your-site.netlify.app
   ```

3. **Deploy:**
   ```bash
   # Via GitHub (recommended)
   git push origin main
   
   # Or via Netlify CLI
   netlify deploy --prod
   ```

4. **Verify:**
   - Check browser console for API URL logging
   - Verify login redirects to dashboard
   - Check for CORS errors

---

## Debugging

### Check Browser Console
Look for these logs:
```
✅ ✓ Token verified successfully
🔧 API Config initialized
📍 Using [detection method]: [URL]
🔐 ApiService initialized
```

### Check localStorage
After login, verify these keys exist:
- `authToken` - JWT token
- `userRole` - "student" or "teacher"
- `userName` - User's name

### Check Network Requests
DevTools → Network tab, look for:
- `/api/v1/auth/student/login` - Login request
- `/api/v1/auth/verify` - Token verification
- Check response status (200 = success)

### Common Issues & Fixes

**Issue: "Welcome" shows but no dashboard redirect**
- Check browser console for errors
- Verify `authToken` in localStorage
- Check `/api/v1/auth/verify` network request

**Issue: CORS error on login**
- Backend CORS_ORIGIN not set correctly
- Check backend is running
- Verify CORS middleware is working

**Issue: "Cannot GET /student/studentDashboard.html"**
- Check netlify.toml routing rules
- Verify file paths are correct
- Clear browser cache

**Issue: API URL shows localhost:5000 on Netlify**
- Netlify environment variables not set
- Check Netlify UI Settings → Environment
- Rebuild site after changing env vars

---

## Environment Variables Reference

### Frontend
```env
# Required
VITE_API_URL=http://localhost:5000/api/v1

# Optional
REACT_APP_API_URL=http://localhost:5000/api/v1
NODE_ENV=development
VITE_DEBUG=true
VITE_SERVICE_WORKER_ENABLED=true
```

### Backend
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=pwa_let_db

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000,https://your-site.netlify.app

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## Testing Checklist

- [ ] Frontend loads without console errors
- [ ] API URL is detected correctly (check console)
- [ ] Student login works
- [ ] Teacher login works
- [ ] Redirected to correct dashboard after login
- [ ] Dashboard loads with user information
- [ ] Can navigate between pages
- [ ] Token verification succeeds (check console)
- [ ] localStorage contains authToken
- [ ] No CORS errors in console
- [ ] logout works correctly
- [ ] Session persists on page reload

---

## Additional Resources

- Full Deployment Guide: `DEPLOYMENT_GUIDE_COMPLETE.md`
- Backend Setup: `backend/README.md`
- API Documentation: `backend/API_DOCUMENTATION.md`

---

## Support

For detailed troubleshooting, see **DEPLOYMENT_GUIDE_COMPLETE.md** which includes:
- Complete step-by-step setup instructions
- Detailed troubleshooting for common issues
- Network debugging guide
- Backend configuration details
