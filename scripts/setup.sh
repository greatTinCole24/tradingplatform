#!/bin/bash

# QuantHub Setup Script
# Automates the initial setup process

echo "🚀 QuantHub Setup Script"
echo "========================"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and fill in your values"
    echo ""
fi

# Check if node_modules exists
if [ -d node_modules ]; then
    echo "✅ Dependencies already installed"
else
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo ""

# Check if database is accessible
echo "🗄️  Checking database connection..."
npx prisma db push --skip-generate 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database schema pushed successfully"
else
    echo "⚠️  Database connection failed or not configured"
    echo "   Please set up your database and update .env"
fi
echo ""

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your actual values (database, API keys, etc.)"
echo "2. Run 'npx prisma db push' to set up the database"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "For deployment instructions, see DEPLOYMENT.md"

