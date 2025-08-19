@echo off
REM Development environment - Python in Docker, Frontend locally

echo Starting Archon development environment...
echo Python services in Docker, Frontend running locally

REM Check if .env file exists
if not exist .env goto no_env_file

REM Set Docker BuildKit for faster builds
set DOCKER_BUILDKIT=1
set COMPOSE_DOCKER_CLI_BUILD=1

REM Check if production/deployment containers are running and stop them
echo Checking for running production containers...
docker ps | findstr "Archon-Server Archon-UI Archon-MCP Archon-Agents" >nul 2>&1
if %errorlevel%==0 (
    echo Production containers detected. Stopping them to avoid port conflicts...
    docker-compose down
    echo Production containers stopped.
    echo.
)

REM Check if backend containers are already running
docker ps | findstr "Archon-Backend-Server" >nul 2>&1
if %errorlevel%==0 goto containers_running

REM Check if backend containers exist but are stopped
docker ps -a | findstr "Archon-Backend-Server" >nul 2>&1
if %errorlevel%==0 goto start_existing

:build_new
echo Building backend containers for first time...
docker-compose -p archon-backend -f docker-compose.backend.yml up -d --build
goto wait_for_services

:start_existing
echo Starting existing backend containers...
docker-compose -p archon-backend -f docker-compose.backend.yml start
goto wait_for_services

:containers_running
echo Backend containers already running. No rebuild needed.

:wait_for_services
REM Wait for backend services to be ready
echo Waiting for backend services...
timeout /t 3 /nobreak > nul

REM Check backend health
docker-compose -p archon-backend -f docker-compose.backend.yml ps

echo.
echo Backend services started in Docker!
echo.
echo Starting frontend locally...
echo.

REM Start frontend locally in a new window
cd archon-ui-main
start "Archon Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo Development Environment Ready!
echo ===================================================
echo.
echo Backend Services in Docker:
echo   API Server:     http://localhost:8181
echo   MCP Server:     http://localhost:8051
echo   Agents Service: http://localhost:8052
echo.
echo Frontend running locally:
echo   UI with HMR:    http://localhost:3737
echo.
echo Commands:
echo   Backend logs:   docker-compose -p archon-backend -f docker-compose.backend.yml logs -f
echo   Stop backend:   docker-compose -p archon-backend -f docker-compose.backend.yml stop
echo   Remove backend: docker-compose -p archon-backend -f docker-compose.backend.yml down
echo.
echo Frontend is running in a separate window with full HMR support!
echo Edit files in archon-ui-main/ and see instant updates.
goto end

:no_env_file
echo ERROR: .env file not found. Please copy .env.example to .env and configure it.
exit /b 1

:end