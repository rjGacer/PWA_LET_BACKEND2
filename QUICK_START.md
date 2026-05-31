# 🚀 QUICK START - 5 Minutes to Running Backend

Follow these exact steps to get your backend running in 5 minutes:

## Step 1: Open Terminal/Command Prompt

Navigate to the project root:
```bash
cd C:\Users\rj\Downloads\PWA-LET-master
```

## Step 2: Install Dependencies

```bash
cd backend
npm install
```

⏱️ Takes ~2 minutes

Expected output:
```
added 245 packages in 2m
```

## Step 3: Setup Database

**Option A: Quick Setup (Recommended)**
```bash
mysql -u root -p pwa_let_db < database/schema.sql
```

When prompted, enter your MySQL password (or press Enter if you have no password).

**Option B: Manual Setup**
```bash
mysql -u root -p

# In MySQL CLI:
CREATE DATABASE pwa_let_db;
USE pwa_let_db;
source database/schema.sql;
EXIT;
```

## Step 4: Configure Environment

```bash
copy .env.example .env
```

**Edit `.env` file with your MySQL password:**
```env
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=pwa_let_db
```

## Step 5: Start the Server

```bash
npm run dev
```

Expected output:
```
🚀 PWA LET Teacher Backend Server
📍 Running on http://localhost:5000
✓ Ready to accept requests
```

✅ **Done!** Your backend is running!

---

## 🧪 Quick Test

Open in your browser:
```
http://localhost:5000/api/v1/categories
```

You should see JSON with category data.

---

## 📚 Next Steps

1. **Read Documentation:**
   - [SETUP_GUIDE.md](../SETUP_GUIDE.md) - Complete setup guide
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - All API endpoints
   - [FRONTEND_INTEGRATION.md](../FRONTEND_INTEGRATION.md) - How to use in frontend

2. **Test APIs:**
   - Use Postman: [Download](https://www.postman.com/downloads/)
   - Or use cURL:
   ```bash
   curl http://localhost:5000/api/v1/categories
   ```

3. **Connect Frontend:**
   - Copy `src/utils/ApiService.js` to `assets/scripts/`
   - Include in your HTML pages
   - Start making API calls

---

## ⚠️ Common Issues

### "Cannot find module 'express'"
```bash
npm install
```

### "Database connection failed"
- Make sure MySQL is running
- Check username/password in .env
- Verify database exists: `CREATE DATABASE pwa_let_db;`

### "Port 5000 already in use"
Change PORT in .env to 5001 (or another port)

### "CORS error in browser"
Update `.env`:
```
CORS_ORIGIN=*
```

---

## 📞 Need Help?

See detailed documentation:
- **Setup issues:** [SETUP_GUIDE.md](../SETUP_GUIDE.md#-troubleshooting)
- **API questions:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Frontend integration:** [FRONTEND_INTEGRATION.md](../FRONTEND_INTEGRATION.md)

---

**Server Running! 🎉**

Your backend is ready at: `http://localhost:5000`

Now proceed to integrate with your frontend!
