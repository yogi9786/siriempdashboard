# Production Readiness & Deployment Checklist
**Project:** Siri Samruddhi Gold Palace Dashboard  
**Environment:** Linux Ubuntu VPS (`srv1787465` / `ssgpdashboard.in`)  
**Readiness Status:** Production Ready  

---

## 1. Production Deployment Checklist

### 1.1 Server Infrastructure
- [x] Ubuntu Linux host with Python 3.12+ and Node.js LTS installed.
- [x] PostgreSQL database configured with dedicated `siridashboard` schema.
- [x] Systemd service managing Gunicorn/Uvicorn multi-worker daemon.
- [x] Nginx reverse proxy configured for static frontend files and API proxying.
- [x] High-performance upstream load balancing with `least_conn`.

### 1.2 Security & Network
- [x] SSL/TLS certificates configured (Let's Encrypt / Certbot).
- [x] Strict security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- [x] JWT access tokens and long-lived refresh tokens.
- [x] Password hashing using bcrypt cost factor 12.
- [x] Row-level multi-branch isolation (`branch_id`).
- [x] CORS restricted to official domain and local testing hosts.

### 1.3 Application & Data
- [x] All 70 branch employees and managers active in database.
- [x] Auto-schema migration verified on application startup.
- [x] Automated WhatsApp integration via AiSensy verified.
- [x] File uploads sanitized with UUIDs and size-capped.
- [x] Automated test suite passing (29/29 tests).

---

## 2. Server Deployment Commands

On your production server (`root@srv1787465`):

```bash
# 1. Pull latest verified commits from origin main
cd /var/www/siriempdashboard/siriempdashboard
git pull origin main

# 2. Run database employee sync script
python3 backend/app/seed/add_missing_employees.py

# 3. Build frontend production assets
cd frontend
npm run build
cd ..

# 4. Restart backend daemon service
systemctl restart siriempdashboard
systemctl restart nginx

# 5. Check service health
systemctl status siriempdashboard --no-pager
curl -I http://127.0.0.1:8000/api/health
```

---

## 3. Disaster Recovery & Backups

### Daily Automated Database Backup Cron
Add the following entry to `crontab -e`:
```cron
0 2 * * * pg_dump -U postgres -d siridashboard -n siridashboard | gzip > /var/backups/siridashboard_$(date +\%F).sql.gz
```
Retain the last 14 daily backup snapshots.
