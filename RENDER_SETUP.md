# Quick Render Setup Guide

## Quick Start

1. **Push to GitHub** (if not already done)
2. **Go to Render Dashboard** → New → Blueprint
3. **Connect your GitHub repo**
4. **Render will auto-detect `render.yaml`** and create all services
5. **After deployment, set these environment variables:**

### Backend Service
- `FRONTEND_URL`: `https://your-frontend-name.onrender.com`

### Frontend Service  
- `REACT_APP_API_URL`: `https://your-backend-name.onrender.com/api`

6. **Redeploy both services** after setting environment variables

## What Changed

✅ **PostgreSQL Support**: Backend now uses PostgreSQL in production (SQLite for local dev)
✅ **Environment Variables**: Database URL, CORS origins, and secrets configured via env vars
✅ **Production Ready**: Gunicorn server, proper port binding, production settings
✅ **Render Configuration**: `render.yaml` file for one-click deployment

## Local Development

The app still works locally with SQLite - no changes needed! Just:
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt  # Now includes psycopg2-binary and gunicorn
python app.py
```

For local PostgreSQL development, set `DATABASE_URL` environment variable:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/budget_tracker"
```

## Environment Variables Reference

### Backend
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Render)
- `SECRET_KEY` - JWT signing key (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `FLASK_ENV` - Set to `production` on Render
- `FRONTEND_URL` - Your frontend URL for CORS
- `PORT` - Server port (auto-set by Render)

### Frontend
- `REACT_APP_API_URL` - Backend API URL (e.g., `https://backend.onrender.com/api`)

See `DEPLOYMENT.md` for detailed instructions.

