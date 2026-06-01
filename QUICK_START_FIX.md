# LearnIQ Quick Reference - Login & Deployment Fix

## ✅ What Was Fixed
- Login now properly redirects to dashboard
- Supports localhost, Netlify, and production deployments
- API endpoints correctly detected for all scenarios
- Token verification works across all environments

---

## 🚀 Quick Start

### Local Development (5 minutes)
```bash
# Windows
.\\setup-local.ps1

# Mac/Linux
chmod +x setup-local.sh && ./setup-local.sh

# Then in two terminals:
# Terminal 1
npm run dev

# Terminal 2
cd backend && npm run dev
```\n\n### Netlify Deployment\n1. Set these in Netlify UI → Settings → Environment:\n   ```\n   BACKEND_URL=https://your-backend-api.com/api/v1\n   VITE_API_URL=https://your-backend-api.com/api/v1\n   REACT_APP_API_URL=https://your-backend-api.com/api/v1\n   ```\n\n2. Update backend CORS:\n   ```\n   CORS_ORIGIN=https://your-site.netlify.app\n   ```\n\n3. Deploy via GitHub or Netlify CLI\n\n---\n\n## 🔧 Files Modified\n\n**Core Fixes:**\n- `assets/scripts/api-config.js` - Unified API detection\n- `index.html` - Fixed login redirect\n- `assets/scripts/auth-guard.js` - Token verification\n- `assets/scripts/student-auth-guard.js` - Token verification  \n- `assets/scripts/ApiService.js` - API calls\n\n**Configuration:**\n- `.env.local` - Local dev config\n- `.env.production` - Production config\n- `netlify.toml` - Netlify settings\n- `backend/.env.local` - Backend dev config\n\n**Documentation:**\n- `AUTH_FIX_SUMMARY.md` - What was fixed\n- `DEPLOYMENT_GUIDE_COMPLETE.md` - Full guide\n- `setup-local.ps1` / `setup-local.sh` - Auto setup\n\n---\n\n## ✓ Testing Checklist\n\n### After Login\n- [ ] Browser console shows: \"✓ Token verified\"\n- [ ] Redirects to dashboard (not login page again)\n- [ ] Dashboard loads with user's name\n- [ ] Can see user's profile picture\n- [ ] Can navigate menu items\n\n### Console Logs to Expect\n```\n🔧 API Config initialized\n📍 Using [detection method]: [URL]\n🔐 ApiService initialized\n✓ Token verified successfully\n```\n\n### Browser DevTools\n**Application → Local Storage:**\n- `authToken` - JWT token (should exist)\n- `userRole` - \"student\" or \"teacher\"\n- `userName` - User's name\n\n**Network tab:**\n- `POST /api/v1/auth/student/login` - Status 200 ✓\n- `POST /api/v1/auth/verify` - Status 200 ✓\n\n---\n\n## 🐛 Troubleshooting\n\n### Dashboard doesn't load after login\n```\n1. Open DevTools (F12) → Console\n2. Look for red errors\n3. Check if authToken exists in localStorage\n4. Verify API URL is correct (not localhost:5000 on Netlify)\n```\n\n### CORS error on login\n```\n1. Backend CORS_ORIGIN setting wrong\n2. Backend not running (localhost only)\n3. Backend not deployed (production)\n4. Check CORS_ORIGIN=https://your-site.netlify.app\n```\n\n### API URL shows localhost:5000 on Netlify\n```\n1. Go to Netlify Dashboard\n2. Settings → Environment\n3. Add BACKEND_URL variable\n4. Redeploy site\n```\n\n### Token verification fails\n```\n1. Check backend logs\n2. Verify JWT_SECRET is set\n3. Check /api/v1/auth/verify endpoint exists\n4. Restart backend server\n```\n\n---\n\n## 📚 Environment Variables\n\n### Frontend (.env.local or .env.production)\n```env\nVITE_API_URL=http://localhost:5000/api/v1        # Local dev\nREACT_APP_API_URL=http://localhost:5000/api/v1   # Local dev\nNODE_ENV=development                              # or production\nVITE_DEBUG=true                                    # or false\n```\n\n### Backend (backend/.env.local or backend/.env.production)\n```env\nPORT=5000\nDB_HOST=localhost\nDB_USER=root\nDB_PASSWORD=password\nDB_DATABASE=pwa_let_db\nJWT_SECRET=change_this_key\nCORS_ORIGIN=http://localhost:3000,https://your-site.netlify.app\nFRONTEND_URL=http://localhost:3000\n```\n\n---\n\n## 🎯 API URL Detection Priority\n\nThe system automatically detects the correct API URL:\n\n1. **Manual override** - `window.BACKEND_URL`\n2. **Environment variables** - `VITE_API_URL`, `REACT_APP_API_URL`\n3. **Storage** - Saved in localStorage/sessionStorage\n4. **Localhost** - `http://localhost:5000/api/v1`\n5. **Local network IP** - `http://192.168.x.x:5000/api/v1`\n6. **Same domain** - `https://example.com/api/v1`\n\n---\n\n## 📖 Full Documentation\n\n- **DEPLOYMENT_GUIDE_COMPLETE.md** - Detailed setup & troubleshooting\n- **AUTH_FIX_SUMMARY.md** - Technical details of what was fixed\n- **backend/README.md** - Backend documentation\n- **backend/API_DOCUMENTATION.md** - API endpoints\n\n---\n\n## 💡 Pro Tips\n\n1. **Clear browser cache** if having issues\n   - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)\n\n2. **Check both terminals** are running\n   - Frontend: `npm run dev`\n   - Backend: `cd backend && npm run dev`\n\n3. **Use incognito mode** to test\n   - Avoids cache issues\n\n4. **Monitor console** while testing\n   - Shows all API calls and errors\n\n5. **Check backend logs** when debugging\n   - Shows auth and database issues\n\n---\n\n**Still stuck?** See DEPLOYMENT_GUIDE_COMPLETE.md for detailed troubleshooting.\n