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
    echo "   Production:  http://localhost        (Nginx)"
    echo "   Frontend:    http://localhost:5173   (Development)"
    echo "   Backend:     http://localhost:3000   (API)"
    echo "   Health:      http://localhost:3000/health"
    echo "   MongoDB:     mongodb://localhost:27017"
    echo "   Redis:       redis://localhost:6379"
    echo ""
    echo "📊 View logs: ./xrat.sh logs"
    ;;
  
  stop)
    echo "🛑 Stopping xRat Ecosystem..."
    docker compose down
    echo "✅ xRat Ecosystem stopped!"
    ;;
  
  restart)
    echo "🔄 Restarting xRat Ecosystem..."
    docker compose restart
    echo "✅ xRat Ecosystem restarted!"
    ;;
  
  logs)
    docker compose logs -f
    ;;
  
  status)
    echo "📊 xRat Ecosystem Status:"
    docker compose ps
    ;;
  
  clean)
    echo "🧹 Cleaning xRat Ecosystem (removing volumes)..."
    read -p "⚠️  This will delete all data. Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker compose down -v
      echo "✅ xRat Ecosystem cleaned!"
    else
      echo "❌ Cancelled"
    fi
    ;;
  
  rebuild)
    echo "🔨 Rebuilding xRat Ecosystem..."
    docker compose up -d --build --force-recreate
    echo "✅ xRat Ecosystem rebuilt!"
    ;;
  
  shell-backend)
    echo "🐚 Opening backend shell..."
    docker compose exec backend sh
    ;;
  
  shell-frontend)
    echo "🐚 Opening frontend shell..."
    docker compose exec frontend sh
    ;;
  
  shell-mongo)
    echo "🐚 Opening MongoDB shell..."
    docker compose exec mongodb mongosh -u admin -p xratpassword
    ;;
  
  shell-redis)
    echo "🐚 Opening Redis CLI..."
    docker compose exec redis redis-cli -a xratredispass
    ;;
  
  *)
    echo "🐀 xRat Ecosystem Control Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|clean|rebuild|shell-backend|shell-frontend|shell-mongo|shell-redis}"
    echo ""
    echo "Commands:"
    echo "  start           - Start the ecosystem"
    echo "  stop            - Stop the ecosystem"
    echo "  restart         - Restart all services"
    echo "  logs            - View logs (real-time)"
    echo "  status          - Show status of all services"
    echo "  clean           - Stop and remove all data (volumes)"
    echo "  rebuild         - Rebuild and restart all services"
    echo "  shell-backend   - Open backend container shell"
    echo "  shell-frontend  - Open frontend container shell"
    echo "  shell-mongo     - Open MongoDB shell"
    echo "  shell-redis     - Open Redis CLI"
    echo ""
    exit 1
    ;;
esac
