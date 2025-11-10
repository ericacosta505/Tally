# 🚀 Deployment Guide for Render

This guide will help you deploy the Budget Tracker application to Render.

## Prerequisites

- A GitHub account with this repository
- A Render account (sign up at https://render.com)

## Overview

The application consists of three services on Render:
1. **PostgreSQL Database** - Persistent data storage
2. **Backend API** (Flask) - REST API server
3. **Frontend** (React) - Static site

## Step-by-Step Deployment

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create all services

3. **Configure Environment Variables**:
   After the services are created, you'll need to set:
   - **Backend Service**: `FRONTEND_URL` → Your frontend URL (e.g., `https://budget-tracker-frontend.onrender.com`)
   - **Frontend Service**: `REACT_APP_API_URL` → Your backend URL (e.g., `https://budget-tracker-backend.onrender.com`)

4. **Deploy**:
   - Render will automatically deploy all services
   - Wait for all services to be "Live"

### Option 2: Manual Setup

#### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `budget-tracker-db`
   - **Database**: `budget_tracker`
   - **User**: `budget_tracker_user`
   - **Plan**: Starter (Free tier available)
4. Click "Create Database"
5. **Copy the Internal Database URL** (you'll need this for the backend)

#### Step 2: Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `budget-tracker-backend`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
4. **Environment Variables**:
   - `DATABASE_URL`: (Auto-filled from PostgreSQL service)
   - `SECRET_KEY`: Generate a secure key (see below)
   - `FLASK_ENV`: `production`
   - `FRONTEND_URL`: Your frontend URL (set after frontend is deployed)
   - `PORT`: (Auto-set by Render)
5. Click "Create Web Service"

#### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `budget-tracker-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. **Environment Variables**:
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://budget-tracker-backend.onrender.com/api`)
5. Click "Create Static Site"

#### Step 4: Link Services

1. Go to your **Backend** service settings
2. Update `FRONTEND_URL` to your frontend URL
3. Go to your **Frontend** service settings
4. Update `REACT_APP_API_URL` to your backend URL (include `/api` at the end)
5. Redeploy both services

## Generating a Secure Secret Key

For the `SECRET_KEY` environment variable, generate a secure random string:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Or use an online generator: https://randomkeygen.com/

## Environment Variables Reference

### Backend Service

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | Auto-set by Render |
| `SECRET_KEY` | JWT signing key | Yes | Generated secure string |
| `FLASK_ENV` | Flask environment | Yes | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | `https://budget-tracker-frontend.onrender.com` |
| `PORT` | Server port | No | Auto-set by Render |

### Frontend Service

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | Yes | `https://budget-tracker-backend.onrender.com/api` |

## Post-Deployment Checklist

- [ ] All services are "Live" on Render
- [ ] Backend `FRONTEND_URL` is set correctly
- [ ] Frontend `REACT_APP_API_URL` is set correctly
- [ ] Test the frontend URL in a browser
- [ ] Test user signup/login
- [ ] Test creating budget entries
- [ ] Verify database persistence (restart service and check data)

## Troubleshooting

### Backend won't start
- Check build logs for dependency installation errors
- Verify `DATABASE_URL` is set correctly
- Ensure `SECRET_KEY` is set
- Check that gunicorn is in requirements.txt

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check that PostgreSQL service is running
- Ensure database name matches in connection string

### CORS errors
- Verify `FRONTEND_URL` is set correctly in backend
- Check that frontend URL matches exactly (including https://)
- Clear browser cache and try again

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is set correctly
- Ensure backend URL includes `/api` at the end
- Check that backend service is running
- Verify CORS configuration

### Data not persisting
- Verify PostgreSQL database is connected (not SQLite)
- Check database logs for connection issues
- Ensure `DATABASE_URL` is set correctly

## Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions
5. Update environment variables with new domain

## Monitoring

- View logs in the Render dashboard
- Set up alerts for service failures
- Monitor database usage and performance

## Cost Considerations

- **Free Tier**: Available for all services (with limitations)
- **Starter Plan**: $7/month per service (recommended for production)
- Database: Free tier available, or $7/month for starter

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Render Support: support@render.com

