#!/bin/bash

# Vessel Management System - Workspace Commands
# Usage: source .claude/workspace-commands.sh

# Project Paths
export MOBILE_ROOT="/Users/sadradezdar/Documents/Vessel Management System/mobile-apps-team-07"
export BACKEND_ROOT="/Users/sadradezdar/Documents/Vessel Management System/Vessel-Management-App-Backend"
export FRONTEND_ROOT="/Users/sadradezdar/Documents/Vessel Management System/Vessel-Management-App-Frontend/w-shipping-ops"

# Navigation Aliases
alias cdm='cd "$MOBILE_ROOT"'
alias cdb='cd "$BACKEND_ROOT"'
alias cdf='cd "$FRONTEND_ROOT"'

# ============================================
# TESTING COMMANDS
# ============================================

# Run all tests across all platforms
test_all() {
    echo "🧪 Running all tests..."
    echo ""
    echo "📱 Mobile Tests:"
    (cd "$MOBILE_ROOT" && npm test)
    mobile_result=$?

    echo ""
    echo "⚙️ Backend Tests:"
    (cd "$BACKEND_ROOT" && ./mvnw test -q)
    backend_result=$?

    echo ""
    echo "🌐 Frontend Tests:"
    (cd "$FRONTEND_ROOT" && npm test 2>/dev/null || echo "No frontend tests configured")
    frontend_result=$?

    echo ""
    echo "============================================"
    echo "Test Results:"
    [ $mobile_result -eq 0 ] && echo "✅ Mobile: PASSED" || echo "❌ Mobile: FAILED"
    [ $backend_result -eq 0 ] && echo "✅ Backend: PASSED" || echo "❌ Backend: FAILED"
    echo "============================================"
}

# Run mobile tests only
test_mobile() {
    echo "📱 Running mobile tests..."
    (cd "$MOBILE_ROOT" && npm test)
}

# Run mobile tests in watch mode
test_mobile_watch() {
    echo "📱 Running mobile tests (watch mode)..."
    (cd "$MOBILE_ROOT" && npm run test:watch)
}

# Run backend tests only
test_backend() {
    echo "⚙️ Running backend tests..."
    (cd "$BACKEND_ROOT" && ./mvnw test)
}

# Run specific backend test class
test_backend_class() {
    if [ -z "$1" ]; then
        echo "Usage: test_backend_class <TestClassName>"
        return 1
    fi
    echo "⚙️ Running backend test: $1..."
    (cd "$BACKEND_ROOT" && ./mvnw test -Dtest="$1")
}

# Run E2E tests
test_e2e_ios() {
    echo "📱 Running E2E tests (iOS)..."
    (cd "$MOBILE_ROOT" && npm run e2e:ios)
}

test_e2e_android() {
    echo "📱 Running E2E tests (Android)..."
    (cd "$MOBILE_ROOT" && npm run e2e:android)
}

# ============================================
# DEVELOPMENT COMMANDS
# ============================================

# Start mobile dev server
dev_mobile() {
    echo "📱 Starting mobile dev server..."
    (cd "$MOBILE_ROOT" && npm run dev)
}

# Start backend server
dev_backend() {
    echo "⚙️ Starting backend server..."
    (cd "$BACKEND_ROOT" && ./mvnw spring-boot:run)
}

# Start frontend dev server
dev_frontend() {
    echo "🌐 Starting frontend dev server..."
    (cd "$FRONTEND_ROOT" && npm run dev)
}

# Start all dev servers (in separate terminals)
dev_all() {
    echo "🚀 Starting all development servers..."
    echo "Run these commands in separate terminals:"
    echo ""
    echo "  Terminal 1 (Backend):  cd \"$BACKEND_ROOT\" && ./mvnw spring-boot:run"
    echo "  Terminal 2 (Mobile):   cd \"$MOBILE_ROOT\" && npm run dev"
    echo "  Terminal 3 (Frontend): cd \"$FRONTEND_ROOT\" && npm run dev"
}

# ============================================
# BUILD COMMANDS
# ============================================

# Build backend JAR
build_backend() {
    echo "⚙️ Building backend..."
    (cd "$BACKEND_ROOT" && ./mvnw clean package -DskipTests)
}

# Build frontend
build_frontend() {
    echo "🌐 Building frontend..."
    (cd "$FRONTEND_ROOT" && npm run build)
}

# ============================================
# LINTING & TYPE CHECKING
# ============================================

# Type check mobile
typecheck_mobile() {
    echo "📱 Type checking mobile..."
    (cd "$MOBILE_ROOT" && npx tsc --noEmit)
}

# Lint mobile
lint_mobile() {
    echo "📱 Linting mobile..."
    (cd "$MOBILE_ROOT" && npm run lint)
}

# ============================================
# GIT COMMANDS
# ============================================

# Status across all repos
git_status_all() {
    echo "📱 Mobile:"
    (cd "$MOBILE_ROOT" && git status -s)
    echo ""
    echo "⚙️ Backend:"
    (cd "$BACKEND_ROOT" && git status -s)
    echo ""
    echo "🌐 Frontend:"
    (cd "$FRONTEND_ROOT" && git status -s)
}

# Pull all repos
git_pull_all() {
    echo "📱 Pulling mobile..."
    (cd "$MOBILE_ROOT" && git pull)
    echo ""
    echo "⚙️ Pulling backend..."
    (cd "$BACKEND_ROOT" && git pull)
    echo ""
    echo "🌐 Pulling frontend..."
    (cd "$FRONTEND_ROOT" && git pull)
}

# ============================================
# UTILITY COMMANDS
# ============================================

# Open Swagger UI
swagger() {
    echo "📖 Opening Swagger UI..."
    open "http://localhost:8080/swagger-ui.html"
}

# Open H2 Console
h2console() {
    echo "🗄️ Opening H2 Console..."
    open "http://localhost:8080/h2-console"
}

# Show all workspace commands
workspace_help() {
    echo "Vessel Management System - Workspace Commands"
    echo "=============================================="
    echo ""
    echo "Navigation:"
    echo "  cdm                    - Go to mobile project"
    echo "  cdb                    - Go to backend project"
    echo "  cdf                    - Go to frontend project"
    echo ""
    echo "Testing:"
    echo "  test_all               - Run all tests"
    echo "  test_mobile            - Run mobile tests"
    echo "  test_mobile_watch      - Run mobile tests (watch)"
    echo "  test_backend           - Run backend tests"
    echo "  test_backend_class X   - Run specific backend test"
    echo "  test_e2e_ios           - Run iOS E2E tests"
    echo "  test_e2e_android       - Run Android E2E tests"
    echo ""
    echo "Development:"
    echo "  dev_mobile             - Start mobile dev server"
    echo "  dev_backend            - Start backend server"
    echo "  dev_frontend           - Start frontend dev server"
    echo "  dev_all                - Show commands for all servers"
    echo ""
    echo "Build:"
    echo "  build_backend          - Build backend JAR"
    echo "  build_frontend         - Build frontend"
    echo ""
    echo "Linting:"
    echo "  typecheck_mobile       - Type check mobile"
    echo "  lint_mobile            - Lint mobile"
    echo ""
    echo "Git:"
    echo "  git_status_all         - Git status all repos"
    echo "  git_pull_all           - Git pull all repos"
    echo ""
    echo "Utilities:"
    echo "  swagger                - Open Swagger UI"
    echo "  h2console              - Open H2 Console"
    echo "  workspace_help         - Show this help"
}

echo "✅ Workspace commands loaded. Type 'workspace_help' for available commands."
