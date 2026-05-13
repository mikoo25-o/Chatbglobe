#!/bin/bash
set -e

echo ""
echo "🌐 TransMsg Setup"
echo "=================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+ required)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) found"

# Install root deps
echo ""
echo "📦 Installing dependencies..."
npm install --silent

# Install frontend
echo "📦 Installing frontend..."
cd frontend && npm install --silent && cd ..

# Install backend
echo "📦 Installing backend..."
cd backend && npm install --silent && cd ..

# Copy .env if not exists
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo ""
  echo "⚠️  Created backend/.env from example."
  echo "   Edit it to set JWT_SECRET and translation API keys."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env — set JWT_SECRET and a translation API key"
echo "  2. Run: cd backend && npm run dev  (in one terminal)"
echo "  3. Run: cd frontend && npm run dev  (in another terminal)"
echo "  4. Open http://localhost:5173"
echo ""
