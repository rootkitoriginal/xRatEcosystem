#!/bin/bash

# xRat Ecosystem Control Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

case "$1" in
  start)
    echo "🚀 Starting xRat Ecosystem..."
    docker compose up -d --build
    echo "✅ xRat Ecosystem started!"
    echo ""
    echo "📍 Access points:"
    echo "   Production:  http://localhost              (Nginx)"
    echo "   Frontend:    http://localhost:5173         (Development)"
    echo "   Backend:     http://localhost:3000         (API Root)"
    echo ""
    echo "🔌 API Endpoints:"
    echo "   API v1:      http://localhost:3000/api/v1  (Stable)"
    echo "   API v2:      http://localhost:3000/api/v2  (Planned)"
    echo "   Versions:    http://localhost:3000/api/versions"
    echo "   API Docs:    http://localhost:3000/api-docs"
    echo "   Health:      http://localhost:3000/health"
    echo ""
    echo "💾 Internal Services:"
    echo "   MongoDB:     mongodb://localhost:27017"
    echo "   Redis:       redis://localhost:6379"
    echo ""
    echo "📊 View logs: ./xrat.sh logs"
    ;;
  
  stop)
    echo "🛑 Stopping xRat Ecosystem..."
    docker compose down
    echo "✅ xRat Ecosystem stopped!"
    echo ""
    echo "ℹ️  To start again: ./xrat.sh start"
    ;;
  
  restart)
    echo "🔄 Restarting xRat Ecosystem..."
    docker compose restart
    echo "✅ xRat Ecosystem restarted!"
    echo ""
    echo "📍 Access points:"
    echo "   Production:  http://localhost              (Nginx)"
    echo "   Frontend:    http://localhost:5173         (Development)"
    echo "   Backend:     http://localhost:3000         (API Root)"
    echo ""
    echo "🔌 API Endpoints:"
    echo "   API v1:      http://localhost:3000/api/v1  (Stable)"
    echo "   API v2:      http://localhost:3000/api/v2  (Planned)"
    echo "   Versions:    http://localhost:3000/api/versions"
    echo "   API Docs:    http://localhost:3000/api-docs"
    echo "   Health:      http://localhost:3000/health"
    echo ""
    echo "💾 Internal Services:"
    echo "   MongoDB:     mongodb://localhost:27017"
    echo "   Redis:       redis://localhost:6379"
    echo ""
    echo "📊 View logs: ./xrat.sh logs"
    ;;

  
  logs)
    docker compose logs -f
    echo ""
    echo "ℹ️  Press Ctrl+C to exit logs view."
    ;;
  
  status)
    echo "📊 xRat Ecosystem Status:"
    docker compose ps
    echo ""
    echo "ℹ️  To view logs: ./xrat.sh logs"
    ;;
  
  clean)
    echo "🧹 Cleaning xRat Ecosystem (removing volumes)..."
    read -p "⚠️  This will delete all data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker compose down -v
      echo "✅ xRat Ecosystem cleaned!"
      echo ""
      echo "ℹ️  To start fresh: ./xrat.sh start"
    else
      echo "❌ Cancelled"
    fi
    ;;
  
  rebuild)
    echo "🔨 Rebuilding xRat Ecosystem..."
    docker compose up -d --build --force-recreate
    echo "✅ xRat Ecosystem rebuilt!"
    echo ""
    echo "📊 View logs: ./xrat.sh logs"
    ;;
  
  shell-backend)
    echo "🐚 Opening backend shell..."
    docker compose exec backend sh
    echo ""
    echo "ℹ️  Type 'exit' to leave the backend shell."
    ;;
  
  shell-frontend)
    echo "🐚 Opening frontend shell..."
    docker compose exec frontend sh
    echo ""
    echo "ℹ️  Type 'exit' to leave the frontend shell."
    ;;
  
  shell-mongo)
    echo "🐚 Opening MongoDB shell..."
    docker compose exec mongodb mongosh -u admin -p xratpassword
    echo ""
    echo "ℹ️  Type 'exit' to leave the MongoDB shell."
    ;;
  
  shell-redis)
    echo "🐚 Opening Redis CLI..."
    docker compose exec redis redis-cli -a xratredispass
    echo ""
    echo "ℹ️  Type 'exit' to leave the Redis CLI."
    ;;
  
  test-api)
    echo "🧪 Testing API endpoints..."
    echo ""
    echo "1️⃣  Testing API Root:"
    curl -s http://localhost:3000/ | jq '.'
    echo ""
    echo "2️⃣  Testing API Versions Discovery:"
    curl -s http://localhost:3000/api/versions | jq '.'
    echo ""
    echo "3️⃣  Testing API v1 Status:"
    curl -s http://localhost:3000/api/v1/status | jq '.'
    echo ""
    echo "4️⃣  Testing API v2 (should return 501):"
    curl -s http://localhost:3000/api/v2/status | jq '.'
    echo ""
    echo "5️⃣  Testing Health Check:"
    curl -s http://localhost:3000/health | jq '.'
    echo ""
    echo "✅ API tests complete!"
    ;;
  
  test-headers)
    echo "🔍 Testing API Version Headers..."
    echo ""
    echo "API v1 Headers:"
    curl -sI http://localhost:3000/api/v1/status | grep -i "x-api"
    echo ""
    echo "API v2 Headers:"
    curl -sI http://localhost:3000/api/v2/status | grep -i "x-api"
    echo ""
    echo "✅ Header tests complete!"
    ;;
  
  *)
    echo "🐀 xRat Ecosystem Control Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|clean|rebuild|test-api|test-headers|shell-*}"
    echo ""
    echo "🚀 Lifecycle Commands:"
    echo "  start           - Start the ecosystem"
    echo "  stop            - Stop the ecosystem"
    echo "  restart         - Restart all services"
    echo "  rebuild         - Rebuild and restart all services"
    echo "  clean           - Stop and remove all data (volumes)"
    echo ""
    echo "📊 Monitoring Commands:"
    echo "  logs            - View logs (real-time)"
    echo "  status          - Show status of all services"
    echo "  test-api        - Test all API endpoints"
    echo "  test-headers    - Test API version headers"
    echo ""
    echo "🐚 Shell Access:"
    echo "  shell-backend   - Open backend container shell"
    echo "  shell-frontend  - Open frontend container shell"
    echo "  shell-mongo     - Open MongoDB shell"
    echo "  shell-redis     - Open Redis CLI"
    echo ""
    echo "📚 Documentation:"
    echo "  Docs:   docs/XRAT_SCRIPT_GUIDE.md"
    echo "  API:    docs/API_VERSIONING.md"
    echo ""
    exit 1
    ;;
esac
