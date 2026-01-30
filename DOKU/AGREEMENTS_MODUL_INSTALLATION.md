# 📋 Agreements-Modul - Installationsanleitung

**Erstellt am:** 20.11.2025  
**Modul:** Dokumenten-Menü-Modul für Stimmumeter  
**Version:** 1.0.0

---

## 📑 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Voraussetzungen](#voraussetzungen)
3. [Installation](#installation)
4. [Konfiguration](#konfiguration)
5. [Verwendung](#verwendung)
6. [Troubleshooting](#troubleshooting)

---

## 📖 Übersicht

Das Agreements-Modul ermöglicht es Administratoren, dynamische Menüpunkte zu erstellen, die mit Vereinbarungsdokumenten (AGB, Datenschutz, etc.) verknüpft werden können. Jeder Menüpunkt kann ein Agreement-Dokument anzeigen, das über eine URL-freundliche Slug erreichbar ist.

**Features:**
- ✅ CRUD-Operationen für Vereinbarungen
- ✅ Versionsverwaltung
- ✅ Platzhalter-System (z.B. `{{ersteller.email}}`)
- ✅ Dynamische Menüverknüpfung
- ✅ Automatische Slug-Generierung
- ✅ PDF-Export (optional)

---

## 🔧 Voraussetzungen

- Stimmumeter-Anwendung installiert und lauffähig
- Supabase-Projekt eingerichtet
- Admin-Zugriff auf Supabase-Datenbank
- Node.js und npm installiert

---

## 🚀 Installation

### Schritt 1: Datenbank-Migrationen ausführen

Die Migrationen müssen in der richtigen Reihenfolge ausgeführt werden:

```bash
# 1. Agreements-System erstellen
# Migration: 20251120000000_create_agreements_system.sql

# 2. Menu-Items erweitern
# Migration: 20251120000001_extend_menu_items_for_agreements.sql
```

**In Supabase Dashboard:**
1. Gehen Sie zu "SQL Editor"
2. Öffnen Sie die Migration `20251120000000_create_agreements_system.sql`
3. Führen Sie das Script aus
4. Wiederholen Sie für `20251120000001_extend_menu_items_for_agreements.sql`

**Oder via Supabase CLI:**
```bash
supabase migration up
```

### Schritt 2: Frontend-Dependencies installieren (optional)

Für PDF-Generierung benötigen Sie `html2pdf.js`:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
npm install html2pdf.js
npm install --save-dev @types/html2pdf.js
```

**Hinweis:** PDF-Generierung funktioniert auch ohne diese Bibliothek, dann wird eine Fehlermeldung angezeigt.

### Schritt 3: Code-Dateien prüfen

Stellen Sie sicher, dass alle folgenden Dateien vorhanden sind:

**Backend-Services:**
- `src/lib/agreement.service.ts`

**Admin-Komponenten:**
- `src/components/admin/AgreementsManagement.tsx`
- `src/components/admin/PlatzhalterAuswahlModal.tsx`
- `src/components/admin/MenuManagement.tsx` (erweitert)
- `src/components/admin/AdminDashboard.tsx` (erweitert)

**Public-Komponenten:**
- `src/components/DocumentViewer.tsx`
- `src/App.tsx` (erweitert)
- `src/components/Header.tsx` (erweitert)

**Datenbank-Migrationen:**
- `supabase/migrations/20251120000000_create_agreements_system.sql`
- `supabase/migrations/20251120000001_extend_menu_items_for_agreements.sql`

---

## ⚙️ Konfiguration

### RLS-Policies prüfen

Die Migrationen erstellen automatisch RLS-Policies. Stellen Sie sicher, dass:

1. **Admins** können alle Agreements verwalten
2. **Öffentliche Benutzer** können nur "Unterzeichnete" Agreements sehen
3. **Authentifizierte Benutzer** können ihre eigenen Agreements sehen

### Platzhalter-Definitionen

Standard-Platzhalter werden automatisch erstellt:
- `{{ersteller.username}}` → E-Mail des Erstellers
- `{{ersteller.email}}` → E-Mail des Erstellers
- `{{empfaenger.username}}` → E-Mail des Empfängers
- `{{empfaenger.email}}` → E-Mail des Empfängers
- `{{datum.heute}}` → Aktuelles Datum
- `{{datum.jahr}}` → Aktuelles Jahr

Weitere Platzhalter können im Admin-Bereich hinzugefügt werden.

---

## 📝 Verwendung

### 1. Vereinbarungstitel erstellen

1. Gehen Sie zu `/admin`
2. Wählen Sie "Vereinbarungen"
3. Erstellen Sie einen neuen Vereinbarungstitel (z.B. "AGB", "Datenschutz")

### 2. Vereinbarung erstellen

1. Klicken Sie auf "Neue Vereinbarung"
2. Wählen Sie einen Titel
3. Geben Sie den HTML-Inhalt ein
4. Verwenden Sie Platzhalter wie `{{ersteller.email}}`
5. Speichern Sie die Vereinbarung

### 3. Menüpunkt mit Agreement verknüpfen

1. Gehen Sie zu "Menü bearbeiten"
2. Erstellen Sie einen neuen Menüpunkt oder bearbeiten Sie einen bestehenden
3. Wählen Sie im Dropdown "Mit Agreement verknüpfen" ein Agreement aus
4. Der Slug wird automatisch generiert
5. Die URL wird automatisch auf `/docs/<slug>` gesetzt
6. Speichern Sie den Menüpunkt

### 4. Vereinbarung im Frontend anzeigen

- Der Menüpunkt wird automatisch im Header angezeigt
- Beim Klick wird die Vereinbarung mit ersetzten Platzhaltern angezeigt
- PDF-Download ist verfügbar (wenn html2pdf.js installiert ist)

---

## 🔍 Troubleshooting

### Problem: Platzhalter werden nicht ersetzt

**Lösung:**
- Stellen Sie sicher, dass die Platzhalter-Definitionen in `t_platzhalter_definitionen` vorhanden sind
- Prüfen Sie, ob die User-Daten in `user_profiles` vorhanden sind
- Überprüfen Sie die Platzhalter-Syntax: `{{kontext.feld}}`

### Problem: Slug wird nicht generiert

**Lösung:**
- Prüfen Sie, ob der Database-Trigger `trigger_auto_generate_menu_slug` existiert
- Führen Sie die Migration `20251120000001_extend_menu_items_for_agreements.sql` erneut aus

### Problem: PDF-Generierung funktioniert nicht

**Lösung:**
- Installieren Sie `html2pdf.js`: `npm install html2pdf.js`
- Prüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass der Content-Bereich (`#agreement-content`) vorhanden ist

### Problem: Menüpunkt wird nicht angezeigt

**Lösung:**
- Prüfen Sie, ob `is_active = true` ist
- Prüfen Sie die `required_role` (öffentlich, Benutzer, Admin)
- Stellen Sie sicher, dass der Benutzer die entsprechende Rolle hat

### Problem: RLS-Policy-Fehler

**Lösung:**
- Stellen Sie sicher, dass Sie als Admin eingeloggt sind
- Prüfen Sie die RLS-Policies in Supabase Dashboard
- Überprüfen Sie, ob `admin_users` Tabelle korrekt befüllt ist

---

## 📚 Weitere Informationen

- **API-Dokumentation:** Siehe `agreement.service.ts` für alle verfügbaren Funktionen
- **Datenbank-Schema:** Siehe Migration-Dateien für vollständige Tabellenstruktur
- **Platzhalter-System:** Siehe `replacePlaceholdersInContent()` Funktion

---

## ✅ Checkliste nach Installation

- [ ] Migrationen erfolgreich ausgeführt
- [ ] Admin-Bereich zeigt "Vereinbarungen" Menüpunkt
- [ ] Vereinbarungstitel können erstellt werden
- [ ] Vereinbarungen können erstellt werden
- [ ] Platzhalter können eingefügt werden
- [ ] Menüpunkte können mit Agreements verknüpft werden
- [ ] Slug wird automatisch generiert
- [ ] Dokumente werden im Frontend angezeigt
- [ ] Platzhalter werden ersetzt
- [ ] PDF-Download funktioniert (optional)

---

**Ende der Installationsanleitung**

