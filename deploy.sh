#!/bin/bash

echo "🚀 Starting Deployment..."

# 1. Pull the latest code from GitHub
echo "📦 Pulling latest code..."
git pull origin main

# 2. Rebuild the Backend (Root folder)
echo "⚙️ Installing backend dependencies and building..."
npm install
npm run build

# 3. Rebuild the Dashboard (Next.js)
echo "🖥️ Installing dashboard dependencies and building..."
cd dashboard
npm install
npm run build
cd ..

# 4. Restart PM2 to apply changes
echo "🔄 Restarting PM2 services..."
pm2 restart all

echo "✅ Deployment Complete!"
