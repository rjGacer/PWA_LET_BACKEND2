# PWA LET Backend - API Configuration Guide

## Overview

This backend serves the PWA LET (Licensure Examination for Teachers) application. It provides API endpoints for managing students, quizzes, modules, and performance tracking.

## Quick Start for Production

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your production settings
```

### 3. Run Migrations (First Time Setup)
```bash
npm run migrate
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

The server will start on `http://localhost:5000` by default.

## Environment Variables

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | Database host |
| `DB_USER` | root | Database user |
| `DB_PASSWORD` | `` | Database password |
| `DB_NAME` | pwa_let_db | Database name |
| `DB_PORT` | 3306 | Database port |

### Security

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | required in production | Secret key for JWT tokens |
| `JWT_EXPIRATION` | 7d | Token expiration time |
| `CORS_ORIGIN` | * | Allowed CORS origin(s) |

### API

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PREFIX` | /api/v1 | API endpoint prefix |
| `API_URL` | http://localhost:5000 | Frontend URL for API access |

### File Uploads

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_DIR` | ./uploads | Directory for uploaded files |
| `MAX_FILE_SIZE` | 10485760 | Max file size in bytes (10MB) |

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/verify` - Verify token
- `POST /api/v1/auth/logout` - User logout

### Students
- `GET /api/v1/students/me` - Get current student profile
- `GET /api/v1/students/:id` - Get student details
- `PUT /api/v1/students/:id` - Update student profile

### Quizzes
- `GET /api/v1/quizzes` - Get all quizzes
- `GET /api/v1/quizzes/:id` - Get quiz details
- `POST /api/v1/quizzes/student/:studentId/attempts` - Get student attempts
- `GET /api/v1/quizzes/attempts/:attemptId` - Get attempt details

### Modules
- `GET /api/v1/modules` - Get all modules
- `GET /api/v1/modules/:id` - Get module details
- `GET /api/v1/modules/subject/:subjectId` - Get modules by subject

### Categories & Subjects
- `GET /api/v1/categories` - Get all categories
- `GET /api/v1/subjects` - Get all subjects
- `GET /api/v1/subjects/:id` - Get subject details

### Performance
- `GET /api/v1/performance/student/:studentId` - Get student performance

### Upload
- `POST /api/v1/upload` - Upload file

### Health
- `GET /api/v1/health` - Health check

## Deployment

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-host
# ... set other environment variables
```

### DigitalOcean / VPS
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install nodejs

# Install PM2
sudo npm install -g pm2

# Setup and start
cd backend && npm install
pm2 start src/server.js --name "pwa-let-backend"
pm2 startup
pm2 save
```

### Docker
```bash
docker build -t pwa-let-backend .
docker run -p 5000:5000 \
  -e DB_HOST=your-host \
  -e DB_USER=your-user \
  -e DB_PASSWORD=your-password \
  pwa-let-backend
```

## Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Serve static files (frontend)
    location / {
        root /var/www/pwa-let;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Connection Refused
- Check if server is running: `pm2 list` or check logs
- Verify PORT environment variable
- Check firewall: `sudo ufw status`

### CORS Errors
- Verify `CORS_ORIGIN` matches frontend domain exactly
- For multiple domains: `CORS_ORIGIN=https://domain1.com,https://domain2.com`

### Database Errors
- Test connection: `mysql -h [HOST] -u [USER] -p [DATABASE]`
- Check credentials in .env
- Verify database server is running

### File Upload Issues
- Ensure `uploads/` directory exists: `mkdir -p backend/uploads`
- Check permissions: `chmod 755 backend/uploads`
- Verify `MAX_FILE_SIZE` is appropriate

## Production Best Practices

1. **Environment Variables**: Never hardcode secrets
2. **HTTPS**: Always use SSL/TLS in production
3. **Database**: Use strong passwords, separate DB server
4. **Backups**: Schedule regular database backups
5. **Monitoring**: Set up error tracking and logging
6. **Rate Limiting**: Implement rate limiting for APIs
7. **Updates**: Keep Node.js and dependencies updated
8. **Security Headers**: Configure CORS, CSP headers
9. **Process Manager**: Use PM2 or systemd for auto-restart
10. **Load Balancer**: Use Nginx or HAProxy for multiple instances

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] DATABASE password is secure
- [ ] CORS_ORIGIN is set to specific domain(s)
- [ ] NODE_ENV is set to 'production'
- [ ] HTTPS/SSL is configured
- [ ] .env file is never committed
- [ ] File upload size limits are set
- [ ] Database backups are scheduled
- [ ] Error logging is configured
- [ ] Rate limiting is implemented

## Support

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)

For API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
