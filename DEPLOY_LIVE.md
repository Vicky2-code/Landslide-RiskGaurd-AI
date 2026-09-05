# Deploy to Live — One URL

## Prerequisites
1. GitHub account
2. Render account (free): https://render.com
3. Neon PostgreSQL (free): https://neon.tech

---

## Step 1: Create GitHub Repo

```bash
cd "C:\Users\sugav\OneDrive\Documents\Landslide RiskGaurd AI"
git init
git add .
git commit -m "Landslide RiskGuard AI"
git remote add origin https://github.com/YOUR_USERNAME/landslide-riskguard-ai.git
git branch -M main
git push -u origin main
```

## Step 2: Create Neon Database (Free)

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create project (any name)
4. Copy the connection string:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.db/landslide_riskguard?sslmode=require
   ```

## Step 3: Deploy to Render (One Service)

1. Go to https://render.com → Sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your `landslide-riskguard-ai` repo
4. Fill in:
   - **Name**: `riskguard`
   - **Region**: Oregon (or closest to India)
   - **Runtime**: Python 3
   - **Build Command**:
     ```
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```
     cd backend && sh -c "python seed.py 2>/dev/null; uvicorn app.main:app --host 0.0.0.0 --port $PORT"
     ```
5. Click **Advanced** → Add Environment Variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET_KEY` = `riskguard-live-secret-2026`
6. Click **Create Web Service**
7. Wait 5-10 minutes for first deploy

## Step 4: Done!

Your app is live at: `https://riskguard.onrender.com`

**Login:**
- Authority: `admin@riskguard.gov.in` / `admin123`
- Citizen: `citizen@riskguard.gov.in` / `citizen123`

---

## What's Included (Single URL)

| Feature | URL Path |
|---------|----------|
| Login/Register | `/login` |
| Dashboard (Map) | `/dashboard` |
| Zone Detail | `/zones/:id` |
| Citizen Report | `/report` |
| Alerts | `/alerts` |
| Notifications | `/notifications` |
| Review Queue | `/reports` (authority only) |
| Profile | `/profile` |
| API Docs | `/docs` |
| Health Check | `/api/health` |

## Cost: $0/month (all free tier)
- Render: 750 hrs/month free
- Neon: 0.5 GB free
- No domain needed (uses render subdomain)
