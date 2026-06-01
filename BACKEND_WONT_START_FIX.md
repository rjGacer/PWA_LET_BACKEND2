# 🔥 Backend Won't Start - Complete Fix

## The Problem

```
❌ npm error code ENOENT
❌ npm error path ... package.json
❌ Http-server stopped
❌ POST /api/v1/auth/verify returns 404
```

**Translation:** Backend dependencies are missing or corrupted.

---

## ✅ COMPLETE FIX (Follow exactly)

### **Step 1: Clean Up**

Open PowerShell in the **backend** folder and run:

```powershell
# Navigate to backend folder
cd backend

# Remove old node_modules
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Remove package lock
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# Verify we're in right place (should show src/ config/ database/ etc)
dir
```

### **Step 2: Clear npm cache**

```powershell
npm cache clean --force
```

### **Step 3: Reinstall everything**

```powershell
npm install
# This should take 2-3 minutes
# Wait for it to finish completely
```

### **Step 4: Check .env file**

Make sure `backend/.env.local` exists with correct settings:

```powershell
# Check if file exists
Test-Path .env.local

# If not, create it
@"
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=pwa_let_db
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://192.168.93.2:3000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000
"@ | Out-File -FilePath .env.local -Encoding UTF8
```

### **Step 5: Test backend startup**

```powershell
# Try starting backend
npm run dev

# You should see:
# 🚀 PWA LET Teacher Backend Server
# 📍 Running on http://localhost:5000
# ✓ Ready to accept requests
```

### **Step 6: Test the endpoint**

Open another PowerShell and test:

```powershell
# Test if backend is running
$response = Invoke-WebRequest -Uri "http://localhost:5000/health" -ErrorAction SilentlyContinue
$response.StatusCode
# Should show: 200
```

---

## 🎯 If Step 5 Still Fails

### **Check database connection**

Edit `backend/.env.local` and verify:
```env
DB_HOST=localhost        ✅ Should be localhost (or your DB server IP)
DB_USER=root             ✅ Your MySQL username
DB_PASSWORD=password     ✅ Your MySQL password
DB_DATABASE=pwa_let_db   ✅ Database name
```

### **Manually test database**

```powershell
# Install mysql client if needed
npm install -g mysql

# Test connection (replace with your creds)
mysql -h localhost -u root -p
# Enter your password
# Type: SELECT 1;
# Should return: 1
# Type: EXIT
```

### **Create database if missing**

```powershell
# Start mysql
mysql -h localhost -u root -p

# Paste this:
CREATE DATABASE IF NOT EXISTS pwa_let_db;
USE pwa_let_db;

# Create a simple test table
CREATE TABLE IF NOT EXISTS test (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255)
);

# Insert test data
INSERT INTO test (name) VALUES ('test');

# Exit
EXIT
```

---

## 🚀 Quick Start After Fix

Once everything is working:

### **Terminal 1: Backend**
```powershell
cd backend
npm run dev
# Wait for "✓ Ready to accept requests"
```

### **Terminal 2: Frontend**
```powershell
# From root folder
npm run dev
# Wait for "Local: http://localhost:3000"
```

### **Browser**
```
1. Open http://192.168.93.2:3000
2. Try login
3. Check DevTools Console (F12):
   - Should see "✓ Token verified successfully"
4. Should redirect to dashboard
```

---

## ✅ VERIFICATION CHECKLIST

After starting backend:

- [ ] No red errors in backend console
- [ ] Backend shows "Running on http://localhost:5000"
- [ ] Can reach http://localhost:5000/health (shows JSON)
- [ ] Frontend console shows correct API URL
- [ ] Login succeeds
- [ ] Token verification succeeds (no 404 error)
- [ ] Dashboard loads

---

## 🆘 If STILL Not Working

### **Check if Node.js is installed**
```powershell
node --version
npm --version
# Both should show versions
```

### **Check current working directory**
```powershell
Get-Location
# Should show: C:\Users\rj\Downloads\PWA_LET_BACKEND-main2\backend
# If not: cd backend
```

### **Manually start backend without nodemon**
```powershell
# Instead of: npm run dev
# Try: 
node src/server.js
# This will show errors more clearly
```

### **Check port 5000 is free**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# If something is using it, kill it:
taskkill /PID <PID> /F
```

---

## 📋 STEP-BY-STEP COMMANDS (Copy & Paste)

```powershell
# 1. Navigate to backend
cd C:\Users\rj\Downloads\PWA_LET_BACKEND-main2\backend

# 2. Clean up
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 3. Clean npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. Start backend
npm run dev
```

If you get any error messages during these steps, **copy & paste the error message** and I'll help you fix it!

---

## 💡 COMMON ERRORS & FIXES

| Error | Fix |
|-------|-----|
| `ENOENT: no such file or directory` | Run `npm install` in backend folder |
| `Cannot find module 'express'` | Delete node_modules, run `npm install` |
| `EADDRINUSE: address already in use` | Port 5000 is taken, use different port or kill process |
| `MYSQL_ERROR: connect ECONNREFUSED` | MySQL not running or wrong credentials in .env |
| `MODULE_NOT_FOUND` | Run `npm install` again |

---

**Try these steps and let me know what happens!** Share any error messages and I'll fix them.
