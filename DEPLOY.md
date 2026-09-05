# Deployment Guide — Landslide RiskGuard AI

## Quick Deploy (3 steps)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Name: `landslide-riskguard-ai`
3. Create repository (public or private)

### Step 2: Push Code to GitHub

```bash
cd "C:\Users\sugav\OneDrive\Documents\Landslide RiskGaurd AI"
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/landslide-riskguard-ai.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy (Free Tier)

**Backend (Render):**
1. Go to https://render.com → Sign up with GitHub
2. New → Web Service → Connect your repo → `backend` folder
3. Settings:
   - Name: `riskguard-api`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `sh -c "python seed.py 2>/dev/null; uvicorn app.main:app --host 0.0.0.0 --port $PORT"`
4. Add Environment Variable:
   - `DATABASE_URL` = your Neon/Supabase PostgreSQL URL
   - `JWT_SECRET_KEY` = any random string
5. Deploy → Wait → Copy the URL (e.g. `https://riskguard-api.onrender.com`)

**Database (Neon — Free):**
1. Go to https://neon.tech → Sign up with GitHub
2. Create Project → Copy the connection string
3. Use it as `DATABASE_URL` in Render

**Frontend (Vercel):**
1. Go to https://vercel.com → Sign up with GitHub
2. New Project → Import your repo → `frontend` folder
3. Add Environment Variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://riskguard-api.onrender.com`)
4. Deploy → Done!

## Environment Variables

| Service | Variable | Value |
|---------|----------|-------|
| Backend (Render) | `DATABASE_URL` | `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.db/landslide_riskguard` |
| Backend (Render) | `JWT_SECRET_KEY` | Any random 32+ char string |
| Frontend (Vercel) | `VITE_API_URL` | `https://riskguard-api.onrender.com` |

## Cost

All services have free tiers:
- **Vercel**: Free for personal projects
- **Render**: 750 hrs/month free (spins down after inactivity)
- **Neon**: 0.5 GB storage free

## Post-Deploy

After deployment, the backend automatically:
1. Creates all database tables
2. Seeds 16 NER zones with data
3. Generates initial alerts
4. Starts background risk scoring (every 2 min)
