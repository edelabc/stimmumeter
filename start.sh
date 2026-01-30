#!/bin/bash

# Farben für die Ausgabe
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
XAMPP_HTDOCS="/Applications/XAMPP/xamppfiles/htdocs"
PROJECT_NAME="stimmumeter"
TARGET_DIR="$XAMPP_HTDOCS/$PROJECT_NAME"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Funktion für formatierte Ausgabe
info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 1. Prüfen der Anforderungen (Requirements)
step "Schritt 1: Prüfe Systemanforderungen..."

# Prüfen ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    error "Node.js ist nicht installiert. Bitte installieren Sie Node.js, um fortzufahren."
    exit 1
else
    success "Node.js ist installiert: $(node -v)"
fi

# Prüfen ob npm installiert ist
if ! command -v npm &> /dev/null; then
    error "npm ist nicht installiert. Bitte installieren Sie npm, um fortzufahren."
    exit 1
else
    success "npm ist installiert: $(npm -v)"
fi

# Prüfen ob XAMPP htdocs existiert
if [ ! -d "$XAMPP_HTDOCS" ]; then
    error "XAMPP htdocs nicht gefunden: $XAMPP_HTDOCS"
    error "Bitte stellen Sie sicher, dass XAMPP installiert ist."
    exit 1
else
    success "XAMPP htdocs gefunden: $XAMPP_HTDOCS"
fi

# 2. API-Dateien zu XAMPP synchronisieren
step "Schritt 2: Synchronisiere API-Dateien zu XAMPP..."

# Erstelle Zielverzeichnis falls nicht vorhanden
if [ ! -d "$TARGET_DIR" ]; then
    info "Erstelle Verzeichnis: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# Synchronisiere nur die für die API notwendigen Dateien (nicht node_modules, dist, etc.)
info "Kopiere API-Dateien..."

# API-Verzeichnis
if [ -d "$SCRIPT_DIR/api" ]; then
    rsync -av --delete "$SCRIPT_DIR/api/" "$TARGET_DIR/api/"
    success "API-Verzeichnis synchronisiert"
fi

# Config-Dateien
if [ -f "$SCRIPT_DIR/config.local.php" ]; then
    cp "$SCRIPT_DIR/config.local.php" "$TARGET_DIR/"
    success "config.local.php kopiert"
fi

if [ -f "$SCRIPT_DIR/config.production.php" ]; then
    cp "$SCRIPT_DIR/config.production.php" "$TARGET_DIR/"
    success "config.production.php kopiert"
fi

# .htaccess
if [ -f "$SCRIPT_DIR/.htaccess" ]; then
    cp "$SCRIPT_DIR/.htaccess" "$TARGET_DIR/"
    success ".htaccess kopiert"
fi

# Database-Verzeichnis (falls vorhanden)
if [ -d "$SCRIPT_DIR/database" ]; then
    rsync -av --delete "$SCRIPT_DIR/database/" "$TARGET_DIR/database/"
    success "Database-Verzeichnis synchronisiert"
fi

# Scripts-Verzeichnis (falls vorhanden)
if [ -d "$SCRIPT_DIR/scripts" ]; then
    rsync -av --delete "$SCRIPT_DIR/scripts/" "$TARGET_DIR/scripts/"
    success "Scripts-Verzeichnis synchronisiert"
fi

success "API-Dateien erfolgreich nach $TARGET_DIR synchronisiert!"

# 3. Teste API-Erreichbarkeit
step "Schritt 3: Teste API-Erreichbarkeit..."

# Prüfe ob Apache läuft
if pgrep -x "httpd" > /dev/null; then
    success "Apache läuft"
else
    error "Apache scheint nicht zu laufen. Bitte starten Sie XAMPP."
    info "Versuche trotzdem fortzufahren..."
fi

# Teste API-Endpunkt
API_TEST_URL="http://localhost/$PROJECT_NAME/api/test.php"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_TEST_URL" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    success "API ist erreichbar (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "404" ]; then
    info "API test.php nicht gefunden (HTTP 404) - das ist OK wenn test.php nicht existiert"
elif [ "$HTTP_CODE" = "000" ]; then
    error "Keine Verbindung zu Apache möglich. Ist XAMPP gestartet?"
else
    info "API antwortet mit HTTP $HTTP_CODE"
fi

# 4. Abhängigkeiten installieren
step "Schritt 4: Prüfe Projekt-Abhängigkeiten..."

if [ ! -d "node_modules" ]; then
    info "node_modules nicht gefunden. Installiere Abhängigkeiten..."
    npm install
    if [ $? -eq 0 ]; then
        success "Abhängigkeiten erfolgreich installiert."
    else
        error "Fehler beim Installieren der Abhängigkeiten."
        exit 1
    fi
else
    success "node_modules bereits vorhanden."
fi

# 5. Laufende Prozesse prüfen und beenden (Port 5173)
target_port=5173
step "Schritt 5: Prüfe Port $target_port..."

# Suche nach Prozessen auf dem Port (MacOS/Linux)
pid=$(lsof -ti:$target_port)

if [ -n "$pid" ]; then
    info "Prozess auf Port $target_port gefunden (PID: $pid). Beende Prozess..."
    kill -9 $pid
    success "Prozess auf Port $target_port wurde beendet."
else
    success "Port $target_port ist frei."
fi

# 6. Anwendung starten
step "Schritt 6: Starte Vite Dev-Server..."
echo ""
info "=================================================="
info "  Frontend: http://localhost:5173"
info "  API:      http://localhost/$PROJECT_NAME/api/"
info "=================================================="
echo ""

# Starte die Anwendung
npm run dev

