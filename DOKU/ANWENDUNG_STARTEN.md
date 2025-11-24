# 🚀 Anwendung starten

**Datum:** 2025-01-23

---

## ✅ Anwendung wurde gestartet

### Vite Dev Server

Der Entwicklungsserver wurde gestartet und läuft auf:

**URL:** http://localhost:5173

### Status

- ✅ `.env` Datei vorhanden
- ✅ Vite Dev Server gestartet
- ✅ MySQL-Datenbank konfiguriert

---

## 📋 Zugriff

### Frontend
- **URL:** http://localhost:5173
- **Status:** Läuft im Hintergrund

### Backend-APIs
- **Base URL:** http://localhost/stimmumeter/api
- **Beispiel:** http://localhost/stimmumeter/api/auth.php?action=user

---

## 🔧 Konfiguration

### Umgebungsvariablen (.env)
```env
VITE_API_BASE_URL=http://localhost/stimmumeter/api
```

### MySQL-Datenbank
- **Host:** 127.0.0.1
- **Port:** 3306
- **Datenbank:** wameli
- **Benutzer:** root

---

## 🧪 Testen

### 1. Frontend öffnen
Öffnen Sie im Browser: http://localhost:5173

### 2. Registrierung testen
1. Klicken Sie auf "Registrieren"
2. Geben Sie E-Mail und Passwort ein
3. Klicken Sie auf "Registrieren"

### 3. Login testen
1. Geben Sie Ihre E-Mail und Passwort ein
2. Klicken Sie auf "Anmelden"

### 4. Mood-Funktionen testen
1. Erstellen Sie ein Pseudonym
2. Erstellen Sie einen Mood-Eintrag
3. Prüfen Sie die Historie

---

## ⚠️ Wichtige Hinweise

1. **MySQL muss laufen:** Stellen Sie sicher, dass XAMPP MySQL läuft
2. **Apache muss laufen:** Für die PHP-APIs muss Apache laufen
3. **Port 5173:** Der Vite Dev Server verwendet Port 5173

---

## 🛑 Server stoppen

Um den Dev-Server zu stoppen:
```bash
# Im Terminal Strg+C drücken
# Oder Prozess beenden:
pkill -f "vite"
```

---

**Status:** ✅ Anwendung läuft

