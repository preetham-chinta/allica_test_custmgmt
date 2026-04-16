#!/bin/bash
set -e

# ── Allica Bank Tech Assessment Setup ─────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Allica Bank Tech Assessment Setup...${NC}\n"

# 1. Check Java 21+
echo -n "Checking Java version... "
if command -v java >/dev/null 2>&1; then
    JAVA_VER=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VER" -lt 21 ]; then
        echo -e "${RED}FAILED${NC}"
        echo -e "Required Java 21+, but found $JAVA_VER."
        echo "Please install Java 21 (Temurin or OpenJDK)."
        exit 1
    else
        echo -e "${GREEN}OK ($JAVA_VER)${NC}"
    fi
else
    echo -e "${RED}NOT FOUND${NC}"
    echo "Java is not installed. Please install Java 21+."
    exit 1
fi

# 2. Check Node 18+
echo -n "Checking Node.js version... "
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        echo -e "${RED}FAILED${NC}"
        echo -e "Required Node 18+, but found $NODE_VER."
        exit 1
    else
        echo -e "${GREEN}OK ($NODE_VER)${NC}"
    fi
else
    echo -e "${RED}NOT FOUND${NC}"
    echo "Node.js is not installed. Please install Node 18+."
    exit 1
fi

# 3. Make gradlew executable
echo -n "Configuring Gradle wrapper... "
chmod +x gradlew
echo -e "${GREEN}DONE${NC}"

# 4. Install Frontend dependencies
echo -e "\n${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
if [ -f package-lock.json ]; then
    npm ci
else
    npm install
fi
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed.${NC}"

# 5. Build backends (dry run to pre-download)
echo -e "\n${YELLOW}🐘 Pre-downloading backend dependencies...${NC}"
./gradlew :backend-mvc:assemble :backend-webflux:assemble

echo -e "\n${GREEN}✨ Setup complete! Everything is ready to run.${NC}"
echo -e "Run ${YELLOW}./start.sh${NC} to start all services."
