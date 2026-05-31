# Quick Start: Deploy to Popular Hosting Platforms

Choose your platform and follow the quick guide.

---

## 🟣 **Heroku** (Easiest - Free Tier Available)

### Setup (5 minutes)

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create app:**
   ```bash
   heroku create your-app-name
   ```

3. **Configure environment:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set DB_HOST=your-mysql-host.com
   heroku config:set DB_USER=username
   heroku config:set DB_PASSWORD=password
   heroku config:set DB_NAME=pwa_let_db
   heroku config:set JWT_SECRET=$(openssl rand -hex 32)
   heroku config:set CORS_ORIGIN=https://your-app-name.herokuapp.com
   ```

4. **Create Procfile** (in root directory):
   ```
   web: cd backend && npm start
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

6. **View logs:**
   ```bash
   heroku logs --tail
   ```

**Costs:** Free tier available, $7+/month for paid

---

## 🚀 **Railway.app** (Modern & Fast)

### Setup (5 minutes)

1. **Sign up:** https://railway.app
2. **Create project** from GitHub
3. **Add services:**
   - Backend (from your repo)
   - MySQL (from Railway catalog)

4. **Set environment variables:**
   - NODE_ENV=production
   - DB_HOST, DB_USER, DB_PASSWORD
   - JWT_SECRET
   - CORS_ORIGIN

5. **Deploy:** Auto-deploys on git push

**Costs:** $5/month credit, then pay-as-you-go

---

## 💧 **DigitalOcean** (Full Control)

### Setup (15 minutes)

1. **Create Droplet:**
   - Ubuntu 22.04 LTS
   - 2GB RAM (minimum recommended)
   - Add SSH key

2. **SSH into droplet:**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

4. **Clone and setup:**
   ```bash
   git clone your-repo-url
   cd your-repo/backend
   npm install
   ```

5. **Create .env file:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your credentials
   ```

6. **Start with PM2:**
   ```bash
   pm2 start src/server.js --name "pwa-let"
   pm2 startup
   pm2 save
   ```

7. **Setup Nginx reverse proxy:**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/default
   ```
   
   Configure as shown in DEPLOYMENT_GUIDE.md

8. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

**Costs:** $5-12/month

---

## 🐳 **Docker on Any Server** (Recommended)

### Setup (10 minutes)

1. **Install Docker:**
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo usermod -aG docker $USER
   ```

2. **Create .env file:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with production settings
   ```

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

5. **Stop:**
   ```bash
   docker-compose down
   ```

**Benefits:**
- Same setup works everywhere
- Easy scaling
- Database included
- Nginx proxy included (optional)

---

## 🔵 **AWS EC2** (Professional Grade)

### Setup (20 minutes)

1. **Launch EC2 instance:**
   - Ubuntu 22.04 LTS
   - t3.small (1GB RAM, $10/month)
   - Security group: Allow 80, 443, SSH

2. **SSH into instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
   ```

4. **Setup application:**
   ```bash
   git clone your-repo-url
   cd your-repo/backend
   npm install
   npm run migrate
   ```

5. **Setup PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name "pwa-let"
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx** (see DEPLOYMENT_GUIDE.md)

7. **Setup SSL** with Let's Encrypt

8. **Create RDS MySQL database:**
   - AWS Console → RDS → Create Database
   - Update DB_HOST in .env

**Costs:** $10-30/month depending on resources

---

## 🌐 **Render.com** (Modern Alternative)

### Setup (5 minutes)

1. **Sign up:** https://render.com
2. **Connect GitHub repository**
3. **Create Web Service:**
   - Runtime: Node
   - Build command: `cd backend && npm install`
   - Start command: `npm start`

4. **Add environment variables:**
   - All values from your .env file

5. **Add MySQL database:**
   - Create Render MySQL database
   - Update DB credentials

6. **Deploy:** Auto-deploys on git push

**Costs:** Free tier available, $7+/month for paid

---

## 📌 **Universal Checklist**

Before deploying to ANY platform:

- [ ] Create `.env` file with production values
- [ ] Ensure database is accessible
- [ ] Run migrations: `npm run migrate`
- [ ] Test locally: `npm start`
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Set JWT_SECRET to a strong random value
- [ ] Verify NODE_ENV=production
- [ ] Test health endpoint after deployment

---

## 🧪 **Verify Deployment**

After deploying, test with:

```bash
# Health check
curl https://yourdomain.com/api/v1/health

# Should return:
# {"status":"Server is running","timestamp":"2024-..."}

# Test authentication endpoint
curl -X POST https://yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## 🆘 **Quick Troubleshooting**

| Problem | Solution |
|---------|----------|
| **Connection refused** | Check if server is running |
| **CORS error** | Update CORS_ORIGIN in .env |
| **Database error** | Verify DB credentials and host |
| **Port already in use** | Change PORT in .env |
| **Uploads not working** | Ensure uploads/ directory exists |
| **Auth token invalid** | Regenerate JWT_SECRET |

---

## 📚 **Need More Help?**

- Read `DEPLOYMENT_GUIDE.md` for detailed instructions
- Check `backend/PRODUCTION_SETUP.md` for API configuration
- Review `backend/.env.example` for environment variables

---

## 🎯 **Recommended for Beginners**

**Easiest Path:** Railway.app or Heroku
- Minimal configuration
- Auto-deploys from Git
- Included database options
- Fast startup

**Best Value:** DigitalOcean or Linode
- Full control
- Affordable
- Docker support
- Great documentation

**Most Professional:** AWS or Google Cloud
- Scalable
- Multiple services
- Enterprise-ready
- More configuration needed

**Most Flexible:** Docker on any VPS
- Same setup everywhere
- Easy to manage
- Great for learning
- Works with any host

Pick one and get started! 🚀
