#!/bin/bash
# Deployment-Script für Production-Server
# 
# Verwendung:
# ./scripts/deploy-to-production.sh [server-user] [server-host] [server-path]
#
# Beispiel:
# ./scripts/deploy-to-production.sh user wameli.com /var/www/html

set -e  # Stoppe bei Fehlern

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deployment zu Production-Server${NC}"
echo ""

# Parameter prüfen
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo -e "${RED}❌ Fehler: Parameter fehlen${NC}"
    echo ""
    echo "Verwendung:"
    echo "  $0 [server-user] [server-host] [server-path]"
    echo ""
    echo "Beispiel:"
    echo "  $0 user wameli.com /var/www/html"
    exit 1
fi

SERVER_USER=$1
SERVER_HOST=$2
SERVER_PATH=$3

# Prüfe ob dist/ existiert
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Fehler: dist/ Ordner nicht gefunden!${NC}"
    echo "Bitte führen Sie zuerst 'npm run build' aus."
    exit 1
fi

echo -e "${YELLOW}📦 Schritt 1: Prüfe Build...${NC}"
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Fehler: dist/index.html nicht gefunden!${NC}"
    echo "Bitte führen Sie zuerst 'npm run build' aus."
    exit 1
fi
echo -e "${GREEN}✅ Build gefunden${NC}"
echo ""

echo -e "${YELLOW}📤 Schritt 2: Lösche alte Dateien auf Server...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "rm -rf ${SERVER_PATH}/assets/*" || {
    echo -e "${YELLOW}⚠️  Konnte alte Dateien nicht löschen (möglicherweise nicht vorhanden)${NC}"
}
echo -e "${GREEN}✅ Alte Dateien gelöscht${NC}"
echo ""

echo -e "${YELLOW}📤 Schritt 3: Lade neue Dateien hoch...${NC}"
scp -r dist/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/ || {
    echo -e "${RED}❌ Fehler beim Hochladen!${NC}"
    exit 1
}
echo -e "${GREEN}✅ Dateien hochgeladen${NC}"
echo ""

echo -e "${YELLOW}📤 Schritt 4: Lade API-Dateien hoch...${NC}"
scp -r api/* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/api/ || {
    echo -e "${YELLOW}⚠️  API-Dateien konnten nicht hochgeladen werden${NC}"
}
echo -e "${GREEN}✅ API-Dateien hochgeladen${NC}"
echo ""

echo -e "${GREEN}✅ Deployment erfolgreich abgeschlossen!${NC}"
echo ""
echo "Die neuen Dateien sind jetzt auf dem Server:"
echo "  - Frontend: ${SERVER_PATH}/"
echo "  - API: ${SERVER_PATH}/api/"
echo ""



