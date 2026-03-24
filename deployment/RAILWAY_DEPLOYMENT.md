# 🚀 Railway Deployment Guide

Complete step-by-step guide to deploy the Tic-Tac-Toe game on Railway.

## Overview

Railway is a modern cloud platform perfect for deploying full-stack applications. This guide covers deploying both the Nakama backend and React frontend.

**Estimated costs:**

- PostgreSQL: ~$5-10/month
- Nakama service: ~$5-10/month
- Frontend service: ~$5/month
- **Total: ~$15-25/month**

## Prerequisites

- GitHub account with the repository
- Railway account (free tier available)
- Git installed locally

## Part 1: Create Railway Account & Project

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click **"Sign Up"**
3. Choose **"GitHub"** authentication
4. Authorize Railway to access your GitHub

### Step 2: Create New Project

1. Click **"New Project"** in Railway dashboard
2. Select **"GitHub Repo"**
3. Select your repository URL
4. Click **"Deploy Now"**

---

## Part 2: Configure PostgreSQL Database

### Step 1: Add PostgreSQL Service

1. In your Railway project, click **"+ Add Service"**
2. Select **"PostgreSQL"**
3. Click **"Create"**

### Step 2: Configure Database Variables

The database URL gets auto-generated. Copy these environment variables:

1. Click PostgreSQL service
2. Go to **"Variables"** tab
3. You'll see auto-generated variables like:
   - `DATABASE_URL` - Connection string (Railway generates this)
   - `PGPASSWORD` - Database password

### Step 3: Set Custom Password

1. Click **"New Variable"**
2. Add: `POSTGRES_PASSWORD=V4DcYueybCnV`
3. Click **"Add"**

---

## Part 3: Deploy Nakama Backend

### Step 1: Create Dockerfile for Railway

Railway needs a Dockerfile for the Nakama service. Create `nakama/Dockerfile`:

```dockerfile
# Stage 1: Build modules
FROM node:20-alpine AS builder

WORKDIR /app/modules

COPY data/modules/package*.json ./
RUN npm ci

COPY data/modules/src ./src
COPY data/modules/tsconfig.json ./
COPY data/modules/scripts ./scripts

RUN npm run build

# Stage 2: Nakama runtime
FROM heroiclabs/nakama:3.21.1

# Copy built modules
COPY --from=builder /app/modules/build /nakama/data/modules/build

# Copy config file
COPY data/nakama-config.yml /nakama/data/nakama-config.yml

EXPOSE 7349 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", \
  "/nakama/nakama migrate up --database.address postgres:$POSTGRES_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/nakama && \
  exec /nakama/nakama --config /nakama/data/nakama-config.yml --database.address postgres:$POSTGRES_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/nakama"]
```

### Step 2: Add Nakama Service to Railway

1. In Railway project, click **"+ Add Service"**
2. Select **"GitHub Repo"**
3. Select your repo
4. Select the **`nakama/` directory** as root directory
5. Click **"Deploy"**

### Step 3: Configure Nakama Environment Variables

1. Click Nakama service → **"Variables"** tab
2. Add these variables:

```env
POSTGRES_PASSWORD=V4DcYueybCnV
DATABASE_HOST=postgres.railway.internal
DATABASE_PORT=5432
NAKAMA_CONSOLE_USERNAME=admin
NAKAMA_CONSOLE_PASSWORD=<your-secure-password>
```

3. For `RAILWAY_PRIVATE_DOMAIN`, Railway auto-generates this - copy it from the service details
4. Set **PORT=7350** (Railway's default)

### Step 4: Configure Port Mapping

1. Click Nakama service → **"Networking"** tab
2. Enable **"Public Networking"**
3. It will show a public URL like: `nakama-prod.railway.app`
4. Copy this URL for later

---

## Part 4: Deploy React Frontend

### Step 1: Create Frontend Dockerfile

Railway needs frontend Dockerfile. Create `frontend/Dockerfile` (should already exist):

```dockerfile
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Set environment variables from build args
ARG VITE_NAKAMA_HOST
ARG VITE_NAKAMA_PORT
ARG VITE_NAKAMA_SSL

ENV VITE_NAKAMA_HOST=${VITE_NAKAMA_HOST:-localhost}
ENV VITE_NAKAMA_PORT=${VITE_NAKAMA_PORT:-7350}
ENV VITE_NAKAMA_SSL=${VITE_NAKAMA_SSL:-false}

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Add Frontend Service to Railway

1. Click **"+ Add Service"** in Railway
2. Select **"GitHub Repo"**
3. Select your repo
4. Select **`frontend/` directory**
5. Click **"Deploy"**

### Step 3: Configure Frontend Variables

1. Click Frontend service → **"Variables"** tab
2. Replace `localhost` with your Nakama public domain:

```env
VITE_NAKAMA_HOST=nakama-prod.railway.app
VITE_NAKAMA_PORT=443
VITE_NAKAMA_SSL=true
```

3. Set **PORT=80** (default)

### Step 4: Enable Public URL

1. Click Frontend service → **"Networking"** tab
2. Enable **"Public Networking"**
3. Copy the generated URL (e.g., `frontend-prod.railway.app`)

---

## Part 5: Database Connection Setup

### Step 1: Verify PostgreSQL is Running

1. Click PostgreSQL service
2. Ensure status shows **"Running"**

### Step 2: Link Services

1. For Nakama service, go to **"Variables"**
2. Click **"Railway PostgreSQL"** reference
3. This auto-links the database connection

### Step 3: Test Connection

Run database migrations from Nakama logs:

1. Click Nakama service → **"Deployments"** tab
2. Check logs for: ✅ `migrate up` completed successfully

---

## Part 6: Configure Domain (Optional)

### Step 1: Use Railway Domains (Easiest)

Railway provides free domains:

- Nakama: `nakama-prod.railway.app`
- Frontend: `frontend-prod.railway.app`

Your frontend in `.env` should use Railway domain:

```env
VITE_NAKAMA_HOST=nakama-prod.railway.app
VITE_NAKAMA_PORT=443
VITE_NAKAMA_SSL=true
```

### Step 2: Custom Domain (Optional)

If you want a custom domain:

1. **Frontend custom domain:**
   - Go to Frontend service → Settings
   - Click "Add custom domain"
   - Enter your domain (e.g., `game.yourdomain.com`)
   - Add DNS CNAME record pointing to Railway

2. **Nakama custom domain:**
   - Go to Nakama service → Settings
   - Click "Add custom domain"
   - Enter your domain (e.g., `api.yourdomain.com`)
   - Add DNS CNAME record

---

## Part 7: Verify Deployment

### Step 1: Check Service Status

1. Go to Railway dashboard
2. All services should show **"Running"** status
3. Green checkmarks on all services

### Step 2: Test Frontend

1. Open your frontend URL in browser
2. Should load the Tic-Tac-Toe game
3. Test entering a nickname
4. Try to matchmake

### Step 3: Test Nakama API

```bash
# Test Nakama health
curl https://nakama-prod.railway.app/

# Should return: HTTP 200 (or 400 if no path)

# Test console access
# https://nakama-prod.railway.app:7351
# Username: admin
# Password: <your-password>
```

### Step 4: Test Multiplayer

1. Open frontend in two browsers/tabs
2. Enter different nicknames
3. Both select "Classic" mode
4. Click "Find Match"
5. Game should start when both connected

---

## Part 8: Monitor Your Deployment

### View Logs

1. Click any service
2. Go to **"Deployments"** tab
3. Click on deployment → "View Logs"

### Key logs to check:

- Nakama: `Startup done` - indicates server is ready
- Frontend: Build success messages
- Errors: Database connection, module loading

### Monitor Performance

1. Go to service details
2. **"Metrics"** tab shows:
   - CPU usage
   - Memory usage
   - Requests/second
   - Response times

---

## Part 9: Environment Variables Summary

### Nakama Service Variables

```env
# Database
POSTGRES_PASSWORD=V4DcYueybCnV
DATABASE_HOST=postgres.railway.internal
DATABASE_PORT=5432

# Nakama Console
NAKAMA_CONSOLE_USERNAME=admin
NAKAMA_CONSOLE_PASSWORD=secure_password_here

# Port
PORT=7350
```

### Frontend Service Variables

```env
# Nakama Connection
VITE_NAKAMA_HOST=nakama-prod.railway.app
VITE_NAKAMA_PORT=443
VITE_NAKAMA_SSL=true

# Port
PORT=80
```

### PostgreSQL Variables

```env
POSTGRES_PASSWORD=V4DcYueybCnV
POSTGRES_DB=nakama
POSTGRES_USER=postgres
```

---

## Troubleshooting

### Issue: "Cannot connect to Nakama"

**Solution:**

1. Check Nakama service status in Railway dashboard
2. Verify `VITE_NAKAMA_HOST` in frontend matches Railway domain
3. Ensure `VITE_NAKAMA_SSL=true` (Railway uses HTTPS)
4. Check browser console for CORS errors

### Issue: "Database connection failed"

**Solution:**

1. Verify `DATABASE_HOST=postgres.railway.internal`
2. Check `POSTGRES_PASSWORD` matches in both services
3. View Nakama logs for connection errors
4. Restart PostgreSQL service

### Issue: "Build failed"

**Solution:**

1. View deployment logs
2. Check Node.js version requirement (18+)
3. Verify `package.json` exists in service root
4. Try manual rebuild: Railway → Service → "Redeploy"

### Issue: "Frontend shows blank page"

**Solution:**

1. Check browser console for errors
2. Verify Nakama credentials are correct
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check if Nakama service is running

### Issue: "Leaderboard not updating"

**Solution:**

1. Verify game completes successfully
2. Check Nakama logs for errors
3. Ensure PostgreSQL is running
4. Restart Nakama service

---

## Security Considerations

### ✅ Implemented

- HTTPS/SSL on Railway domains
- Strong database password
- Environment variables for secrets
- Read-only storage permissions

### 🔒 Additional Steps for Production

1. **Change Nakama credentials:**

   ```env
   NAKAMA_CONSOLE_PASSWORD=<very-strong-password>
   ```

2. **Enable backups:**
   - PostgreSQL service → Settings → Enable automated backups

3. **Monitor logs regularly:**
   - Check for suspicious activity
   - Monitor error rates

4. **Keep dependencies updated:**
   - Node packages
   - Docker images
   - Nakama version

---

## Performance Optimization

### Database

- Railway PostgreSQL auto-scales
- Connection pooling handled by Nakama
- Regular backups included

### Frontend

- Nginx caching enabled
- Gzip compression on
- Static assets served efficiently

### Nakama

- Recommended: min 2GB RAM
- Monitor tick rate (currently 1 tick/second)
- Adjust if handling 100+ concurrent players

---

## Deployment URLs Example

After deployment, you should have:

**Frontend:** `https://frontend-prod.railway.app`

- Accessible from anywhere
- Shows Tic-Tac-Toe game

**Nakama API:** `https://nakama-prod.railway.app:7350`

- WebSocket: `wss://nakama-prod.railway.app:7350`
- Console: `https://nakama-prod.railway.app:7351`

**PostgreSQL:** Connected internally

- Not exposed to public
- Railway handles connection pooling

---

## Cost Breakdown

| Service    | Tier     | Monthly Cost |
| ---------- | -------- | ------------ |
| PostgreSQL | Standard | $5-10        |
| Nakama     | Standard | $5-10        |
| Frontend   | Starter  | $5           |
| **Total**  |          | **~$15-25**  |

_Costs may vary based on usage. Railway free tier available for testing._

---

## Next Steps

1. ✅ Deploy services on Railway
2. ✅ Verify all services running
3. ✅ Test multiplayer functionality
4. ✅ Update README with live URLs
5. ✅ Monitor performance in first week
6. ✅ Set up backups if using paid tier

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Nakama Docs:** https://heroiclabs.com/docs
- **Railway Discord:** https://discord.gg/railway
- **GitHub Issues:** Check for deployment-specific issues

---

**🚀 Happy Deploying! Your game is now live on the internet!**
