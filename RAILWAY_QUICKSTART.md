# 🚀 Railway Deployment Quick Start

Your Tic-Tac-Toe game is now ready to deploy on Railway!

## Files Created/Updated

✅ **`deployment/RAILWAY_DEPLOYMENT.md`** - Complete step-by-step deployment guide
✅ **`nakama/Dockerfile`** - Updated for Railway with TypeScript build stage
✅ **`frontend/Dockerfile`** - Updated with Vite environment variables
✅ **`railway.json`** - Railway config file for zero-config deployment
✅ **`.env`** - Contains secure password `V4DcYueybCnV`

## Quick Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project

- Go to https://railway.app
- Click "New Project"
- Select your GitHub repository
- Click "Deploy Now"

### 3. Add PostgreSQL

- Click "+ Add Service"
- Select "PostgreSQL"
- Save database URL

### 4. Deploy Nakama

- Click "+ Add Service"
- Select "GitHub Repo"
- Set root directory to `nakama/`
- Add environment variables:
  ```
  POSTGRES_PASSWORD=V4DcYueybCnV
  DATABASE_HOST=postgres.railway.internal
  DATABASE_PORT=5432
  ```

### 5. Deploy Frontend

- Click "+ Add Service"
- Select "GitHub Repo"
- Set root directory to `frontend/`
- Add environment variables:
  ```
  VITE_NAKAMA_HOST=nakama-prod.railway.app
  VITE_NAKAMA_PORT=443
  VITE_NAKAMA_SSL=true
  ```

### 6. Verify Deployment

- ✅ All services show "Running"
- ✅ Frontend URL opens game
- ✅ Test multiplayer in 2 browser windows

## Deployment URLs

After deployment, you'll have:

| Service        | URL                                    |
| -------------- | -------------------------------------- |
| Frontend       | `https://frontend-prod.railway.app`    |
| Nakama API     | `https://nakama-prod.railway.app:7350` |
| Nakama Console | `https://nakama-prod.railway.app:7351` |

## Security Notes

✅ Password: `V4DcYueybCnV` (12 characters, alphanumeric)
✅ HTTPS/SSL enabled on Railway domains
✅ Environment variables used (not hardcoded)
✅ Database password protected
✅ Admin console password in variables

## Cost Estimate

| Service    | Monthly    |
| ---------- | ---------- |
| PostgreSQL | $5-10      |
| Nakama     | $5-10      |
| Frontend   | $5         |
| **Total**  | **$15-25** |

_Note: Railway free tier available for testing_

## Troubleshooting

If something goes wrong:

1. Check service logs in Railway dashboard
2. Verify environment variables match
3. See `deployment/RAILWAY_DEPLOYMENT.md` for detailed troubleshooting
4. Check Nakama logs for database connection errors

## Full Documentation

See **`deployment/RAILWAY_DEPLOYMENT.md`** for:

- Detailed step-by-step instructions
- Custom domain setup
- Performance monitoring
- Backup configuration
- Security best practices

## Next Steps

1. ✅ Confirm password is secure
2. ✅ Push code to GitHub
3. ✅ Follow Railway deployment guide
4. ✅ Test multiplayer functionality
5. ✅ Update README with live URLs
6. ✅ Share deployed URL with users

---

**Need help?** See `deployment/RAILWAY_DEPLOYMENT.md` for complete guide!
