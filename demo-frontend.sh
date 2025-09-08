#!/bin/bash

echo "🎨 Starting Frontend Demo (UI Only)"
echo "⚠️  Backend API calls will fail without database setup"
echo "📖 See GETTING_STARTED.md for database configuration"
echo ""

cd frontend && npm run dev
