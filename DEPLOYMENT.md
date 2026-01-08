# Deployment Guide - Trainer3

This guide explains how to deploy Trainer3 to production using Render.com with automatic CI/CD from GitHub.

## 🚀 Quick Deploy

### Option 1: One-Click Deploy (Easiest)

1. **Fork or push to your GitHub repository**

2. **Go to Render.com**
   - Sign up at https://render.com (free)
   - Connect your GitHub account

3. **Deploy from Blueprint**
   - Click "New" → "Blueprint"
   - Select your `trainer3` repository
   - Render will read `render.yaml` and create all services

4. **Set Environment Variables**
   - Go to Backend service → Environment
   - Add: `OPENAI_API_KEY=sk-proj-your-key`
   - Save changes (will trigger redeploy)

5. **Done!**
   - Frontend URL: `https://trainer3-frontend.onrender.com`
   - Backend URL: `https://trainer3-backend.onrender.com`

### Option 2: Manual Setup

If the blueprint doesn't work, deploy each service manually:

#### 1. Deploy Database

```
Service: PostgreSQL
Name: trainer3-db
Database: trainer3
User: trainer3
Region: Oregon (or closest to you)
Plan: Free
```

After creation, copy the **Internal Database URL**

#### 2. Deploy Backend

```
Service: Web Service
Name: trainer3-backend
Environment: Docker
Region: Oregon (same as database)
Branch: main
Dockerfile Path: ./packages/backend/Dockerfile.prod
Plan: Free

Environment Variables:
- NODE_ENV=production
- DATABASE_URL=<paste internal database URL>
- OPENAI_API_KEY=sk-proj-your-key
- JWT_SECRET=<generate random string>
- SESSION_SECRET=<generate random string>
- BACKEND_PORT=3000
- FRONTEND_URL=https://trainer3-frontend.onrender.com

Health Check Path: /health
```

#### 3. Deploy Frontend

```
Service: Web Service
Name: trainer3-frontend
Environment: Docker
Region: Oregon (same as backend)
Branch: main
Dockerfile Path: ./packages/frontend/Dockerfile.prod
Plan: Free

Environment Variables:
- VITE_API_URL=https://trainer3-backend.onrender.com
```

## 🔄 CI/CD Pipeline

### Automatic Deployment

When you merge to `main`:

1. **GitHub Actions runs** (`.github/workflows/ci.yml`):
   - Builds all packages
   - Runs type checking
   - Builds Docker images
   - Validates everything compiles

2. **Render auto-deploys**:
   - Detects new commit on `main`
   - Pulls latest code
   - Builds Docker images
   - Runs database migrations
   - Deploys new version
   - Zero-downtime deployment

### Manual Deploy

Trigger deployment manually:

```bash
# From GitHub UI
Actions → Deploy to Production → Run workflow

# Or push to main
git push origin main
```

## 🌍 Alternative Hosting Options

### Railway.app (Recommended Alternative)

**Pros:** Even easier, generous free tier, auto-SSL
**Setup:**

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select `trainer3` repo
4. Railway auto-detects `docker-compose.yml`
5. Add `OPENAI_API_KEY` in Variables
6. Deploy!

### Fly.io

**Pros:** Good free tier, global edge deployment
**Setup:**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy backend
cd packages/backend
flyctl launch --dockerfile Dockerfile.prod

# Deploy frontend
cd ../frontend
flyctl launch --dockerfile Dockerfile.prod
```

### Heroku (Paid)

**Note:** Heroku removed free tier, now $5-7/month minimum

```bash
heroku create trainer3-backend
heroku addons:create heroku-postgresql:mini
heroku stack:set container
git push heroku main
```

### Self-Hosted (VPS)

Deploy to DigitalOcean, AWS, GCP, or Azure:

```bash
# On your server
git clone <repo>
cd trainer3
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Environment Variables

### Required for Production

```env
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Database (auto-provided by Render)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Security (generate random strings)
JWT_SECRET=<64-char-random-string>
SESSION_SECRET=<64-char-random-string>

# URLs
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com
```

### Optional

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback

# Features
ENABLE_AUDIT_MODE=true
NODE_ENV=production
```

## 📊 Monitoring

### Render Dashboard

- View logs: `Services → trainer3-backend → Logs`
- Check metrics: CPU, memory, request rate
- View deployments: History and status

### Health Checks

```bash
# Backend health
curl https://trainer3-backend.onrender.com/health

# Frontend health
curl https://trainer3-frontend.onrender.com/health
```

### Database Access

```bash
# Connect to production DB (from Render dashboard)
Databases → trainer3-db → Connect

# Or use connection string
psql <DATABASE_URL>
```

## 🐛 Troubleshooting

### Build Fails

```bash
# Check build logs in Render dashboard
# Common issues:
- Missing environment variables
- Dockerfile path incorrect
- Prisma migration fails
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set correctly
# Should be "Internal Database URL" from Render
# Format: postgresql://user:pass@internal-host:5432/db
```

### CORS Errors

Update backend environment:
```env
FRONTEND_URL=https://your-actual-frontend-url.onrender.com
```

### Free Tier Limitations

Render free tier:
- Services spin down after 15 min of inactivity
- First request after spin-down takes ~30 seconds
- 750 hours/month (enough for 1 service 24/7)

**Solution:** Upgrade to Starter plan ($7/month) for always-on

## 🔄 Updating Production

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render auto-deploys in ~2-5 minutes
# Check deployment status in Render dashboard
```

## 📈 Scaling

### Free Tier → Starter Plan

When you outgrow free tier:

1. Upgrade Backend: Free → Starter ($7/month)
   - Always-on (no spin-down)
   - 512 MB RAM
   - Better CPU

2. Upgrade Database: Free → Starter ($7/month)
   - 256 MB RAM → 1 GB RAM
   - 1 GB storage → 10 GB storage

3. Upgrade Frontend: Free → Starter ($7/month)
   - Better performance
   - CDN caching

**Total:** ~$21/month for production-grade hosting

### High Traffic

For 1000+ users:

1. Upgrade to Pro plans ($25-85/month)
2. Add Redis for caching
3. Enable auto-scaling
4. Use CDN (Cloudflare free tier)
5. Optimize database queries

## 🎯 Production Checklist

Before going live:

- [ ] Set all environment variables
- [ ] Test user registration
- [ ] Test AI chat functionality
- [ ] Test weight logging and approvals
- [ ] Verify database migrations ran
- [ ] Check HTTPS is enabled (auto on Render)
- [ ] Test Google OAuth callback URL
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure custom domain (optional)
- [ ] Enable auto-deploy from main branch
- [ ] Document any secrets in password manager

## 🌐 Custom Domain

Point your domain to Render:

1. **In Render:**
   - Settings → Custom Domain
   - Add: `app.yourdomain.com`

2. **In DNS Provider:**
   - Add CNAME: `app` → `trainer3-frontend.onrender.com`

3. **SSL:** Auto-provisioned by Render (Let's Encrypt)

---

**Questions?** Check Render docs: https://render.com/docs
