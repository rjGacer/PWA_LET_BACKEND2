# Web Hosting Deployment Guide

This guide will help you deploy the PWA LET Backend to a web hosting platform.

## Quick Start

### 1. **Environment Setup**

Copy `.env.example` to `.env` and update all values:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your production credentials:

```env
PORT=5000
NODE_ENV=production

# Your database host (not localhost!)
DB_HOST=your-db-host.example.com
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=pwa_let_db
DB_PORT=3306

# Strong JWT secret (generate a random string)
JWT_SECRET=your-random-jwt-secret-here

# Your production domain
CORS_ORIGIN=https://yourdomain.com

# API URL - where frontend will find your backend
API_URL=https://yourdomain.com/api/v1
API_PREFIX=/api/v1
```

### 2. **Frontend Configuration**

The frontend now automatically detects the API endpoint based on the current domain:
- ✅ No more hardcoded localhost:5000
- ✅ Automatically uses the same domain and port
- ✅ Works with reverse proxies
- ✅ Compatible with subdomain deployments

### 3. **Database Setup**

On your web host:

1. Create a MySQL database
2. Update DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in `.env`
3. Run migrations:

```bash
npm run migrate
```

### 4. **Install Dependencies**

```bash
cd backend
npm install
```

### 5. **Start the Server**

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

---

## Deployment Options

### Option 1: Shared Hosting (cPanel, Plesk)

Most shared hosting providers don't support Node.js directly. You'll need:

1. **Upgrade to VPS or Cloud Hosting** (Recommended)
2. Or use a **Node.js hosting platform** (see Option 2)

### Option 2: Node.js Hosting Platforms

**Recommended Providers:**
- **Heroku** (Easy, free tier available)
- **Railway.app** (Modern, developer-friendly)
- **Render.com** (Good performance)
- **AWS EC2** (Scalable, professional)
- **DigitalOcean** (Affordable VPS)
- **Linode** (Reliable VPS)

### Heroku Deployment Example

1. **Create Heroku account** and install Heroku CLI

2. **Create a Procfile** in the root directory:
```
web: cd backend && npm start
```

3. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-db-host
heroku config:set DB_USER=your-db-user
heroku config:set DB_PASSWORD=your-password
heroku config:set DB_NAME=pwa_let_db
heroku config:set JWT_SECRET=your-secret-key
heroku config:set CORS_ORIGIN=https://your-heroku-app.herokuapp.com
```

4. **Deploy:**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

### Option 3: Traditional VPS (DigitalOcean, Linode, AWS)

1. **SSH into your server**

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2** (for process management):
```bash
sudo npm install -g pm2
```

4. **Clone your repository:**
```bash
git clone your-repo-url
cd your-repo/backend
npm install
```

5. **Set up .env file** with your production values

6. **Start with PM2:**
```bash
pm2 start src/server.js --name "pwa-let-backend"
pm2 startup
pm2 save
```

7. **Set up Nginx reverse proxy:**

Create `/etc/nginx/sites-available/pwa-let`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/pwa-let /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Frontend Deployment

### Static Hosting (Netlify, Vercel, GitHub Pages)

1. **Copy frontend files** (all HTML, CSS, JS, assets, manifest.json, sw.js)

2. **Deploy to:**
   - Netlify (drag and drop)
   - Vercel (git integration)
   - GitHub Pages (free)
   - AWS S3 + CloudFront

### Same Domain Deployment

For best performance and CORS simplicity, deploy frontend and backend on the same domain:

```
https://yourdomain.com/          → Frontend (static)
https://yourdomain.com/api/v1/   → Backend API
```

Use an Nginx reverse proxy configuration as shown above.

---

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Update DB credentials
- [ ] Set CORS_ORIGIN to your exact domain(s)
- [ ] Enable SSL/HTTPS
- [ ] Set NODE_ENV=production
- [ ] Keep .env file secret (never commit to git)
- [ ] Use strong database passwords
- [ ] Regular database backups
- [ ] Monitor server logs
- [ ] Keep Node.js updated
- [ ] Use a Web Application Firewall (WAF)

---

## Troubleshooting

### CORS Errors

Make sure `CORS_ORIGIN` in `.env` matches your frontend domain exactly:
```env
# ✅ Correct
CORS_ORIGIN=https://yourdomain.com

# ❌ Wrong
CORS_ORIGIN=*
```

### Port Issues

If port 5000 is blocked, change in `.env`:
```env
PORT=8080
```

Then update your reverse proxy configuration accordingly.

### Database Connection Failed

1. Verify DB credentials are correct
2. Check if database server is running
3. Verify firewall allows connection to database port
4. Test connection manually:
```bash
mysql -h [DB_HOST] -u [DB_USER] -p [DB_NAME]
```

### Files Not Uploading

1. Ensure `uploads/` directory exists and is writable:
```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

2. Check `MAX_FILE_SIZE` in `.env` for file size limits

### API Not Responding

1. Check server logs: `pm2 logs` or check systemd: `journalctl -u your-service`
2. Verify .env file is loaded: `cat backend/.env`
3. Test API health: `curl https://yourdomain.com/api/v1/health`

---

## Monitoring & Maintenance

### Log Monitoring

```bash
# With PM2
pm2 logs pwa-let-backend

# With systemd
journalctl -u your-service -f

# With Docker
docker logs your-container -f
```

### Performance Monitoring

1. Monitor database queries
2. Check server CPU and memory
3. Monitor response times
4. Set up error tracking (Sentry, LogRocket)

### Updates

```bash
cd backend
npm update
npm audit fix
npm test
pm2 restart pwa-let-backend
```

---

## Production Checklist

- [ ] Database configured and tested
- [ ] Environment variables set correctly
- [ ] SSL certificate installed
- [ ] CORS configured for your domain
- [ ] JWT secret is strong and unique
- [ ] File uploads directory created and writable
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Rate limiting configured (optional)
- [ ] Firewall rules configured

---

## Support

For issues with:
- **Node.js/Express**: Check [Express docs](https://expressjs.com/)
- **MySQL**: Check [MySQL docs](https://dev.mysql.com/)
- **CORS**: Check [MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- **SSL**: Check [Let's Encrypt docs](https://letsencrypt.org/docs/)
