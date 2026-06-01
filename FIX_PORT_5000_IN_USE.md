# ⚡ Cannot Use npm run dev - Port 5000 in Use

## The Problem

```
❌ Error: listen EADDRINUSE: address already in use :::5000
```

This means something is already running on port 5000. You need to stop it.

---

## ✅ QUICK FIX (Choose One)

### **Option 1: Kill Process Using Port 5000 (Recommended)**

**On Windows PowerShell:**

```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# You'll see output like:
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F

# Verify it's gone
netstat -ano | findstr :5000
# Should show nothing
```

### **Option 2: Use Different Port (If Option 1 doesn't work)**

Edit `backend/.env.local`:

```env
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=pwa_let_db
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:3000,http://192.168.93.2:3000
API_PREFIX=/api/v1
```

Change `PORT=5000` to `PORT=5001` (or any unused port like 5002, 8000, etc)

Then update `frontend/.env.local` to match:

```env
VITE_API_URL=http://localhost:5001/api/v1
REACT_APP_API_URL=http://localhost:5001/api/v1
NODE_ENV=development
```

### **Option 3: Full Reset (Nuclear Option)**

If nothing works, restart your computer. This will kill all processes.

---

## 🚀 AFTER FIXING PORT ISSUE

### **Step 1: Close all PowerShell/Terminal windows**

Close everything. Start fresh.

### **Step 2: Open NEW PowerShell and go to backend**

```powershell
cd C:\Users\rj\Downloads\PWA_LET_BACKEND-main2\backend
```

### **Step 3: Start backend**

```powershell
npm run dev
```

**Wait for:**
```
✓ Ready to accept requests
```

### **Step 4: Open ANOTHER NEW PowerShell and go to root**

```powershell
cd C:\Users\rj\Downloads\PWA_LET_BACKEND-main2
```

### **Step 5: Start frontend**

```powershell
npm run dev
```

**Wait for:**
```
Local: http://localhost:3000
```

### **Step 6: Test in Browser**

```
http://192.168.93.2:3000
Login → Should see "Welcome" → Should redirect to dashboard
```

---

## 🔍 DETAILED STEPS TO KILL PROCESS

### **Step 1: Find PID (Process ID)**

```powershell
netstat -ano | findstr :5000
```

Output example:
```
TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345
TCP    [::]:5000       [::]:0       LISTENING    12345
```

The **12345** is the PID (your actual number will be different).

### **Step 2: Kill the Process**

```powershell
taskkill /PID 12345 /F
```

Output:
```
SUCCESS: The process with PID 12345 has been terminated.
```

### **Step 3: Verify It's Gone**

```powershell
netstat -ano | findstr :5000
# Should show nothing now
```

### **Step 4: Try npm run dev Again**

```powershell
cd backend
npm run dev
```

Should work now!

---

## 📋 STEP-BY-STEP FIX (Copy & Paste)

```powershell
# 1. Find what's using port 5000
netstat -ano | findstr :5000

# 2. Copy the PID from output (example: 12345)

# 3. Kill it (replace 12345 with your actual PID)
taskkill /PID 12345 /F

# 4. Verify it's gone
netstat -ano | findstr :5000
# Should be empty

# 5. Go to backend
cd C:\Users\rj\Downloads\PWA_LET_BACKEND-main2\backend

# 6. Try npm run dev
npm run dev
```

---

## 🛠️ IF STILL GETTING npm ERRORS

Your second screenshot shows npm package.json errors. Try this:

```powershell
# In root folder
cd C:\Users\rj\Downloads\PWA_LET_BACKEND-main2

# Check if node_modules exists
ls node_modules

# If it exists but broken, delete it
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Try running
npm run dev
```

---

## 💡 COMMON PORT 5000 CULPRITS

These programs might be using port 5000:

| Program | How to Close |
|---------|-------------|
| Previous npm process | `taskkill /PID <PID> /F` |
| Another Node app | `taskkill /PID <PID> /F` |
| Your browser dev server | Close the terminal running it |
| Visual Studio Code | Close terminal tab |
| Docker container | `docker stop <container>` |

---

## ✅ QUICK CHECKLIST

- [ ] Run `netstat -ano \| findstr :5000` - shows nothing
- [ ] Backend folder has `node_modules` folder
- [ ] Backend `.env.local` has PORT=5000 (or your chosen port)
- [ ] Frontend `.env.local` has matching API URL
- [ ] Open NEW PowerShell (not reused terminal)
- [ ] Run `npm run dev` in correct folder
- [ ] Wait for "Ready to accept requests" or "Local: http://"

---

**Do this now:**

1. Open PowerShell
2. Run: `netstat -ano | findstr :5000`
3. Send me the output
4. I'll give you exact command to kill it

Or try **Option 2** and just change the port to 5001!
