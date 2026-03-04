# Mission Control - Deployment Guide

## ✅ Production Setup Complete

Mission Control is now configured as a **systemd service** that:
- ✅ Starts automatically on server boot
- ✅ Restarts automatically if it crashes
- ✅ Always available when you need it
- ✅ Managed by the system (no manual intervention needed)

---

## 🚀 Service Management

### Check Status
```bash
sudo systemctl status mission-control
```

### Start Service
```bash
sudo systemctl start mission-control
```

### Stop Service
```bash
sudo systemctl stop mission-control
```

### Restart Service
```bash
sudo systemctl restart mission-control
```

### View Logs (Live)
```bash
sudo journalctl -u mission-control -f
```

### View Recent Logs
```bash
sudo journalctl -u mission-control --since "10 minutes ago"
```

---

## 🌐 Access URLs

- **Frontend:** http://140.82.57.157:5173
- **Backend API:** http://140.82.57.157:3001
- **Health Check:** http://140.82.57.157:3001/health

**Credentials:**
- Admin: `iqbal` / `test123`
- Viewer: `basicjo` / `test123`

---

## 🔧 Service Configuration

**Location:** `/etc/systemd/system/mission-control.service`

```ini
[Unit]
Description=Mission Control Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/mission-control
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Features:**
- `Restart=always` - Auto-restart on crash
- `RestartSec=10` - Wait 10s before restarting
- `After=network.target` - Start after network is ready
- Logs to system journal (viewable with `journalctl`)

---

## 🔄 After Code Changes

When you update Mission Control code:

```bash
cd ~/mission-control
git pull  # Or make your changes
sudo systemctl restart mission-control
```

Wait ~10 seconds, then check:
```bash
curl http://140.82.57.157:3001/health
```

---

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs for errors
sudo journalctl -u mission-control -n 50

# Check if ports are already in use
sudo ss -tlnp | grep -E ':(3001|5173)'

# Check service status
sudo systemctl status mission-control
```

### Service Keeps Restarting
```bash
# Watch logs in real-time
sudo journalctl -u mission-control -f

# Common issues:
# - Port already in use (kill other process)
# - Missing dependencies (run: cd ~/mission-control && npm install)
# - Database locked (restart service)
```

### Can't Access from Browser
```bash
# Verify services are running
curl http://127.0.0.1:5173
curl http://127.0.0.1:3001/health

# Check firewall
sudo ufw status | grep -E '(3001|5173)'

# If firewall blocks:
sudo ufw allow 5173/tcp comment 'Mission Control Frontend'
sudo ufw allow 3001/tcp comment 'Mission Control Backend'
```

---

## 🔒 Security Notes

**Current Setup:**
- ✅ JWT authentication enabled
- ✅ Password-protected agent sync
- ⚠️ HTTP only (no HTTPS yet)
- ⚠️ Running as root (consider dedicated user)

**To Add HTTPS (Recommended for Production):**

1. Install certbot:
```bash
sudo apt install certbot
```

2. Get SSL certificate (requires domain):
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Configure nginx reverse proxy:
```bash
sudo apt install nginx
# Create nginx config for Mission Control
# Point to SSL certificates
```

---

## 📊 Monitoring

### Quick Health Check
```bash
# One-liner to check if everything is OK
curl -s http://127.0.0.1:3001/health | jq .
```

### Service Uptime
```bash
sudo systemctl status mission-control | grep Active
```

### Memory Usage
```bash
sudo systemctl status mission-control | grep Memory
```

### Process Tree
```bash
ps aux | grep mission-control
```

---

## 🔄 Backup & Restore

### Backup Database
```bash
# Database location
cp ~/.mission-control/data/mc.db ~/backups/mc-$(date +%Y%m%d).db

# With compression
tar -czf ~/backups/mc-$(date +%Y%m%d).tar.gz ~/.mission-control/
```

### Restore Database
```bash
# Stop service
sudo systemctl stop mission-control

# Restore backup
cp ~/backups/mc-20260304.db ~/.mission-control/data/mc.db

# Start service
sudo systemctl start mission-control
```

---

## 🚨 Emergency Commands

### Kill All Mission Control Processes
```bash
sudo systemctl stop mission-control
pkill -f "mission-control"
```

### Reset Service (Full Restart)
```bash
sudo systemctl stop mission-control
sleep 3
sudo systemctl start mission-control
sudo systemctl status mission-control
```

### Disable Auto-Start (Temporary)
```bash
sudo systemctl disable mission-control
sudo systemctl stop mission-control
```

### Re-Enable Auto-Start
```bash
sudo systemctl enable mission-control
sudo systemctl start mission-control
```

---

## 📝 Maintenance Schedule

**Weekly:**
- Check logs for errors: `sudo journalctl -u mission-control --since "1 week ago" | grep -i error`
- Verify health endpoint: `curl http://140.82.57.157:3001/health`

**Monthly:**
- Backup database: `cp ~/.mission-control/data/mc.db ~/backups/mc-$(date +%Y%m%d).db`
- Update dependencies: `cd ~/mission-control && npm update`
- Restart service: `sudo systemctl restart mission-control`

**As Needed:**
- After code changes: restart service
- After server reboot: verify service started
- After firewall changes: test access

---

## ✅ Verification Checklist

Run this to verify everything is working:

```bash
echo "=== Mission Control Health Check ==="
echo ""
echo "1. Service Status:"
sudo systemctl is-active mission-control
echo ""
echo "2. Backend Health:"
curl -s http://127.0.0.1:3001/health | jq .
echo ""
echo "3. Frontend Accessible:"
curl -s http://127.0.0.1:5173 | head -2 | tail -1
echo ""
echo "4. Ports Listening:"
sudo ss -tlnp | grep -E ':(3001|5173)'
echo ""
echo "5. Service Uptime:"
sudo systemctl status mission-control | grep Active
echo ""
echo "=== All Checks Complete ==="
```

Expected output:
```
=== Mission Control Health Check ===

1. Service Status:
active

2. Backend Health:
{
  "status": "ok",
  "timestamp": "2026-03-04T06:18:49.615Z"
}

3. Frontend Accessible:
<html lang="en" class="dark">

4. Ports Listening:
LISTEN 0      511          0.0.0.0:3001       0.0.0.0:*
LISTEN 0      511          0.0.0.0:5173       0.0.0.0:*

5. Service Uptime:
Active: active (running) since Wed 2026-03-04 06:18:37 UTC

=== All Checks Complete ===
```

---

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Check if running | `sudo systemctl status mission-control` |
| Restart service | `sudo systemctl restart mission-control` |
| View logs | `sudo journalctl -u mission-control -f` |
| Check health | `curl http://127.0.0.1:3001/health` |
| Stop service | `sudo systemctl stop mission-control` |
| Start service | `sudo systemctl start mission-control` |

---

**Last Updated:** 2026-03-04  
**Service Status:** ✅ Active and enabled  
**Auto-Start:** ✅ Enabled on boot  
**Location:** `/root/mission-control/`
