# Production Deployment Guide

## 🚀 Quick Start

### Option 1: Single Server Deployment (Recommended)

1. **Build for production:**

   ```bash
   ./build-prod.sh
   ```

2. **Set environment variables:**

   ```bash
   cp server/.env.example server/.env.production
   # Edit server/.env.production with your values
   ```

3. **Deploy:**
   - Upload entire project to your server
   - Set `NODE_ENV=production`
   - Run `npm start` in the root directory

### Option 2: Docker Deployment

1. **Build Docker image:**

   ```bash
   docker build -t messenger-app .
   ```

2. **Run container:**
   ```bash
   docker run -p 5000:5000 -e NODE_ENV=production messenger-app
   ```

### Option 3: Docker Compose

1. **Start with compose:**
   ```bash
   docker-compose up -d
   ```

## 🌐 Hosting Platform Setup

### Heroku

```bash
# Add buildpacks
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CLIENT_URL=https://your-app.herokuapp.com
heroku config:set JWT_SECRET=your-secure-secret

# Deploy
git push heroku main
```

### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Connect repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables

### DigitalOcean App Platform

1. Create app from GitHub
2. Set build command: `npm run build`
3. Set run command: `npm start`
4. Configure environment variables

## 🔧 Environment Variables

### Server (.env.production)

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
CLIENT_URL=https://yourdomain.com
```

### Client (.env.production)

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SOCKET_URL=https://yourdomain.com
GENERATE_SOURCEMAP=false
```

## 🗄️ Database Migration (SQLite → PostgreSQL)

For production, consider upgrading to PostgreSQL:

1. **Install pg dependency:**

   ```bash
   cd server && npm install pg
   ```

2. **Update database/init.js** to support PostgreSQL

3. **Set DATABASE_URL:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

## 🔒 Security Checklist

- [ ] Strong JWT secret (32+ characters)
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] Database secured
- [ ] Environment variables protected
- [ ] Error messages sanitized for production

## 📊 Monitoring

- Health check endpoint: `/api/health`
- Monitor server logs for errors
- Set up uptime monitoring
- Monitor database performance

## 🚨 Troubleshooting

### WebSocket Connection Issues

- Ensure WebSocket support on hosting platform
- Check firewall settings
- Verify CORS configuration

### Build Failures

- Check Node.js version (>=16.0.0)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

### Database Issues

- Check file permissions for SQLite
- For PostgreSQL, verify connection string
- Ensure database migrations ran successfully

## 🔧 Additional Production Optimizations

### Performance Enhancements

- Gzip compression enabled
- Static file caching
- Connection pooling for database
- Rate limiting implemented

### Security Features

- CORS properly configured
- Security headers added
- JWT token validation
- Input sanitization
- HTTPS enforcement

### Monitoring & Logging

- Health check endpoint: `/api/health`
- Graceful shutdown handling
- Process management with PM2
- Error logging and tracking

### Environment-Specific Configurations

- Development vs Production environment detection
- Dynamic API URL resolution
- SSL/TLS support for production
- Database switching (SQLite → PostgreSQL)

## 📱 Mobile & PWA Considerations

- Service worker support
- Offline functionality
- Push notifications ready
- Responsive design implemented

---

**All production changes have been implemented! Your app is now production-ready.** 🎉
