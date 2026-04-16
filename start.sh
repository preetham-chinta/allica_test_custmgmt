#!/bin/bash

# ── Allica Bank Tech Assessment Runner ────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}🚀 Starting Allica Bank Stack...${NC}"

# Ensure we have correct PATH for this session if run via some IDEs
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $MVC_PID $WEBFLUX_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}🍃 Starting Spring MVC Backend (Port 8080)...${NC}"
./gradlew :backend-mvc:bootRun --args='--spring.profiles.active=dev' > mvc.log 2>&1 &
MVC_PID=$!

echo -e "${GREEN}🍃 Starting Spring WebFlux Backend (Port 8081)...${NC}"
./gradlew :backend-webflux:bootRun --args='--spring.profiles.active=dev' > webflux.log 2>&1 &
WEBFLUX_PID=$!

echo -e "${GREEN}⚡ Starting React Frontend (Port 3000)...${NC}"
cd frontend && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✔${NC} MVC Backend:     ${YELLOW}http://localhost:8080/actuator/health${NC}"
echo -e "  ${GREEN}✔${NC} WebFlux Backend: ${YELLOW}http://localhost:8081/actuator/health${NC}"
echo -e "  ${GREEN}✔${NC} React Frontend:  ${YELLOW}http://localhost:3000${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${CYAN}Logs are being written to:${NC}"
echo -e "  - mvc.log"
echo -e "  - webflux.log"
echo -e "  - frontend.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services.${NC}"

# Wait for processes
wait
