#!/usr/bin/env bash
# Usage: ./scripts/build-deploy.sh [backend-ec2-ip]
# Produces deploy/ with artifacts for the frontend and backend EC2 instances.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$REPO_ROOT/deploy"
BACKEND_IP="${1:-BACKEND_IP_PLACEHOLDER}"

rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# --- Frontend ---
echo "==> Building frontend..."
cd "$REPO_ROOT/client"
npm ci --silent
npm run build

echo "==> Packaging frontend..."
tar -czf "$DEPLOY_DIR/frontend.tar.gz" -C "$REPO_ROOT/client" dist

cat > "$DEPLOY_DIR/frontend.nginx.conf" <<EOF
server {
    listen 80;
    root /var/www/processr;
    index index.html;

    location /api/ {
        proxy_pass http://${BACKEND_IP}:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 120s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# --- Backend ---
echo "==> Packaging backend..."
# Excludes knowledge-input (only used to regenerate embeddings offline, not at runtime)
tar -czf "$DEPLOY_DIR/backend.tar.gz" \
    -C "$REPO_ROOT/server" \
    --exclude="src/ai/knowledge-input" \
    src package.json package-lock.json

cat > "$DEPLOY_DIR/backend.env.example" <<'EOF'
OPENAI_API_KEY=sk-...
EOF

# --- Summary ---
echo ""
echo "Done. Artifacts in ./deploy/"
echo ""
echo "  frontend.tar.gz        extract to /var/www/processr on the frontend instance"
echo "  frontend.nginx.conf    copy to /etc/nginx/conf.d/processr.conf"
echo "  backend.tar.gz         extract on the backend instance, then:"
echo "                           cp backend.env.example .env && vi .env"
echo "                           npm install"
echo "                           npm start"
echo ""
if [ "$BACKEND_IP" = "BACKEND_IP_PLACEHOLDER" ]; then
    echo "  NOTE: nginx.conf has a placeholder backend IP."
    echo "  Re-run with your backend IP to fill it in:"
    echo "    ./scripts/build-deploy.sh 10.0.1.42"
fi