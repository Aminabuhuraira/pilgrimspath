# deploy/deploy.ps1
# =====================================================================
# Pilgrim's Path — One-click Windows deployment to Hostinger VPS
# =====================================================================
# Usage (run from the project root in PowerShell):
#
#   cd "d:\abuhu\Desktop\pilgrimspath code"
#   .\deploy\deploy.ps1
#
# Requirements:
#   - Windows 10/11 with OpenSSH (pre-installed)
#   - scp.exe available (comes with OpenSSH)
#   - Your Hostinger VPS IP and root password
# =====================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot
$REMOTE_DIR   = "/var/www/pilgrimspath"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Pilgrim's Path — Hostinger VPS Deployment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# ── Collect credentials ────────────────────────────────────────────────
$VPS_IP   = Read-Host "Enter your Hostinger VPS IP address"
$SSH_USER = "root"
$REMOTE   = "${SSH_USER}@${VPS_IP}"

Write-Host ""
Write-Host "Target: $REMOTE`:$REMOTE_DIR" -ForegroundColor Yellow
Write-Host ""
Write-Host "Step 1/6: Uploading files (this may take a few minutes for VR assets)..." -ForegroundColor Green

# ── Build exclusion list for a temp staging dir ────────────────────────
$STAGE_DIR = Join-Path $env:TEMP "pp_deploy_$(Get-Random)"
New-Item -ItemType Directory -Path $STAGE_DIR | Out-Null

# Copy project to staging, excluding unnecessary items
$EXCLUDES = @('.git', 'node_modules', '.idea', '.vscode', 'coverage', 'dist', 'build', 'deploy')
$items = Get-ChildItem -Path $PROJECT_ROOT

foreach ($item in $items) {
    if ($EXCLUDES -contains $item.Name) { continue }
    if ($item.Name -match '^\.' -and $item.Name -ne '.env' -and $item.Name -ne '.env.example') { continue }
    $dest = Join-Path $STAGE_DIR $item.Name
    if ($item.PSIsContainer) {
        Copy-Item -Path $item.FullName -Destination $dest -Recurse
    } else {
        Copy-Item -Path $item.FullName -Destination $dest
    }
}

Write-Host "  Staging directory prepared: $STAGE_DIR" -ForegroundColor DarkGray

# ── SSH helper — runs a command on the remote server ──────────────────
function Run-Remote {
    param([string]$Cmd, [string]$Label)
    Write-Host "  $Label" -ForegroundColor DarkGray
    ssh -o "StrictHostKeyChecking=no" -o "BatchMode=no" "${REMOTE}" $Cmd
    if ($LASTEXITCODE -ne 0) {
        throw "Remote command failed: $Cmd"
    }
}

# ── Step 1: Create remote directory ───────────────────────────────────
Write-Host ""
Write-Host "Step 2/6: Creating remote directory..." -ForegroundColor Green
Run-Remote "mkdir -p $REMOTE_DIR/logs" "Creating $REMOTE_DIR/logs"

# ── Step 2: Upload files via SCP ──────────────────────────────────────
Write-Host ""
Write-Host "Step 3/6: Uploading project files..." -ForegroundColor Green
Write-Host "  (You may be prompted for the root password several times)" -ForegroundColor Yellow

# On Windows, scp wildcard doesn't expand — upload the staging folder itself then move
$STAGE_NAME = Split-Path $STAGE_DIR -Leaf
scp -o "StrictHostKeyChecking=no" -r $STAGE_DIR "${REMOTE}:/tmp/${STAGE_NAME}"
if ($LASTEXITCODE -ne 0) { throw "SCP upload failed" }

# Move contents into /var/www/pilgrimspath (overwrite existing)
Run-Remote "rsync -a --delete /tmp/${STAGE_NAME}/ ${REMOTE_DIR}/ 2>/dev/null || cp -r /tmp/${STAGE_NAME}/. ${REMOTE_DIR}/ && rm -rf /tmp/${STAGE_NAME}" "Moving files into place"
Write-Host "  Files uploaded successfully" -ForegroundColor DarkGray

# ── Cleanup staging dir ────────────────────────────────────────────────
Remove-Item -Recurse -Force $STAGE_DIR

# ── Step 3: Install Node.js 20 + PM2 if not present ───────────────────
Write-Host ""
Write-Host "Step 4/6: Checking/installing Node.js 20 and PM2..." -ForegroundColor Green

$SETUP_CMD = @"
set -e
if ! command -v node &>/dev/null || [[ \$(node -v | cut -d. -f1 | tr -d 'v') -lt 18 ]]; then
  echo '-- Installing Node.js 20...'
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
if ! command -v pm2 &>/dev/null; then
  echo '-- Installing PM2...'
  npm install -g pm2
fi
if ! command -v nginx &>/dev/null; then
  echo '-- Installing Nginx...'
  apt-get install -y nginx
fi
echo '-- Versions:'
node -v
npm -v
pm2 -v
nginx -v
"@

Run-Remote $SETUP_CMD "Installing dependencies..."

# ── Step 4: npm install ────────────────────────────────────────────────
Write-Host ""
Write-Host "Step 5/6: Running npm install on server..." -ForegroundColor Green
Run-Remote "cd $REMOTE_DIR && npm install --omit=dev --no-audit --no-fund" "npm install"

# ── Create .env on server if none exists ──────────────────────────────
$ENV_CHECK = @"
if [ ! -f $REMOTE_DIR/.env ]; then
  echo 'Creating placeholder .env (fill in real values later)...'
  cp $REMOTE_DIR/.env.example $REMOTE_DIR/.env
  # Generate a random ADMIN_API_TOKEN
  TOKEN=\$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/replace-with-64-char-hex-secret/\$TOKEN/" $REMOTE_DIR/.env
  echo "-- .env created with placeholder values"
  echo "-- IMPORTANT: edit $REMOTE_DIR/.env with your real credentials"
else
  echo '-- .env already exists, skipping'
fi
"@
Run-Remote $ENV_CHECK "Setting up .env"

# ── Step 5: Nginx config ───────────────────────────────────────────────
Write-Host ""
Write-Host "Step 6/6: Configuring Nginx..." -ForegroundColor Green

# Upload nginx config
scp -o "StrictHostKeyChecking=no" "$PROJECT_ROOT\deploy\nginx.conf" "${REMOTE}:/tmp/pilgrimspath_nginx.conf"

$NGINX_CMD = @"
cp /tmp/pilgrimspath_nginx.conf /etc/nginx/sites-available/pilgrimspath
ln -sf /etc/nginx/sites-available/pilgrimspath /etc/nginx/sites-enabled/pilgrimspath
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx || systemctl start nginx
"@
Run-Remote $NGINX_CMD "Installing Nginx config"

# ── Step 6: PM2 start / restart ───────────────────────────────────────
$PM2_CMD = @"
cd $REMOTE_DIR
pm2 delete pilgrimspath 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash
"@
Run-Remote $PM2_CMD "Starting PM2 process"

# ── Done ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Your site is live at: http://$VPS_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "  IMPORTANT — Next steps:" -ForegroundColor Yellow
Write-Host "  1. Point your domain DNS to this IP: $VPS_IP" -ForegroundColor White
Write-Host "     In Namecheap: A @ -> $VPS_IP  AND  A www -> $VPS_IP" -ForegroundColor White
Write-Host ""
Write-Host "  2. Once DNS is live, get free HTTPS certificate:" -ForegroundColor White
Write-Host "     ssh root@$VPS_IP" -ForegroundColor DarkGray
Write-Host "     apt install -y certbot python3-certbot-nginx" -ForegroundColor DarkGray
Write-Host "     certbot --nginx -d pilgrimspath.io -d www.pilgrimspath.io" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Update your .env on the server:" -ForegroundColor White
Write-Host "     ssh root@$VPS_IP" -ForegroundColor DarkGray
Write-Host "     nano $REMOTE_DIR/.env" -ForegroundColor DarkGray
Write-Host "     # Then fill in real PAYSTACK_SECRET_KEY, SMTP_PASS, etc." -ForegroundColor DarkGray
Write-Host "     pm2 restart pilgrimspath" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  4. Check logs anytime:" -ForegroundColor White
Write-Host "     ssh root@$VPS_IP 'pm2 logs pilgrimspath --lines 50'" -ForegroundColor DarkGray
Write-Host ""
