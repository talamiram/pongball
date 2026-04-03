#!/bin/bash
# PongBall — Italia 90: One-shot repo + deploy setup
# Run from the PONGWC folder: bash setup.sh

set -e

echo "🏟️  PongBall — Italia 90 Setup"
echo "================================"

# 1. Install Homebrew if missing
if ! command -v brew &> /dev/null; then
  echo "🍺 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon Macs
  if [ -f /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
fi

# 2. Install gh CLI if missing
if ! command -v gh &> /dev/null; then
  echo "📦 Installing GitHub CLI..."
  brew install gh
fi

# 3. Auth check
if ! gh auth status &> /dev/null; then
  echo "🔑 Logging into GitHub..."
  gh auth login
fi

# 4. Git setup
git config user.name "talamiram" 2>/dev/null || true
git config user.email "talamiram@gmail.com" 2>/dev/null || true

# 5. Create the repo
echo "📁 Creating GitHub repo: talamiram/pongball"
gh repo create pongball --public --source=. --remote=origin --push 2>/dev/null || {
  echo "⚠️  Repo may already exist. Setting remote and pushing..."
  git remote add origin https://github.com/talamiram/pongball.git 2>/dev/null || true
}

# 6. Commit and push
git branch -M main
git add -A
git commit -m "Initial commit — PongBall Italia 90" 2>/dev/null || echo "Nothing new to commit"
git push -u origin main

echo ""
echo "✅ Code is live at: https://github.com/talamiram/pongball"
echo ""
echo "================================"
echo "NEXT: Cloudflare Pages (2 minutes)"
echo "================================"
echo "1. Go to: https://pages.cloudflare.com"
echo "2. Sign up (free) → Create a project → Connect to Git"
echo "3. Select the 'pongball' repo"
echo "4. Build settings:"
echo "   - Framework preset: None"
echo "   - Build command: (leave empty)"
echo "   - Build output directory: /"
echo "5. Deploy → then go to Custom Domains → Add 'pongball.io'"
echo "6. Cloudflare will give you 2 nameservers. Put them in Namecheap:"
echo "   Namecheap → Domain List → pongball.io → Nameservers → Custom DNS"
echo ""
echo "🎮 After DNS propagates (~5-30 min), pongball.io is live!"
