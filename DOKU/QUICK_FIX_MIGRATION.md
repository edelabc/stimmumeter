# 🚨 SCHNELLFIX: Migrationen ausführen

**Problem:** Die Tabellen `t_vereinbarungen` und `t_vereinbarungstitel` existieren nicht (404-Fehler)

**Lösung:** Führen Sie die Migrationen in Supabase aus

---

## ⚡ Schnellanleitung (2 Minuten)

### Schritt 1: Supabase Dashboard öffnen
1. Gehen Sie zu: https://supabase.com/dashboard
2. Wählen Sie Ihr Projekt aus (apacsqcodgyohiebjhjb)

### Schritt 2: SQL Editor öffnen
1. Klicken Sie im linken Menü auf **"SQL Editor"**
2. Klicken Sie auf **"New query"**

### Schritt 3: Migration ausführen
1. Öffnen Sie die Datei: `AGREEMENTS_MIGRATION_COMPLETE.sql` (im Projekt-Root)
2. **Kopieren Sie den GESAMTEN Inhalt** der Datei
3. **Fügen Sie ihn in den SQL Editor ein**
4. Klicken Sie auf **"Run"** (oder drücken Sie `Ctrl+Enter` / `Cmd+Enter`)
5. Warten Sie auf die Meldung **"Success"**

### Schritt 4: Seite neu laden
1. Gehen Sie zurück zu Ihrer Anwendung: http://localhost:5173/admin
2. Drücken Sie `F5` oder `Ctrl+R` / `Cmd+R` zum Neuladen
3. Der Fehler sollte verschwunden sein!

---

## ✅ Erfolgsprüfung

Nach der Migration sollten Sie sehen:

1. ✅ Keine 404-Fehler mehr in der Browser-Konsole
2. ✅ Im Admin-Bereich den Menüpunkt "Vereinbarungen"
3. ✅ Vereinbarungen können erstellt werden

---

## 🔍 Falls Fehler auftreten

### Fehler: "relation already exists"
- **Das ist OK!** Die Tabellen existieren bereits. Die Migration ist idempotent.

### Fehler: "permission denied"
- Stellen Sie sicher, dass Sie als Admin eingeloggt sind
- Prüfen Sie, ob die `admin_users` Tabelle existiert

### Fehler: "foreign key constraint"
- Stellen Sie sicher, dass die erste Migration vollständig durchgelaufen ist
- Führen Sie die Migration erneut aus (sie ist idempotent)

---

**Nach erfolgreicher Migration sollte alles funktionieren!** 🎉

