# 📋 Registrierung mit AGB-Checkboxen - Setup-Anleitung

## ✅ Was wurde implementiert?

Die Registrierung wurde erweitert mit:
- ✅ Checkboxen für AGB, Datenschutz und Cookies
- ✅ Verknüpfung mit Vereinbarungen aus dem Admin-Bereich
- ✅ Modal zum Anzeigen der Vereinbarungen
- ✅ Datenbank-Tabelle `user_agreement_consents` zur Speicherung der Zustimmungen
- ✅ GDPR-konforme Speicherung mit IP-Adresse, User-Agent und Zeitstempel

---

## 🗄️ Datenbank-Setup

### Schritt 1: Migration ausführen

**Für Supabase:**
1. Öffnen Sie das Supabase Dashboard
2. Gehen Sie zu SQL Editor
3. Führen Sie die Migration aus: `supabase/migrations/20251123000000_create_user_agreement_consents.sql`

**Für MySQL:**
1. Öffnen Sie phpMyAdmin
2. Wählen Sie die Datenbank `wameli`
3. Führen Sie die Migration aus: `database/migrations/mysql/20251123000000_create_user_agreement_consents.sql`

**Oder:** Die Tabelle ist bereits in `database/create-complete-database.sql` enthalten!

---

## 📝 Vereinbarungen im Admin-Bereich erstellen

### Schritt 2: Vereinbarungstitel erstellen

1. **Loggen Sie sich** als Admin ein
2. Gehen Sie zu **"Admin"** → **"Vereinbarungen"**
3. Klicken Sie auf **"Neuer Vereinbarungstitel"**
4. Erstellen Sie folgende Titel:

   **AGB:**
   - Titel: `AGB` oder `Allgemeine Geschäftsbedingungen`
   - Beschreibung: `Allgemeine Geschäftsbedingungen für die Nutzung der Plattform`

   **Datenschutz:**
   - Titel: `Datenschutz` oder `Datenschutzerklärung`
   - Beschreibung: `Informationen zur Verarbeitung personenbezogener Daten`

   **Cookies:**
   - Titel: `Cookies` oder `Cookie-Richtlinie`
   - Beschreibung: `Informationen zur Verwendung von Cookies`

### Schritt 3: Vereinbarungen erstellen

Für jeden Titel erstellen Sie eine Vereinbarung:

1. Klicken Sie auf **"Neue Vereinbarung"**
2. Wählen Sie den entsprechenden Titel aus
3. Fügen Sie den Inhalt ein (HTML-Format)
4. Setzen Sie den Status auf **"Unterzeichnet"** (wichtig!)
5. Speichern Sie die Vereinbarung

**WICHTIG:** 
- Der Status muss **"Unterzeichnet"** sein, damit die Vereinbarung in der Registrierung angezeigt wird
- Der Titel sollte die Keywords enthalten: "AGB", "Datenschutz" oder "Cookie"

---

## 🔍 Wie funktioniert die Verknüpfung?

Die Registrierung sucht automatisch nach Vereinbarungen:

1. **Lädt alle Vereinbarungstitel**
2. **Lädt alle Vereinbarungen** mit Status "Unterzeichnet"
3. **Verknüpft Titel mit Vereinbarungen:**
   - Titel mit "AGB" → `consent_type: 'AGB'`
   - Titel mit "Datenschutz" → `consent_type: 'Datenschutz'`
   - Titel mit "Cookie" → `consent_type: 'Cookies'`

4. **Zeigt Checkboxen** für gefundene Vereinbarungen an

---

## 🎨 UI-Features

### Checkboxen
- ✅ Pflichtfelder (rot markiert mit *)
- ✅ Links zu den Vereinbarungen (öffnen Modal)
- ✅ Externe Link-Icons

### Modal
- ✅ Zeigt vollständigen Vereinbarungsinhalt
- ✅ Scrollbar für lange Inhalte
- ✅ Schließen-Button

### Validierung
- ✅ Alle erforderlichen Vereinbarungen müssen akzeptiert werden
- ✅ Fehlermeldung, wenn nicht alle akzeptiert sind

---

## 💾 Was wird gespeichert?

Bei erfolgreicher Registrierung werden gespeichert:

```sql
user_agreement_consents:
- user_id: ID des neuen Benutzers
- agreement_id: ID der Vereinbarung
- agreement_version: Version der Vereinbarung zum Zeitpunkt der Zustimmung
- consent_type: 'AGB', 'Datenschutz' oder 'Cookies'
- consented_at: Zeitstempel der Zustimmung
- ip_address: IP-Adresse des Benutzers
- user_agent: Browser-Informationen
```

---

## 🧪 Testen

### Test-Szenario 1: Normale Registrierung

1. Gehen Sie zur Registrierung
2. Geben Sie E-Mail und Passwort ein
3. ✅ Checkboxen sollten angezeigt werden
4. Klicken Sie auf einen Vereinbarungs-Link
5. ✅ Modal sollte sich öffnen
6. Akzeptieren Sie alle Checkboxen
7. Klicken Sie auf "Registrieren"
8. ✅ Registrierung sollte erfolgreich sein

### Test-Szenario 2: Validierung

1. Gehen Sie zur Registrierung
2. Geben Sie E-Mail und Passwort ein
3. **NICHT** alle Checkboxen akzeptieren
4. Klicken Sie auf "Registrieren"
5. ✅ Fehlermeldung sollte erscheinen: "Bitte akzeptieren Sie alle erforderlichen Vereinbarungen"

### Test-Szenario 3: Datenbank prüfen

1. Nach erfolgreicher Registrierung
2. Öffnen Sie phpMyAdmin oder Supabase Dashboard
3. Prüfen Sie die Tabelle `user_agreement_consents`
4. ✅ Einträge sollten vorhanden sein mit:
   - user_id
   - agreement_id
   - consent_type
   - consented_at

---

## 🔧 Anpassungen

### Vereinbarungen hinzufügen/ändern

**Weitere Vereinbarungen hinzufügen:**

1. Erweitern Sie das `consent_type` ENUM in der Datenbank:
   ```sql
   ALTER TABLE user_agreement_consents 
   MODIFY consent_type ENUM('AGB', 'Datenschutz', 'Cookies', 'DSGVO', 'Impressum', 'Widerruf', 'IhreNeueVereinbarung');
   ```

2. Erweitern Sie die `loadAgreements` Funktion in `AuthForm.tsx`:
   ```typescript
   if (titleLower.includes('ihre-neue-vereinbarung')) {
     agreementMap['IhreNeueVereinbarung'] = agreement.id;
   }
   ```

3. Fügen Sie die neue Vereinbarung zum `initialAgreements` Array hinzu

### Checkboxen anpassen

**Pflichtfelder ändern:**

In `AuthForm.tsx`, ändern Sie:
```typescript
required={agreement.agreementId !== ''}  // Alle sind Pflichtfelder
```

Zu:
```typescript
required={agreement.consentType === 'AGB'}  // Nur AGB ist Pflichtfeld
```

---

## 📋 Checkliste

- [ ] ✅ Datenbank-Migration ausgeführt
- [ ] ✅ Vereinbarungstitel erstellt (AGB, Datenschutz, Cookies)
- [ ] ✅ Vereinbarungen erstellt mit Status "Unterzeichnet"
- [ ] ✅ Registrierung getestet
- [ ] ✅ Checkboxen werden angezeigt
- [ ] ✅ Modal funktioniert
- [ ] ✅ Validierung funktioniert
- [ ] ✅ Zustimmungen werden in Datenbank gespeichert

---

## 🆘 Troubleshooting

### Problem: Checkboxen werden nicht angezeigt

**Lösung:**
- Prüfen Sie, ob Vereinbarungen mit Status "Unterzeichnet" existieren
- Prüfen Sie, ob die Titel die Keywords enthalten (AGB, Datenschutz, Cookie)
- Prüfen Sie die Browser-Konsole auf Fehler

### Problem: Modal öffnet sich nicht

**Lösung:**
- Prüfen Sie, ob `agreementId` vorhanden ist
- Prüfen Sie die Browser-Konsole auf Fehler
- Prüfen Sie, ob die Vereinbarung geladen werden kann

### Problem: Zustimmungen werden nicht gespeichert

**Lösung:**
- Prüfen Sie, ob die Tabelle `user_agreement_consents` existiert
- Prüfen Sie die Browser-Konsole auf Fehler
- Prüfen Sie die Supabase/MySQL-Logs

---

## ✅ Fertig!

Die Registrierung ist jetzt GDPR-konform mit Checkboxen für AGB, Datenschutz und Cookies! 🎉





