# Deploying the La Foi backend to Render

This is the Django/DRF dashboard backend. The frontend is already deployed
elsewhere — this guide is backend-only.

## 1. Push the backend to GitHub

The `.gitignore` at the repo root previously excluded the entire `backend/`
folder. That has been corrected — only secrets, caches, and build artifacts
are now ignored. From the repo root:

```
git add -A
git status        # confirm backend/ files are staged, .env is NOT
git commit -m "Prepare backend for Render deployment"
git push origin main
```

## 2. Create the Render Web Service

In the Render dashboard:

1. **New +** → **Web Service**.
2. Connect the GitHub repo (`Mutombe/lafoi`).
3. Fill in:

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| Name              | `lafoi-backend` (or whatever)                |
| Region            | Frankfurt or Oregon (closest to Neon DB)     |
| Branch            | `main`                                       |
| **Root Directory**| `backend`                                    |
| Runtime           | Python 3                                     |
| **Build Command** | `./build.sh`                                 |
| **Start Command** | `gunicorn lafoi_dashboard.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120` |
| Plan              | Starter ($7/mo) — Free sleeps after 15 min   |
| Health Check Path | `/healthz`                                   |

## 3. Environment variables

Add these on the Render service's **Environment** tab. Mark `SECRET_KEY`,
`DATABASE_URL`, and any encryption keys as **Secret**.

| Key                       | Example                                              | Notes |
| ------------------------- | ---------------------------------------------------- | ----- |
| `SECRET_KEY`              | `<generate a fresh 50-char random string>`           | Never reuse the dev one. Use Render's "Generate" button. |
| `DEBUG`                   | `False`                                              | Must be `False` in prod. |
| `ALLOWED_HOSTS`           | `lafoi-backend.onrender.com`                         | Render's external host is appended automatically too, but list any custom domain. |
| `DATABASE_URL`            | `postgresql://USER:PASS@HOST/DB?sslmode=require`     | Your Neon Postgres connection string. |
| `CORS_ALLOWED_ORIGINS`    | `https://lafoidesigns.co.zw,https://www.lafoidesigns.co.zw` | The deployed frontend origin(s). Comma-separated, no trailing slash. |
| `CSRF_TRUSTED_ORIGINS`    | `https://lafoidesigns.co.zw,https://www.lafoidesigns.co.zw` | Same as above. Must include the scheme. |
| `COMPANY_NAME`            | `La Foi Designs`                                     | Used in PDF generators. |
| `COMPANY_TAGLINE`         | `Stretch Ceilings and Lighting`                      |       |
| `COMPANY_ADDRESS`         | `Suite 26, 6 Chelmsford Rd, Belgravia, Harare`       |       |
| `COMPANY_PHONE_PRIMARY`   | `+263 782 931 472`                                   |       |
| `COMPANY_PHONE_SECONDARY` | `+263 712 326 951`                                   |       |
| `COMPANY_EMAIL`           | `admin@lafoidesigns.co.zw`                           |       |
| `COMPANY_WEBSITE`         | `https://lafoidesigns.co.zw`                         |       |
| `SECURE_SSL_REDIRECT`     | `True`                                               | Default. Set `False` only for debugging. |
| `SECURE_HSTS_SECONDS`     | `31536000`                                           | 1 year. Lower while testing if needed. |

Render also auto-injects `RENDER_EXTERNAL_HOSTNAME` — `settings.py` reads
that and adds it to `ALLOWED_HOSTS` automatically, so the service is
reachable on first deploy without extra config.

## 4. After first deploy

1. Hit `https://<your-service>.onrender.com/healthz` — expect `{"status":"ok"}`.
2. Hit `https://<your-service>.onrender.com/admin/` — Django admin login screen.
3. Create a superuser:
   - Render dashboard → service → **Shell** tab.
   - `python manage.py createsuperuser`.
4. Update the **frontend** environment variable `VITE_API_BASE` to
   `https://<your-service>.onrender.com/api` and redeploy the frontend.

## 5. Continuous deployment

Render watches the connected branch and auto-deploys on every push to
`main`. Each push triggers `build.sh` (pip install + collectstatic +
migrate) followed by gunicorn restart. No manual steps after this point.

## 6. Optional — pre-merge tests

`.github/workflows/backend-ci.yml` runs `manage.py check` and the test
suite on every PR that touches `backend/**`. Fix failures before merging.

## 7. Things to monitor

- **Cold starts**: Free plan sleeps after 15 minutes of no traffic. Starter ($7/mo) does not.
- **Database connections**: Neon's free tier has connection limits. `CONN_MAX_AGE=60` reuses connections; raise workers cautiously.
- **Static files**: WhiteNoise serves `staticfiles/` with manifest hashing. Don't put media uploads there — `media/` lives on Render's local disk and is wiped on redeploy. For persistent uploads, attach a Render Disk or move to S3/R2.
- **Audit log**: every state change to tracked models writes a row. Watch DB size grow.
