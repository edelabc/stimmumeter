# 🤖 AI-Konfiguration Tabellen erstellen

## Problem

Die Fehler `500 Internal Server Error` bei `/api/ai-configurations.php` deuten darauf hin, dass die folgenden Tabellen fehlen:
- `ai_configurations`
- `ai_provider_settings`
- `ai_terms_acceptance`

## Lösung

### Schritt 1: SQL-Script auf den Server hochladen

Die Datei `database/create-ai-tables-production.sql` auf den Production-Server hochladen.

### Schritt 2: Script ausführen

**Option A: Über MySQL Command Line**

```bash
# Auf dem Server einloggen
ssh user@wameli.com

# MySQL als Datenbankbenutzer öffnen
mysql -u TrastimoGmbHsql6 -p wameli

# Script ausführen
source /path/to/create-ai-tables-production.sql;
```

**Option B: Direkt ausführen**

```bash
mysql -u TrastimoGmbHsql6 -p wameli < /path/to/create-ai-tables-production.sql
```

**Option C: Über phpMyAdmin**

1. phpMyAdmin öffnen
2. Datenbank `wameli` auswählen
3. Tab "SQL" öffnen
4. Inhalt der Datei `create-ai-tables-production.sql` einfügen
5. "Ausführen" klicken

### Schritt 3: Verifizierung

Nach der Ausführung sollten folgende Tabellen existieren:
- ✅ `ai_configurations`
- ✅ `ai_provider_settings` (mit 5 Standard-Providern)
- ✅ `ai_terms_acceptance`

Prüfen:
```sql
SHOW TABLES LIKE 'ai_%';
SELECT * FROM ai_provider_settings;
```

## Erstellte Tabellen

### 1. `ai_configurations`
Speichert die AI-Konfigurationen der Benutzer:
- `id` - Eindeutige ID
- `user_id` - Benutzer-ID
- `nickname` - Anzeigename
- `provider` - AI-Provider (openai, gemini, claude, xai, manus)
- `model` - Modell-Name
- `api_key` - Verschlüsselte API-Schlüssel
- `is_active` - Aktive Konfiguration
- `is_enabled` - Aktiviert/Deaktiviert
- `system_prompt` - Optionaler System-Prompt

### 2. `ai_provider_settings`
Admin-Einstellungen für AI-Provider:
- `id` - Eindeutige ID
- `provider` - Provider-Name
- `is_enabled` - Provider aktiviert/deaktiviert
- `system_prompt` - Standard System-Prompt

### 3. `ai_terms_acceptance`
Speichert die Annahme der Nutzungsbedingungen:
- `id` - Eindeutige ID
- `user_id` - Benutzer-ID
- `provider` - Provider-Name
- `accepted_at` - Annahme-Datum
- `terms_version` - Version der Bedingungen

## Standard-Daten

Das Script erstellt automatisch 5 Standard-Provider in `ai_provider_settings`:
- ✅ OpenAI
- ✅ Gemini
- ✅ Claude
- ✅ XAI
- ✅ Manus

Alle Provider sind standardmäßig aktiviert (`is_enabled = 1`).

## Nach der Einrichtung

Nach dem Ausführen des Scripts sollten die API-Endpunkte funktionieren:
- ✅ `/api/ai-configurations.php?action=list`
- ✅ `/api/ai-configurations.php?action=enabled-providers`
- ✅ `/api/ai-configurations.php?action=check-terms`

## Troubleshooting

### Fehler: "Table already exists"

→ Das ist OK, die Tabellen existieren bereits. Das Script verwendet `CREATE TABLE IF NOT EXISTS`, daher werden bestehende Tabellen nicht überschrieben.

### Fehler: "Access denied"

→ Stellen Sie sicher, dass der Benutzer `TrastimoGmbHsql6` die Berechtigung hat, Tabellen zu erstellen. Falls nicht, führen Sie das Script als ROOT-Admin aus.

### Fehler: "Unknown column"

→ Möglicherweise fehlt die Spalte `system_prompt` in der Tabelle `ai_configurations`. Das Script sollte diese automatisch hinzufügen, aber falls nicht, führen Sie folgendes aus:

```sql
ALTER TABLE `ai_configurations` 
ADD COLUMN `system_prompt` TEXT NULL 
AFTER `is_enabled`;
```




