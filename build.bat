@echo off
echo === Building Landslide RiskGuard AI ===

echo Step 1: Building frontend...
cd frontend
call npm install
call npm run build
cd ..

echo Step 2: Copying frontend build to backend...
if not exist "backend\frontend" mkdir backend\frontend
xcopy /E /I /Y frontend\dist backend\frontend\dist

echo Step 3: Backend ready for deployment
echo === Build complete ===
echo.
echo To deploy locally:
echo   cd backend ^&^& python -m uvicorn app.main:app --reload --port 8000
echo.
echo To deploy to Render:
echo   1. Push this repo to GitHub
echo   2. Go to render.com - New - Web Service
echo   3. Set build command: cd backend ^&^& pip install -r requirements.txt
echo   4. Set start command: cd backend ^&^& python seed.py 2^>nul ^&^& uvicorn app.main:app --host 0.0.0.0 --port %%PORT%%
