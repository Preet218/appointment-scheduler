# Appointment Scheduler — Deployment Guide

## Why the data was being lost

Render's **free tier does not support persistent disks**. The previous
version saved data to a local JSON file which gets wiped on every restart.

This version stores all appointments in a **free Supabase PostgreSQL
database** — data lives in the cloud separately from Render, so it
survives restarts, re-deploys, and spin-downs permanently.

---

## Architecture

```
Browser  →  Render (Node.js server, free)  →  Supabase (PostgreSQL, free)
```

Both services are free forever. Supabase's free tier gives you 500 MB of
database storage and does not expire.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Full frontend app |
| `server.js` | Express backend — serves app + REST API |
| `package.json` | Dependencies (express, pg, uuid) |
| `render.yaml` | Render deployment config |

---

## Step 1 — Create a free Supabase database

1. Go to https://supabase.com and click **Start your project** (free, no card)
2. Sign up with GitHub or email
3. Click **New Project**
   - Name: `appointment-scheduler` (or anything)
   - Set a strong database password — **save this password**, you'll need it
   - Region: pick the closest to you (e.g. South Asia)
   - Click **Create new project** (takes ~1 minute)
4. Once ready, go to **Project Settings** → **Database**
5. Scroll down to **Connection string** → select **URI** tab
6. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with the password you set in step 3
8. **Save this full string** — you'll paste it into Render in Step 3

That's it — no need to create any tables. The server creates the
`appointments` table automatically on first startup.

---

## Step 2 — Push to GitHub

If you haven't already set up GitHub:

1. Download GitHub Desktop: https://desktop.github.com
2. File → New Repository → name it `appointment-scheduler`
   - Set the local path to this folder
   - Click **Create Repository**
3. Click **Publish repository** → keep it private → **Publish Repository**

Any time you update files later: write a summary in GitHub Desktop →
**Commit** → **Push**.

---

## Step 3 — Deploy on Render

1. Go to https://render.com → sign up free (no card needed)
2. Click **New +** → **Web Service**
3. Connect your GitHub account → select `appointment-scheduler`
4. Render auto-reads `render.yaml`. Confirm:
   - Environment: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: **Free**
5. **Before clicking Create** — scroll down to **Environment Variables**
   - Click **Add Environment Variable**
   - Key: `DATABASE_URL`
   - Value: paste the Supabase connection string from Step 1
6. Click **Create Web Service**

Render will build and deploy in ~2 minutes.
Your app will be live at: `https://appointment-scheduler.onrender.com`

---

## Step 4 — Test it

1. Open your Render URL
2. Book a test appointment
3. Close the browser tab completely
4. Wait 15+ minutes (let the service sleep)
5. Re-open the URL — it will take ~1 minute to wake up
6. Your appointment should still be there ✓

---

## Free tier summary

| Service | Cost | Limit | Notes |
|---------|------|-------|-------|
| Render web service | $0 | 750 hrs/month | Sleeps after 15 min idle |
| Supabase database | $0 | 500 MB storage | Never expires, always on |

Your app will use under 1 MB of database storage for thousands of
appointments — the free tier is more than enough.

---

## Local development

```bash
# Create a .env file with your Supabase connection string
echo 'DATABASE_URL=postgresql://postgres:yourpassword@db.xxx.supabase.co:5432/postgres' > .env

npm install
node -e "require('dotenv').config()" server.js   # if you have dotenv installed
# or just set the env var directly:
DATABASE_URL="postgresql://..." npm start
```

Then open http://localhost:3000

