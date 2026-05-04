#!/usr/bin/env bash
# =====================================================================
# deploy.sh — Deploy Pilgrim's Path to Hostinger VPS
# =====================================================================
# Usage (run from your LOCAL machine, not the server):
#
#   chmod +x deploy.sh
#   ./deploy.sh YOUR_VPS_IP YOUR_SSH_USER
#
# Example:
#   ./deploy.sh 185.123.45.67 pilgrims
#
# What it does:
#   1. Rsync the codebase to /var/www/pilgrimspath on the VPS
#   2. Runs npm install --omit=dev on the server
#   3. Copies nginx.conf to /etc/nginx/sites-available/pilgrimspath
#   4. Creates the .env file from your local .env (if it exists)
#   5. Restarts the PM2 process
#   6. Reloads Nginx
#
# First-time setup (run once on the VPS by hand):
#   sudo apt update && sudo apt upgrade -y
#   sudo apt install -y nginx certbot python3-certbot-nginx
#   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
#   sudo apt install -y nodejs
#   sudo npm install -g pm2
#   sudo mkdir -p /var/www/pilgrimspath/logs
#   sudo chown -R $USER:$USER /var/www/pilgrimspath
#   # Then run this deploy script, then:
#   sudo certbot --nginx -d pilgrimspath.io -d www.pilgrimspath.io
#   pm2 startup
#   # (copy-paste the command certbot gives you)
#   pm2 save
# =====================================================================

set -euo pipefail

VPS_IP="${1:?Usage: ./deploy.sh VPS_IP SSH_USER}"
SSH_USER="${2:?Usage: ./deploy.sh VPS_IP SSH_USER}"
REMOTE="${SSH_USER}@${VPS_IP}"
DEST="/var/www/pilgrimspath"

echo "▶ Deploying to ${REMOTE}:${DEST}"

# ── 1. Sync files (exclude dev noise + secrets) ──────────────────────
rsync -avz --progress \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.log' \
  --exclude='.idea' \
  --exclude='.vscode' \
  --exclude='deploy' \
  --exclude='tools' \
  --exclude='coverage' \
  --exclude='dist' \
  --exclude='build' \
  ./ "${REMOTE}:${DEST}/"

echo "✓ Files synced"

# ── 2. Upload .env (never committed to git) ───────────────────────────
if [ -f ".env" ]; then
  scp .env "${REMOTE}:${DEST}/.env"
  echo "✓ .env uploaded"
else
  echo "⚠  No local .env found — you must create ${DEST}/.env on the server manually"
  echo "   See .env.example for all required variables"
fi

# ── 3. Nginx config ───────────────────────────────────────────────────
scp deploy/nginx.conf "${REMOTE}:/tmp/pilgrimspath_nginx.conf"
ssh "${REMOTE}" "sudo cp /tmp/pilgrimspath_nginx.conf /etc/nginx/sites-available/pilgrimspath \
  && sudo ln -sf /etc/nginx/sites-available/pilgrimspath /etc/nginx/sites-enabled/pilgrimspath \
  && sudo rm -f /etc/nginx/sites-enabled/default \
  && sudo nginx -t"
echo "✓ Nginx config installed"

# ── 4. npm install on server ──────────────────────────────────────────
ssh "${REMOTE}" "cd ${DEST} && npm install --omit=dev --no-audit --no-fund"
echo "✓ npm install done"

# ── 5. Create logs dir ────────────────────────────────────────────────
ssh "${REMOTE}" "mkdir -p ${DEST}/logs"

# ── 6. PM2 (re)start ─────────────────────────────────────────────────
ssh "${REMOTE}" "cd ${DEST} \
  && pm2 delete pilgrimspath 2>/dev/null || true \
  && pm2 start ecosystem.config.js \
  && pm2 save"
echo "✓ PM2 started"

# ── 7. Reload Nginx ───────────────────────────────────────────────────
ssh "${REMOTE}" "sudo systemctl reload nginx"
echo "✓ Nginx reloaded"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ Deployed! http://pilgrimspath.io should be live"
echo ""
echo "  NEXT: If first deploy, run Certbot for HTTPS:"
echo "    ssh ${REMOTE}"
echo "    sudo certbot --nginx -d pilgrimspath.io -d www.pilgrimspath.io"
echo "    pm2 startup   (then paste the command it gives you)"
echo "    pm2 save"
echo ""
echo "  To check logs:"
echo "    ssh ${REMOTE} 'pm2 logs pilgrimspath --lines 50'"
echo "═══════════════════════════════════════════════════════"
