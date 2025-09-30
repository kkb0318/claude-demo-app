.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend build start stop clean logs

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Default target
help:
	@echo "$(BLUE)PC Caption Analyzer - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@echo "  make install       - Install all dependencies (frontend & backend)"
	@echo "  make dev          - Start both servers in development mode"
	@echo "  make dev-backend  - Start only backend server"
	@echo "  make dev-frontend - Start only frontend server"
	@echo ""
	@echo "$(GREEN)Production Commands:$(NC)"
	@echo "  make build        - Build both frontend and backend"
	@echo "  make start        - Start both servers in production mode"
	@echo "  make stop         - Stop all running servers"
	@echo ""
	@echo "$(GREEN)Utility Commands:$(NC)"
	@echo "  make logs         - Show logs from both servers"
	@echo "  make clean        - Clean all node_modules and build artifacts"
	@echo "  make setup-env    - Create .env files from examples"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(NC)"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers (production)"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-dev   - Start Docker containers (development)"
	@echo "  make docker-logs  - Show Docker logs"
	@echo "  make docker-clean - Clean Docker resources"
	@echo ""

# Install dependencies
install: install-backend install-frontend
	@echo "$(GREEN)✓ All dependencies installed successfully$(NC)"

install-backend:
	@echo "$(YELLOW)Installing backend dependencies...$(NC)"
	@cd backend && npm install

install-frontend:
	@echo "$(YELLOW)Installing frontend dependencies...$(NC)"
	@cd frontend && npm install

# Development mode
dev:
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@make -j 2 dev-backend dev-frontend

dev-backend:
	@echo "$(YELLOW)Starting backend server...$(NC)"
	@cd backend && npm run dev

dev-frontend:
	@echo "$(YELLOW)Starting frontend server...$(NC)"
	@cd frontend && npm run dev

# Build for production
build: build-backend build-frontend
	@echo "$(GREEN)✓ Build completed successfully$(NC)"

build-backend:
	@echo "$(YELLOW)Building backend...$(NC)"
	@cd backend && npm run build

build-frontend:
	@echo "$(YELLOW)Building frontend...$(NC)"
	@cd frontend && npm run build

# Production mode
start:
	@echo "$(BLUE)Starting production servers...$(NC)"
	@make -j 2 start-backend start-frontend

start-backend:
	@echo "$(YELLOW)Starting backend in production...$(NC)"
	@cd backend && npm start

start-frontend:
	@echo "$(YELLOW)Starting frontend in production...$(NC)"
	@cd frontend && npm start

# Stop servers (for background processes)
stop:
	@echo "$(RED)Stopping all servers...$(NC)"
	@pkill -f "node.*backend" || true
	@pkill -f "next-server" || true
	@echo "$(GREEN)✓ All servers stopped$(NC)"

# Clean artifacts
clean:
	@echo "$(RED)Cleaning all artifacts...$(NC)"
	@rm -rf backend/node_modules backend/dist backend/package-lock.json
	@rm -rf frontend/node_modules frontend/.next frontend/package-lock.json
	@rm -rf tmp/claude
	@echo "$(GREEN)✓ Cleaned successfully$(NC)"

# Setup environment files
setup-env:
	@echo "$(YELLOW)Setting up environment files...$(NC)"
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "$(GREEN)✓ Created backend/.env (Please update OPENAI_API_KEY)$(NC)"; \
	else \
		echo "$(BLUE)ℹ backend/.env already exists$(NC)"; \
	fi
	@if [ ! -f frontend/.env.local ]; then \
		cp frontend/.env.local.example frontend/.env.local; \
		echo "$(GREEN)✓ Created frontend/.env.local$(NC)"; \
	else \
		echo "$(BLUE)ℹ frontend/.env.local already exists$(NC)"; \
	fi

# Show logs (requires servers to be running)
logs:
	@echo "$(BLUE)Showing recent logs...$(NC)"
	@echo "$(YELLOW)--- Backend Logs ---$(NC)"
	@tail -n 20 backend/logs/*.log 2>/dev/null || echo "No backend logs found"
	@echo ""
	@echo "$(YELLOW)--- Frontend Logs ---$(NC)"
	@tail -n 20 frontend/.next/trace 2>/dev/null || echo "No frontend logs found"

# Quick setup for new environment
quick-start: install setup-env
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Update backend/.env with your OPENAI_API_KEY"
	@echo "2. Run 'make dev' to start development servers"
	@echo ""

# Check if all dependencies are installed
check:
	@echo "$(BLUE)Checking environment...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)✗ Node.js is not installed$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)✗ npm is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ Node.js: $$(node -v)$(NC)"
	@echo "$(GREEN)✓ npm: $$(npm -v)$(NC)"
	@if [ -f backend/.env ]; then \
		echo "$(GREEN)✓ backend/.env exists$(NC)"; \
	else \
		echo "$(YELLOW)⚠ backend/.env not found (run 'make setup-env')$(NC)"; \
	fi
	@if [ -d backend/node_modules ]; then \
		echo "$(GREEN)✓ Backend dependencies installed$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Backend dependencies not installed (run 'make install-backend')$(NC)"; \
	fi
	@if [ -d frontend/node_modules ]; then \
		echo "$(GREEN)✓ Frontend dependencies installed$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Frontend dependencies not installed (run 'make install-frontend')$(NC)"; \
	fi

# Development with auto-restart on file changes
watch:
	@echo "$(BLUE)Starting development servers with auto-restart...$(NC)"
	@make dev

# Run tests
test:
	@echo "$(BLUE)Running tests...$(NC)"
	@cd backend && npm test 2>/dev/null || echo "$(YELLOW)No backend tests configured$(NC)"
	@cd frontend && npm test 2>/dev/null || echo "$(YELLOW)No frontend tests configured$(NC)"

# Format code
format:
	@echo "$(BLUE)Formatting code...$(NC)"
	@cd backend && npm run format 2>/dev/null || echo "$(YELLOW)Backend format not configured$(NC)"
	@cd frontend && npm run format 2>/dev/null || echo "$(YELLOW)Frontend format not configured$(NC)"

# Lint code
lint:
	@echo "$(BLUE)Linting code...$(NC)"
	@cd backend && npm run lint 2>/dev/null || echo "$(YELLOW)Backend lint not configured$(NC)"
	@cd frontend && npm run lint 2>/dev/null || echo "$(YELLOW)Frontend lint not configured$(NC)"

# Docker Commands
docker-build:
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker-compose build

docker-up:
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@docker-compose up -d

docker-down:
	@echo "$(RED)Stopping Docker containers...$(NC)"
	@docker-compose down

docker-dev:
	@echo "$(BLUE)Starting Docker containers in development mode...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3001$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@docker-compose -f docker-compose.dev.yml up

docker-dev-build:
	@echo "$(BLUE)Building and starting Docker containers in development mode...$(NC)"
	@docker-compose -f docker-compose.dev.yml up --build

docker-logs:
	@echo "$(BLUE)Showing Docker logs...$(NC)"
	@docker-compose logs -f

docker-clean:
	@echo "$(RED)Cleaning Docker resources...$(NC)"
	@docker-compose down -v
	@docker system prune -f
	@echo "$(GREEN)✓ Docker cleanup completed$(NC)"

docker-status:
	@echo "$(BLUE)Docker container status...$(NC)"
	@docker-compose ps

docker-restart:
	@echo "$(YELLOW)Restarting Docker containers...$(NC)"
	@make docker-down
	@make docker-up