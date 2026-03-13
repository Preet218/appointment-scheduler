# Appointment Scheduler — Render Deployment Guide

## What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | The full frontend app |
| `server.js` | Node.js/Express backend — serves the app + `/api/appointments` |
| `package.json` | Node dependencies |
| `render.yaml` | Render deployment config (auto-detected) |
| `.gitignore` | Excludes node_modules and local data |

---

## Step 1 — Install Node.js locally (one-time)

Download and install from https://nodejs.org (choose the LTS version).

Test it worked:
```
node -v
npm -v
```

---

## Step 2 — Test locally before deploying

Open a terminal in this folder and run:

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.
You should see the Appointment Desk app working fully.
Press Ctrl+C to stop.

---

## Step 3 — Push to GitHub

Render deploys directly from GitHub. You need a free GitHub account.

### If you've never used Git before:

1. Download GitHub Desktop from https://desktop.github.com
2. Open GitHub Desktop → File → New Repository
   - Name: `appointment-scheduler`
   - Local path: choose the folder containing these files
   - Click **Create Repository**
3. Click **Publish repository** (top bar)
   - Make sure "Keep this code private" is checked if you want it private
   - Click **Publish Repository**

### If you're comfortable with Git:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create appointment-scheduler --private --source=. --push
```

---

## Step 4 — Deploy on Render

1. Go to https://render.com and sign up (free, no credit card needed)

2. Click **New +** → **Web Service**

3. Connect your GitHub account when prompted, then select the
   `appointment-scheduler` repository

4. Render will auto-detect `render.yaml` and fill in most settings.
   Confirm these values:
   - **Name**: appointment-scheduler (or anything you like)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free

5. Click **Create Web Service**

6. Render will build and deploy — takes about 2 minutes.
   You'll see a URL like: `https://appointment-scheduler.onrender.com`

That URL is shareable with anyone. Bookmark it.

---

## Step 5 — Add a Persistent Disk (important — don't skip)

By default the free tier loses data on every restart (spin-down).
The `render.yaml` file requests a disk automatically, but verify it:

1. In your Render dashboard, click your service
2. Go to **Disks** in the left menu
3. You should see a disk named `appointments-data` mounted at `/data`
4. If it's missing, click **Add Disk**:
   - Name: `appointments-data`
   - Mount Path: `/data`
   - Size: 1 GB
   - Click **Save**

This ensures appointment data survives restarts. ✓

---

## Free tier behaviour to know

| Thing | What happens |
|-------|-------------|
| No traffic for 15 min | Service sleeps — first visit takes ~1 min to wake up |
| 750 hours/month compute | Enough for one service running all month |
| 100 GB bandwidth/month | Your app will use < 1 GB |
| Cost | $0 |

---

## Updating the app later

Any time you make changes to `index.html` or `server.js`:

1. Save your files
2. In GitHub Desktop: write a summary → click **Commit** → click **Push**
3. Render auto-detects the push and re-deploys in ~1 minute

---

## Local data file location

When running locally, appointments are saved to `data/appointments.json`
in this folder. On Render, they live at `/data/appointments.json` on the
persistent disk.
