# 🚀 Agreements-Modul - Migrationen ausführen

**Wichtig:** Diese Migrationen müssen in Supabase ausgeführt werden, bevor das Modul verwendet werden kann.

---

## 📋 Option 1: Supabase Dashboard (Empfohlen)

### Schritt 1: Supabase Dashboard öffnen
1. Gehen Sie zu [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Wählen Sie Ihr Stimmumeter-Projekt aus
3. Klicken Sie auf **"SQL Editor"** im linken Menü

### Schritt 2: Erste Migration ausführen
1. Öffnen Sie die Datei: `supabase/migrations/20251120000000_create_agreements_system.sql`
2. Kopieren Sie den **gesamten Inhalt** der Datei
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"** oder drücken Sie `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
5. Warten Sie auf die Bestätigung "Success"

### Schritt 3: Zweite Migration ausführen
1. Öffnen Sie die Datei: `supabase/migrations/20251120000001_extend_menu_items_for_agreements.sql`
2. Kopieren Sie den **gesamten Inhalt** der Datei
3. Fügen Sie ihn in den SQL Editor ein
4. Klicken Sie auf **"Run"**
5. Warten Sie auf die Bestätigung "Success"

### Schritt 4: Überprüfung
Führen Sie diese Abfrage aus, um zu prüfen, ob die Tabellen erstellt wurden:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  't_vereinbarungstitel',
  't_vereinbarungen',
  't_vereinbarungs_logs',
  't_platzhalter_definitionen'
)
ORDER BY table_name;
```

Sie sollten 4 Tabellen sehen.

Prüfen Sie auch, ob die Menu-Items erweitert wurden:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'menu_items' 
AND column_name IN ('linked_agreement_id', 'slug', 'icon');
```

Sie sollten 3 Spalten sehen.

---

## 📋 Option 2: Supabase CLI

Wenn Sie Supabase CLI installiert haben:

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/stimmumeter
supabase db push
```

Dies führt alle ausstehenden Migrationen automatisch aus.

---

## ⚠️ Wichtige Hinweise

1. **Reihenfolge beachten:** Die Migrationen müssen in der richtigen Reihenfolge ausgeführt werden:
   - Zuerst: `20251120000000_create_agreements_system.sql`
   - Dann: `20251120000001_extend_menu_items_for_agreements.sql`

2. **Backup:** Erstellen Sie vor der Migration ein Backup Ihrer Datenbank (falls vorhandene Daten wichtig sind)

3. **Fehlerbehandlung:** Falls Fehler auftreten:
   - Prüfen Sie, ob alle Tabellen bereits existieren (Migration könnte bereits ausgeführt worden sein)
   - Prüfen Sie die Fehlermeldung genau
   - Die Migrationen verwenden `IF NOT EXISTS`, daher sind sie idempotent

---

## ✅ Nach erfolgreicher Migration

Nach der Migration sollten Sie:

1. ✅ Im Admin-Bereich den Menüpunkt "Vereinbarungen" sehen
2. ✅ Vereinbarungstitel erstellen können
3. ✅ Vereinbarungen erstellen können
4. ✅ Menüpunkte mit Agreements verknüpfen können

---

## 🔍 Troubleshooting

### Fehler: "relation already exists"
- **Lösung:** Die Tabelle existiert bereits. Das ist OK, die Migration ist idempotent.

### Fehler: "permission denied"
- **Lösung:** Stellen Sie sicher, dass Sie als Admin eingeloggt sind und die richtigen Berechtigungen haben.

### Fehler: "foreign key constraint"
- **Lösung:** Stellen Sie sicher, dass die erste Migration erfolgreich war, bevor Sie die zweite ausführen.

---

**Ende der Migrationsanleitung**

