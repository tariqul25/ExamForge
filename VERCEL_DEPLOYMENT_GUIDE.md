# PrepLens — Vercel Deployment & Setup Guide

This guide explains how to deploy **PrepLens** to [Vercel](https://vercel.com/) in 2 minutes.

---

### Step 1: Push Project to GitHub / GitLab / Bitbucket
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "feat: complete PrepLens with Auth, Topic generator, and Vercel readiness"
git push origin main
```

---

### Step 2: Import into Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and click **Import** next to `preplens`.
3. Framework Preset: **Next.js** (auto-detected).
4. Root Directory: `./` (default).

---

### Step 3: Configure Environment Variables in Vercel
In the **Environment Variables** section on Vercel, add:

| Key | Value | Notes |
|---|---|---|
| `GEMINI_API_KEY` | `your_gemini_api_key` | Free key from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `MONGODB_URI` | `mongodb+srv://...` | Free 512MB M0 cluster from [MongoDB Atlas](https://cloud.mongodb.com/) |

> **Note on Zero Configuration:** If you don't add MongoDB or Gemini keys right away, PrepLens will still deploy and run smoothly in **Smart Interactive Demo Mode** using its local memory store and built-in academic generators!

---

### Step 4: Click Deploy!
- Click **Deploy**.
- Vercel will build the Next.js app in ~1-2 minutes.
- Your application will be live at `https://preplens.vercel.app` (or your custom assigned Vercel URL).

---

### Admin Credentials for Settings Access
- **Admin Email:** `admin@preplens.com`
- **Admin Password:** `admin123`
- **Instant Admin Passcode:** `admin123` (used on the `/settings` page to unlock the Connection & Platform Settings panel).
