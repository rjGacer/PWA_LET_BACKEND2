# 🔧 Local Network Dashboard Issue - Troubleshooting

## Your Current Setup
- **Frontend IP:** `192.168.93.2` (Your local network)
- **Backend IP:** Should also be `192.168.93.2:5000`
- **Backend URL detected:** ✅ Correct (`http://192.168.93.2:5000/api/v1`)

## ✅ First Fix Applied
- Removed missing `js/main.js` that was causing 404 error

---

## 🔍 Step 1: Check If Backend is Running

Open a **command prompt/terminal** and run:

```bash
# On Windows (PowerShell)
$response = Invoke-WebRequest -Uri "http://192.168.93.2:5000/health" -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) { 
  Write-Host "✅ Backend is running!" 
} else { 
  Write-Host "❌ Backend not responding" 
}

# On Mac/Linux
curl -s http://192.168.93.2:5000/health | grep -q "status" && echo "✅ Backend running" || echo "❌ Backend not found"
```

**If backend is NOT running:**
```bash
cd backend
npm run dev
```

---

## 🔍 Step 2: Check Browser Console

1. Open your site on `http://192.168.93.2:3000` (or whatever port)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for these messages:

**Should see ✅:**
```
🔧 API Config initialized
📍 Using local network IP: http://192.168.93.2:5000/api/v1
🔐 ApiService initialized
```

**If you see ❌:**
```
API Config not initialized
Backend URL is wrong
Cannot connect to API
```

---

## 🔍 Step 3: Check Network Requests

1. Still in DevTools, go to **Network** tab
2. **Refresh the page** (F5)
3. Look for these requests:

### After Login, Look For:

**Request 1: POST /api/v1/auth/student/login**
- Status: **200** ✅ (Success)
- Response should have a `token` field

**Request 2: POST /api/v1/auth/verify**
- Status: **200** ✅ (Success)
- Response: `{authenticated: true}`

**If you see error responses (4xx or 5xx):**
- Check backend console for error messages
- Backend might not be running
- Check `CORS_ORIGIN` settings

---

## 🔍 Step 4: Check localStorage

After login, check if token was saved:

1. DevTools → **Application** tab
2. Left sidebar → **Local Storage**
3. Click your site URL
4. Look for these keys:

```
✅ authToken    → Should have a long JWT token
✅ userRole     → Should be "student" or "teacher"
✅ userName     → Should be user's name
```

**If these don't exist:**
- Login failed silently
- Backend returned error
- Check Network tab for error response

---

## 🚀 QUICK FIX CHECKLIST

### Before testing login:

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Frontend is running (`npm run dev` in root)
- [ ] Both are on same IP: `192.168.93.2`
- [ ] Backend port: **5000**
- [ ] Frontend port: **3000** (or 5173, etc)
- [ ] Can reach backend: `http://192.168.93.2:5000/health` works

### Testing login:

- [ ] Open `http://192.168.93.2:3000` in browser
- [ ] Open DevTools (F12) → Console
- [ ] See: "API Config initialized" + correct backend URL
- [ ] Try logging in
- [ ] See: "Welcome [Name]!" message
- [ ] Automatically redirect to dashboard
- [ ] Dashboard loads with user's name

---

## 🆘 COMMON ISSUES ON LOCAL NETWORK

### Issue: "Welcome" shows but no redirect

**Cause 1: Backend not running**
```bash
cd backend
npm run dev
```

**Cause 2: Backend CORS not configured**
Edit `backend/.env.local`:
```env
CORS_ORIGIN=http://192.168.93.2:3000
```

**Cause 3: Token verification failing**
- Check Network tab → look for `/api/v1/auth/verify` request
- Should return status 200
- If 404: endpoint doesn't exist
- If 500: database error

### Issue: Login button doesn't work

**Check:**
1. DevTools → Network tab
2. Try login again
3. Look for POST request to `/api/v1/auth/student/login`
4. Check response:
   - Status 200 = Success (but might still have error in response)
   - Status 400 = Bad request (check error message)
   - Status 500 = Server error (check backend logs)

### Issue: "CORS error" in console

**Fix:**
1. Stop backend: `Ctrl+C`
2. Edit `backend/.env.local`
3. Add this line:
   ```env
   CORS_ORIGIN=http://192.168.93.2:3000
   ```
4. Restart backend: `npm run dev`

---

## 📋 COMPLETE STEP-BY-STEP PROCESS

### Terminal 1: Start Backend
```bash
cd backend
npm run dev
# Should see: "🚀 PWA LET Teacher Backend Server"
# Should see: "📍 Running on http://localhost:5000"
```

### Terminal 2: Start Frontend  
```bash
npm run dev
# Should see: "Local: http://localhost:3000"
# or "Local: http://192.168.93.2:3000"
```

### In Browser:
```
1. Open http://192.168.93.2:3000
2. Click "Get Started" or "Start Studying"
3. Log in with test credentials
4. After "Welcome" message, should redirect to dashboard
5. Dashboard should show:
   - Your name
   - Your profile picture
   - Module cards
   - Quiz cards
   - Practice mode card
```

---

## 🔐 TEST CREDENTIALS

If you seeded the database, try:

**Student:**
- Email: `student@example.com`
- Password: `password` (or whatever was set)

**Teacher:**
- Email: `teacher@example.com`
- Password: `password` (or whatever was set)

Check `backend/database/seed.js` for actual test credentials.

---

## 🐛 STILL STUCK?

1. **Check backend logs** - Run `npm run dev` in backend folder
   - Look for error messages
   - Check database connection

2. **Check frontend console** - DevTools → Console tab
   - Look for red error messages
   - Check API URLs

3. **Check Network tab** - DevTools → Network tab
   - Monitor requests while logging in
   - Check response status codes

4. **Check localStorage** - DevTools → Application → Local Storage
   - Token should exist after login

5. **Restart everything**
   - Stop both frontend and backend (Ctrl+C)
   - Start backend first: `cd backend && npm run dev`
   - Then start frontend: `npm run dev`

---

## 📞 DEBUG COMMANDS

**Test backend is running:**
```bash
curl http://192.168.93.2:5000/health
# Should return: {"status": "Server is running"}
```

**Test CORS configuration:**
```bash
# Add header from frontend domain
curl -H "Origin: http://192.168.93.2:3000" http://192.168.93.2:5000/health
# Should have CORS headers in response
```

**Test login endpoint:**
```bash
curl -X POST http://192.168.93.2:5000/api/v1/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password","device_id":"test-device"}'
# Should return token
```

---

## ✅ NEXT STEPS

1. Make sure **both frontend and backend are running**
2. Check browser console for errors
3. Try login - should see "Welcome" message
4. Check if token is in localStorage
5. If redirected to dashboard - **Success! 🎉**
6. If not, check Network tab for failing requests

If still not working, share the **Network tab error** and I'll help you fix it!
