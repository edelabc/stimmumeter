# 📤 FileZilla - Schnellanleitung

## 🚀 In 5 Schritten online

### Schritt 1: FileZilla installieren
👉 **https://filezilla-project.org** → Download → Installieren

---

### Schritt 2: Verbinden

**Oben in FileZilla eingeben:**
```
Host: ftp.ihre-domain.de
Username: ihr-benutzername
Password: ihr-passwort
Port: 21
```

→ Klicken Sie auf **"Quickconnect"**

---

### Schritt 3: Ordner finden

**Links (Ihr PC):**
Navigieren Sie zu:
```
/Applications/XAMPP/xamppfiles/htdocs/stimmumeter/dist
```

**Rechts (Server):**
Navigieren Sie zu:
```
public_html/     (oder www/)
```

---

### Schritt 4: Dateien hochladen

**Links auswählen:**
- ✅ `index.html`
- ✅ `assets/` Ordner
- ✅ `_redirects`

**Ziehen Sie** die Dateien von **links nach rechts**

Warten Sie, bis der Upload fertig ist! ✅

---

### Schritt 5: Fertig!

Öffnen Sie: **`https://ihre-domain.de`**

✅ **Website ist online!**

---

## ⚙️ Zusätzlich: config.production.php

1. **Links:** Gehen Sie zum Hauptverzeichnis
2. **Suchen Sie** `config.production.php`
3. **Ziehen Sie** sie nach rechts
4. **Rechtsklick** → "View/Edit"
5. **Passen Sie** die Datenbank-Credentials an
6. **Speichern** → "Yes" zum Upload

---

## 🆘 Probleme?

**"Connection refused"**  
→ Host/User/Passwort prüfen

**"404 Not Found"**  
→ `.htaccess` hochladen

**"Umgebungsvariablen nicht gefunden"**  
→ `.env.production` erstellen und hochladen

---

**Das war's!** 🎉

