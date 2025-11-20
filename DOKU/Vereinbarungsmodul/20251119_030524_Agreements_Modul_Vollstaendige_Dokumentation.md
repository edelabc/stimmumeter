# 📋 Agreements-Modul - Vollständige Dokumentation

**Erstellt am:** 19.11.2025, 03:05:24  
**Modul-URL:** `http://localhost:8081/agreements/`  
**Version:** 1.0.0

---

## 📑 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Datenbankstruktur](#datenbankstruktur)
4. [Backend-Implementierung](#backend-implementierung)
5. [Frontend-Implementierung](#frontend-implementierung)
6. [Platzhalter-System](#platzhalter-system)
7. [PDF-Generierung](#pdf-generierung)
8. [Versionsverwaltung](#versionsverwaltung)
9. [Styling & CSS](#styling--css)
10. [API-Dokumentation](#api-dokumentation)
11. [Installation & Setup](#installation--setup)
12. [Nachbau-Anleitung](#nachbau-anleitung)

---

## 📖 Übersicht

Das Agreements-Modul (Vereinbarungen) ermöglicht es Benutzern, rechtliche Vereinbarungen zu erstellen, zu verwalten, zu versionieren und als PDF zu exportieren. Das Modul unterstützt:

- ✅ CRUD-Operationen für Vereinbarungen
- ✅ Versionsverwaltung (mehrere Versionen einer Vereinbarung)
- ✅ Platzhalter-System für dynamische Inhalte
- ✅ PDF-Export mit Puppeteer
- ✅ Aktionsprotokollierung (Logging)
- ✅ Statusverwaltung (Entwurf, Unterzeichnet, Archiviert)
- ✅ Rich-Text-Editor (ReactQuill)

---

## 🏗️ Architektur

### Technologie-Stack

**Backend:**
- Node.js mit Express.js
- Sequelize ORM
- MySQL-Datenbank
- Puppeteer (PDF-Generierung)
- JWT-Authentifizierung

**Frontend:**
- React.js
- React Router (Navigation)
- React Bootstrap (UI-Komponenten)
- ReactQuill (Rich-Text-Editor)
- Axios (HTTP-Client)
- Redux (State Management)

### Verzeichnisstruktur

```
myn-club/
├── node-js-jwt-auth/                    # Backend
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── vereinbarung.controller.js
│   │   │   └── vereinbarungstitel.controller.js
│   │   ├── models/
│   │   │   ├── vereinbarung.model.js
│   │   │   ├── vereinbarungstitel.model.js
│   │   │   └── vereinbarungs_log.model.js
│   │   ├── routes/
│   │   │   ├── vereinbarung.routes.js
│   │   │   └── vereinbarungstitel.routes.js
│   │   └── models/
│   │       └── index.js                 # Model-Registrierung & Beziehungen
│   └── server.js                        # Route-Registrierung
│
└── react-redux-login-example/          # Frontend
    └── src/
        ├── components/
        │   ├── S8MyAgreements.js         # Übersichtsliste
        │   ├── VereinbarungErstellen.js # Erstellen
        │   ├── VereinbarungBearbeiten.js # Bearbeiten
        │   ├── VereinbarungDetail.js    # Detailansicht
        │   └── PlatzhalterAuswahlModal.js
        ├── services/
        │   └── vereinbarung.service.js  # API-Service
        └── App.js                       # Route-Definitionen
```

---

## 🗄️ Datenbankstruktur

### Tabelle: `t_vereinbarungen`

**Primärschlüssel:** `vereinbarung_id` (INTEGER, AUTO_INCREMENT)

| Feldname | Typ | Nullable | Beschreibung |
|----------|-----|----------|--------------|
| `vereinbarung_id` | INTEGER | NO | Primärschlüssel, Auto-Increment |
| `titel_id` | INTEGER | NO | Foreign Key zu `t_vereinbarungstitel.titel_id` |
| `inhalt` | TEXT('long') | NO | HTML-Inhalt der Vereinbarung (Rich-Text) |
| `ersteller_user_id` | INTEGER | NO | Foreign Key zu `users.id` (Ersteller) |
| `empfaenger_user_id` | INTEGER | NO | Foreign Key zu `users.id` (Empfänger) |
| `status` | STRING | YES | Status: 'Entwurf', 'Unterzeichnet', 'Archiviert' (Default: 'Entwurf') |
| `version` | INTEGER | NO | Versionsnummer (Default: 1) |
| `parent_vereinbarung_id` | INTEGER | YES | Foreign Key zu `t_vereinbarungen.vereinbarung_id` (für Versionierung) |
| `unterzeichnet_am` | DATE | YES | Datum der Unterschrift |
| `bearbeiter_von` | STRING | YES | Name des Bearbeiters (Von) |
| `bearbeiter_an` | STRING | YES | Name des Bearbeiters (An) |
| `kurze_zusammenfassung` | TEXT | YES | Kurze Zusammenfassung |
| `anlagen` | TEXT | YES | Liste der Anlagen |
| `unterzeichnungsdatum_ersteller` | DATE | YES | Unterschriftsdatum Ersteller |
| `unterzeichnungsdatum_empfaenger` | DATE | YES | Unterschriftsdatum Empfänger |
| `gueltigkeit_von` | DATE | YES | Gültigkeitsbeginn |
| `gueltigkeit_bis` | DATE | YES | Gültigkeitsende |
| `kuendigungsfrist_wert` | INTEGER | YES | Kündigungsfrist (Wert) |
| `kuendigungsfrist_einheit` | ENUM | YES | Kündigungsfrist (Einheit): 'Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre' |
| `createdAt` | DATE | NO | Erstellt am (automatisch) |
| `updatedAt` | DATE | NO | Aktualisiert am (automatisch) |

**Indizes:**
- PRIMARY KEY (`vereinbarung_id`)
- FOREIGN KEY (`titel_id`) REFERENCES `t_vereinbarungstitel`(`titel_id`)
- FOREIGN KEY (`ersteller_user_id`) REFERENCES `users`(`id`)
- FOREIGN KEY (`empfaenger_user_id`) REFERENCES `users`(`id`)
- FOREIGN KEY (`parent_vereinbarung_id`) REFERENCES `t_vereinbarungen`(`vereinbarung_id`)

---

### Tabelle: `t_vereinbarungstitel`

**Primärschlüssel:** `titel_id` (INTEGER, AUTO_INCREMENT)

| Feldname | Typ | Nullable | Beschreibung |
|----------|-----|----------|--------------|
| `titel_id` | INTEGER | NO | Primärschlüssel, Auto-Increment |
| `titel` | STRING | NO | Titel der Vereinbarung |
| `beschreibung` | TEXT | YES | Beschreibung des Titels |
| `erstellt_von_user_id` | INTEGER | NO | Foreign Key zu `users.id` |
| `createdAt` | DATE | NO | Erstellt am (automatisch) |
| `updatedAt` | DATE | NO | Aktualisiert am (automatisch) |

**Indizes:**
- PRIMARY KEY (`titel_id`)
- FOREIGN KEY (`erstellt_von_user_id`) REFERENCES `users`(`id`)

---

### Tabelle: `t_vereinbarungs_logs`

**Primärschlüssel:** `log_id` (INTEGER, AUTO_INCREMENT)

| Feldname | Typ | Nullable | Beschreibung |
|----------|-----|----------|--------------|
| `log_id` | INTEGER | NO | Primärschlüssel, Auto-Increment |
| `vereinbarung_id` | INTEGER | NO | Foreign Key zu `t_vereinbarungen.vereinbarung_id` |
| `user_id` | INTEGER | NO | Foreign Key zu `users.id` |
| `aktion` | STRING | NO | Aktionstyp (z.B. 'ERSTELLT', 'PDF_EXPORTIERT', 'NEUE_VERSION_ERSTELLT') |
| `details` | JSON | YES | Zusätzliche Details als JSON |
| `createdAt` | DATE | NO | Zeitstempel (automatisch) |

**Indizes:**
- PRIMARY KEY (`log_id`)
- FOREIGN KEY (`vereinbarung_id`) REFERENCES `t_vereinbarungen`(`vereinbarung_id`)
- FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)

---

### Tabelle: `t_platzhalter_definitionen`

**Primärschlüssel:** `platzhalter_id` (INTEGER, AUTO_INCREMENT)

| Feldname | Typ | Nullable | Beschreibung |
|----------|-----|----------|--------------|
| `platzhalter_id` | INTEGER | NO | Primärschlüssel, Auto-Increment |
| `platzhalter_schluessel` | STRING | NO | Platzhalter-Schlüssel (z.B. '{{ersteller.username}}') |
| `beschreibung` | TEXT | NO | Beschreibung des Platzhalters |
| `quell_tabelle` | STRING | NO | Quelltabelle (z.B. 'users', 't_ad') |
| `quell_spalte` | STRING | NO | Quellspalte (z.B. 'username', 'email') |
| `zulaessige_rollen` | JSON | NO | Array der erlaubten Rollen |
| `createdAt` | DATE | NO | Erstellt am (automatisch) |
| `updatedAt` | DATE | NO | Aktualisiert am (automatisch) |

**Indizes:**
- PRIMARY KEY (`platzhalter_id`)
- UNIQUE INDEX (`platzhalter_schluessel`)

---

### Datenbank-Beziehungen

```sql
-- Vereinbarungstitel -> User (Ersteller)
t_vereinbarungstitel.erstellt_von_user_id -> users.id

-- Vereinbarung -> Vereinbarungstitel
t_vereinbarungen.titel_id -> t_vereinbarungstitel.titel_id

-- Vereinbarung -> User (Ersteller)
t_vereinbarungen.ersteller_user_id -> users.id

-- Vereinbarung -> User (Empfänger)
t_vereinbarungen.empfaenger_user_id -> users.id

-- Vereinbarung -> Vereinbarung (Parent für Versionierung)
t_vereinbarungen.parent_vereinbarung_id -> t_vereinbarungen.vereinbarung_id

-- Vereinbarungs-Log -> Vereinbarung
t_vereinbarungs_logs.vereinbarung_id -> t_vereinbarungen.vereinbarung_id

-- Vereinbarungs-Log -> User
t_vereinbarungs_logs.user_id -> users.id
```

---

## 🔧 Backend-Implementierung

### 1. Model: `vereinbarung.model.js`

**Pfad:** `node-js-jwt-auth/app/models/vereinbarung.model.js`

```javascript
module.exports = (sequelize, Sequelize) => {
  const Vereinbarung = sequelize.define("t_vereinbarungen", {
    vereinbarung_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titel_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    inhalt: {
      type: Sequelize.TEXT('long'),
      allowNull: false
    },
    ersteller_user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    empfaenger_user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 'Entwurf'
    },
    version: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    parent_vereinbarung_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 't_vereinbarungen',
        key: 'vereinbarung_id'
      }
    },
    unterzeichnet_am: {
      type: Sequelize.DATE,
      allowNull: true
    },
    bearbeiter_von: {
      type: Sequelize.STRING,
      allowNull: true
    },
    bearbeiter_an: {
      type: Sequelize.STRING,
      allowNull: true
    },
    kurze_zusammenfassung: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    anlagen: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    unterzeichnungsdatum_ersteller: {
      type: Sequelize.DATE,
      allowNull: true
    },
    unterzeichnungsdatum_empfaenger: {
      type: Sequelize.DATE,
      allowNull: true
    },
    gueltigkeit_von: {
      type: Sequelize.DATE,
      allowNull: true
    },
    gueltigkeit_bis: {
      type: Sequelize.DATE,
      allowNull: true
    },
    kuendigungsfrist_wert: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    kuendigungsfrist_einheit: {
      type: Sequelize.ENUM('Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre'),
      allowNull: true
    }
  }, {
    freezeTableName: true
  });

  return Vereinbarung;
};
```

---

### 2. Model: `vereinbarungstitel.model.js`

**Pfad:** `node-js-jwt-auth/app/models/vereinbarungstitel.model.js`

```javascript
module.exports = (sequelize, Sequelize) => {
  const Vereinbarungstitel = sequelize.define("t_vereinbarungstitel", {
    titel_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    titel: {
      type: Sequelize.STRING,
      allowNull: false
    },
    beschreibung: {
      type: Sequelize.TEXT
    },
    erstellt_von_user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  });

  return Vereinbarungstitel;
};
```

---

### 3. Model: `vereinbarungs_log.model.js`

**Pfad:** `node-js-jwt-auth/app/models/vereinbarungs_log.model.js`

```javascript
module.exports = (sequelize, Sequelize) => {
  const VereinbarungsLog = sequelize.define("t_vereinbarungs_logs", {
    log_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vereinbarung_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    aktion: {
      type: Sequelize.STRING,
      allowNull: false
    },
    details: {
      type: Sequelize.JSON,
      allowNull: true
    }
  });

  return VereinbarungsLog;
};
```

---

### 4. Model-Beziehungen in `index.js`

**Pfad:** `node-js-jwt-auth/app/models/index.js`

```javascript
// Model-Registrierung
db.vereinbarungstitel = require("./vereinbarungstitel.model.js")(sequelize, Sequelize);
db.vereinbarungen = require("./vereinbarung.model.js")(sequelize, Sequelize);
db.vereinbarungs_logs = require("./vereinbarungs_log.model.js")(sequelize, Sequelize);

// Beziehungen definieren
// Vereinbarungstitel -> User
db.vereinbarungstitel.belongsTo(db.users, { 
    foreignKey: 'erstellt_von_user_id', 
    as: 'erstellt_von' 
});
db.users.hasMany(db.vereinbarungstitel, { 
    foreignKey: 'erstellt_von_user_id' 
});

// Vereinbarung -> Vereinbarungstitel
db.vereinbarungen.belongsTo(db.vereinbarungstitel, { 
    foreignKey: 'titel_id', 
    as: 'titel' 
});
db.vereinbarungstitel.hasMany(db.vereinbarungen, { 
    foreignKey: 'titel_id' 
});

// Vereinbarung -> User (Ersteller)
db.vereinbarungen.belongsTo(db.users, { 
    foreignKey: 'ersteller_user_id', 
    as: 'ersteller' 
});
db.users.hasMany(db.vereinbarungen, { 
    foreignKey: 'ersteller_user_id', 
    as: 'erstellte_vereinbarungen' 
});

// Vereinbarung -> User (Empfänger)
db.vereinbarungen.belongsTo(db.users, { 
    foreignKey: 'empfaenger_user_id', 
    as: 'empfaenger' 
});
db.users.hasMany(db.vereinbarungen, { 
    foreignKey: 'empfaenger_user_id', 
    as: 'empfangene_vereinbarungen' 
});

// Self-referencing für Versionierung
db.vereinbarungen.hasMany(db.vereinbarungen, { 
    as: 'versionen', 
    foreignKey: 'parent_vereinbarung_id' 
});
db.vereinbarungen.belongsTo(db.vereinbarungen, { 
    as: 'parent', 
    foreignKey: 'parent_vereinbarung_id' 
});

// Vereinbarung -> Logs
db.vereinbarungen.hasMany(db.vereinbarungs_logs, { 
    foreignKey: 'vereinbarung_id' 
});
db.vereinbarungs_logs.belongsTo(db.vereinbarungen, { 
    foreignKey: 'vereinbarung_id' 
});

// User -> Logs
db.users.hasMany(db.vereinbarungs_logs, { 
    foreignKey: 'user_id' 
});
db.vereinbarungs_logs.belongsTo(db.users, { 
    foreignKey: 'user_id' 
});
```

---

### 5. Controller: `vereinbarung.controller.js`

**Pfad:** `node-js-jwt-auth/app/controllers/vereinbarung.controller.js`

#### 5.1. `create` - Vereinbarung erstellen

```javascript
exports.create = (req, res) => {
    // Validierung
    if (!req.body.titel_id || !req.body.inhalt || !req.body.empfaenger_user_id) {
        return res.status(400).send({ 
            message: "Titel, Inhalt und Empfänger dürfen nicht leer sein!" 
        });
    }

    const neueVereinbarung = {
        titel_id: req.body.titel_id,
        inhalt: req.body.inhalt,
        empfaenger_user_id: req.body.empfaenger_user_id,
        ersteller_user_id: req.userId, // vom authJwt-Middleware
        bearbeiter_von: req.body.bearbeiter_von,
        bearbeiter_an: req.body.bearbeiter_an,
        kurze_zusammenfassung: req.body.kurze_zusammenfassung,
        anlagen: req.body.anlagen,
        gueltigkeit_von: req.body.gueltigkeit_von,
        gueltigkeit_bis: req.body.gueltigkeit_bis,
        kuendigungsfrist_wert: req.body.kuendigungsfrist_wert,
        kuendigungsfrist_einheit: req.body.kuendigungsfrist_einheit
    };

    Vereinbarung.create(neueVereinbarung)
        .then(data => { 
            res.status(201).send(data); 
        })
        .catch(err => { 
            res.status(500).send({ 
                message: err.message || "Fehler beim Erstellen der Vereinbarung." 
            }); 
        });
};
```

#### 5.2. `findAll` - Alle Vereinbarungen abrufen

```javascript
exports.findAll = (req, res) => {
    const userId = req.userId;
    Vereinbarung.findAll({
        where: {
            [Sequelize.Op.or]: [
                { ersteller_user_id: userId },
                { empfaenger_user_id: userId }
            ]
        },
        include: [
            { model: db.vereinbarungstitel, as: 'titel' },
            { model: db.users, as: 'ersteller', attributes: ['id', 'username', 'email'] },
            { model: db.users, as: 'empfaenger', attributes: ['id', 'username', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
    })
    .then(data => { res.send(data); })
    .catch(err => { 
        res.status(500).send({ 
            message: err.message || "Fehler beim Abrufen der Vereinbarungen." 
        }); 
    });
};
```

#### 5.3. `findOne` - Einzelne Vereinbarung mit Platzhalter-Ersetzung

```javascript
exports.findOne = async (req, res) => {
    const id = req.params.id;

    try {
        // Vereinbarung laden
        const vereinbarung = await Vereinbarung.findByPk(id, {
            include: [
                { model: db.vereinbarungstitel, as: 'titel' },
                { model: db.users, as: 'ersteller' },
                { model: db.users, as: 'empfaenger' }
            ]
        });

        if (!vereinbarung) {
            return res.status(404).send({ 
                message: `Vereinbarung mit ID=${id} nicht gefunden.` 
            });
        }

        let inhalt = vereinbarung.inhalt;
        const platzhalterRegex = /\{\{([^}]+)\}\}/g;
        const gefundeneSchluessel = [...inhalt.matchAll(platzhalterRegex)]
            .map(match => match[1].trim());

        if (gefundeneSchluessel.length === 0) {
            return res.send(vereinbarung);
        }

        // Platzhalter-Definitionen laden
        const definitionen = await PlatzhalterDefinition.findAll({
            where: { 
                platzhalter_schluessel: { 
                    [Sequelize.Op.in]: gefundeneSchluessel.map(s => `{{${s}}}`) 
                } 
            }
        });

        // Werte ersetzen
        const ersetzungen = {};
        for (const def of definitionen) {
            const schluessel = def.platzhalter_schluessel;
            const [kontext, feld] = schluessel.replace(/[{}]/g, '').trim().split('.');
            
            let quellObjekt = null;
            if (kontext === 'ersteller') quellObjekt = vereinbarung.ersteller;
            if (kontext === 'empfaenger') quellObjekt = vereinbarung.empfaenger;
            
            if (quellObjekt && quellObjekt[feld]) {
                ersetzungen[schluessel] = quellObjekt[feld];
            } else {
                ersetzungen[schluessel] = `[FEHLER: Wert für ${schluessel} nicht gefunden]`;
            }
        }
        
        // Platzhalter im Text ersetzen
        for (const [schluessel, wert] of Object.entries(ersetzungen)) {
            const regex = new RegExp(
                schluessel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 
                'g'
            );
            inhalt = inhalt.replace(regex, wert);
        }

        const result = vereinbarung.toJSON();
        result.inhalt = inhalt;
        
        res.send(result);

    } catch (err) {
        res.status(500).send({ 
            message: "Fehler beim Abrufen der Vereinbarung: " + err.message 
        });
    }
};
```

#### 5.4. `update` - Vereinbarung aktualisieren

```javascript
exports.update = (req, res) => {
    Vereinbarung.update(req.body, { 
        where: { vereinbarung_id: req.params.id } 
    })
    .then(num => {
        if (num == 1) {
            res.send({ message: "Vereinbarung erfolgreich aktualisiert." });
        } else {
            res.send({ 
                message: `Kann Vereinbarung mit ID=${req.params.id} nicht aktualisieren.` 
            });
        }
    })
    .catch(err => { 
        res.status(500).send({ 
            message: "Fehler beim Aktualisieren der Vereinbarung." 
        }); 
    });
};
```

#### 5.5. `delete` - Vereinbarung löschen

```javascript
exports.delete = (req, res) => {
    Vereinbarung.destroy({ 
        where: { vereinbarung_id: req.params.id } 
    })
    .then(num => {
        if (num == 1) {
            res.send({ message: "Vereinbarung erfolgreich gelöscht." });
        } else {
            res.send({ 
                message: `Kann Vereinbarung mit ID=${req.params.id} nicht löschen.` 
            });
        }
    })
    .catch(err => { 
        res.status(500).send({ 
            message: "Fehler beim Löschen der Vereinbarung." 
        }); 
    });
};
```

#### 5.6. `createVersion` - Neue Version erstellen

```javascript
exports.createVersion = async (req, res) => {
    const originalId = req.params.id;
    const userId = req.userId;

    try {
        const originalVereinbarung = await Vereinbarung.findByPk(originalId);
        if (!originalVereinbarung) {
            return res.status(404).send({ 
                message: "Die zu versionierende Vereinbarung wurde nicht gefunden." 
            });
        }

        const neueVersionDaten = {
            ...originalVereinbarung.toJSON(),
            ...req.body,
            vereinbarung_id: null,
            version: originalVereinbarung.version + 1,
            parent_vereinbarung_id: originalVereinbarung.parent_vereinbarung_id || originalId,
            status: 'Entwurf',
            unterzeichnet_am: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const neueVersion = await Vereinbarung.create(neueVersionDaten);

        // Alte Version archivieren
        originalVereinbarung.status = 'Archiviert';
        await originalVereinbarung.save();

        // Log erstellen
        await VereinbarungsLog.create({
            vereinbarung_id: neueVersion.vereinbarung_id,
            user_id: userId,
            aktion: 'NEUE_VERSION_ERSTELLT',
            details: {
                neue_version: neueVersion.version,
                archivierte_version: originalVereinbarung.version,
                original_id: originalId
            }
        });

        res.send(neueVersion);

    } catch (err) {
        res.status(500).send({ 
            message: "Fehler beim Erstellen der neuen Version: " + err.message 
        });
    }
};
```

#### 5.7. `downloadPdf` - PDF generieren

```javascript
exports.downloadPdf = async (req, res) => {
    const id = req.params.id;
    const userId = req.userId;
    let browser;

    try {
        // Vereinbarung laden
        const vereinbarung = await Vereinbarung.findByPk(id, {
            include: [
                { model: db.users, as: 'ersteller' }, 
                { model: db.users, as: 'empfaenger' }
            ]
        });

        if (!vereinbarung) {
            return res.status(404).send({ 
                message: `Vereinbarung mit ID=${id} nicht gefunden.` 
            });
        }

        // Platzhalter ersetzen (gleiche Logik wie in findOne)
        let inhalt = vereinbarung.inhalt;
        // ... Platzhalter-Ersetzung ...

        // Puppeteer starten
        browser = await puppeteer.launch({ 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page { size: A4; }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 11pt;
                        line-height: 1.2;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }
                    /* Weitere Styles... */
                </style>
            </head>
            <body>
                ${inhalt}
            </body>
            </html>
        `, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '15mm',
                left: '15mm',
                right: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `...`,
            footerTemplate: `...`
        });

        // Log erstellen
        await VereinbarungsLog.create({
            vereinbarung_id: id,
            user_id: userId,
            aktion: 'PDF_EXPORTIERT',
        });

        // PDF senden
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="vereinbarung_${id}_v${vereinbarung.version}.pdf"`
        });
        res.end(pdfBuffer);

    } catch (err) {
        res.status(500).send({ 
            message: "Fehler beim Erstellen der PDF: " + err.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
```

#### 5.8. `getVersionHistory` - Versionshistorie abrufen

```javascript
exports.getVersionHistory = async (req, res) => {
    const { id } = req.params;

    try {
        const currentAgreement = await Vereinbarung.findByPk(id, { 
            attributes: ['vereinbarung_id', 'parent_vereinbarung_id'] 
        });
        if (!currentAgreement) {
            return res.status(404).send({ 
                message: "Vereinbarung nicht gefunden." 
            });
        }

        const rootId = currentAgreement.parent_vereinbarung_id || 
                      currentAgreement.vereinbarung_id;

        const history = await Vereinbarung.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { vereinbarung_id: rootId },
                    { parent_vereinbarung_id: rootId }
                ]
            },
            attributes: ['vereinbarung_id', 'version', 'status', 'createdAt'],
            order: [['version', 'DESC']]
        });

        res.status(200).send(history);
    } catch (err) {
        res.status(500).send({ 
            message: "Fehler beim Abrufen der Versionshistorie: " + err.message 
        });
    }
};
```

#### 5.9. `getAgreementLog` - Aktionsprotokoll abrufen

```javascript
exports.getAgreementLog = async (req, res) => {
    const { id } = req.params;

    try {
        const logs = await db.vereinbarungs_logs.findAll({
            where: { vereinbarung_id: id },
            include: [{
                model: db.users,
                attributes: ['username']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).send(logs);
    } catch (err) {
        res.status(500).send({ 
            message: "Fehler beim Abrufen des Protokolls: " + err.message 
        });
    }
};
```

---

### 6. Routes: `vereinbarung.routes.js`

**Pfad:** `node-js-jwt-auth/app/routes/vereinbarung.routes.js`

```javascript
const { authJwt } = require("../middleware");
const controller = require("../controllers/vereinbarung.controller.js");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // Vereinbarungen erstellen und abrufen (Liste)
    app.route("/api/test/vereinbarungen")
        .post([authJwt.verifyToken], controller.create)
        .get([authJwt.verifyToken], controller.findAll);

    // Einzelne Vereinbarung abrufen, aktualisieren, löschen
    app.route("/api/test/vereinbarungen/:id")
        .get([authJwt.verifyToken], controller.findOne)
        .put([authJwt.verifyToken], controller.update)
        .delete([authJwt.verifyToken], controller.delete);

    // Route zum Erstellen einer neuen Version
    app.post(
        "/api/test/vereinbarungen/:id/version",
        [authJwt.verifyToken],
        controller.createVersion
    );

    // Route für den PDF-Download
    app.get(
        "/api/test/vereinbarungen/:id/pdf",
        [authJwt.verifyToken],
        controller.downloadPdf
    );

    // Route zum Abrufen der Versionshistorie
    app.get(
        "/api/test/vereinbarungen/:id/history",
        [authJwt.verifyToken],
        controller.getVersionHistory
    );

    // Route zum Abrufen des Aktionsprotokolls
    app.get(
        "/api/test/vereinbarungen/:id/log",
        [authJwt.verifyToken],
        controller.getAgreementLog
    );
};
```

---

### 7. Route-Registrierung in `server.js`

**Pfad:** `node-js-jwt-auth/server.js`

```javascript
// Vereinbarungen-Routen registrieren
require("./app/routes/vereinbarung.routes.js")(app);
require("./app/routes/vereinbarungstitel.routes.js")(app);
require("./app/routes/platzhalter.routes.js")(app);
require("./app/routes/platzhalter-sync.routes.js")(app);
```

---

## 🎨 Frontend-Implementierung

### 1. Service: `vereinbarung.service.js`

**Pfad:** `react-redux-login-example/src/services/vereinbarung.service.js`

```javascript
import axios from "axios";
import authHeader from "./auth-header";

const API_URL = process.env.REACT_APP_API_URL;

// Alle Vereinbarungen abrufen
const getAllAgreements = () => {
    return axios.get(API_URL + "vereinbarungen", { 
        headers: authHeader() 
    });
};

// Einzelne Vereinbarung abrufen
const getAgreementById = (id) => {
    return axios.get(API_URL + `vereinbarungen/${id}`, { 
        headers: authHeader() 
    });
};

// Vereinbarung erstellen
const createAgreement = (data) => {
    return axios.post(API_URL + "vereinbarungen", data, { 
        headers: authHeader() 
    });
};

// Vereinbarung aktualisieren
const updateAgreement = (id, data) => {
    return axios.put(API_URL + `vereinbarungen/${id}`, data, { 
        headers: authHeader() 
    });
};

// Vereinbarung löschen
const deleteAgreement = (id) => {
    return axios.delete(API_URL + `vereinbarungen/${id}`, { 
        headers: authHeader() 
    });
};

// Neue Version erstellen
const createAgreementVersion = (id, data) => {
    return axios.post(API_URL + `vereinbarungen/${id}/version`, data, { 
        headers: authHeader() 
    });
};

// PDF herunterladen
const downloadAgreementPdf = (id) => {
    return axios.get(API_URL + `vereinbarungen/${id}/pdf`, {
        headers: authHeader(),
        responseType: 'blob'
    });
};

// Versionshistorie abrufen
const getAgreementHistory = (id) => {
    return axios.get(API_URL + `vereinbarungen/${id}/history`, { 
        headers: authHeader() 
    });
};

// Aktionsprotokoll abrufen
const getAgreementLog = (id) => {
    return axios.get(API_URL + `vereinbarungen/${id}/log`, { 
        headers: authHeader() 
    });
};

// Vereinbarungstitel abrufen
const getAllAgreementTitles = () => {
    return axios.get(API_URL + "vereinbarungstitel", { 
        headers: authHeader() 
    });
};

// Platzhalter abrufen
const getAllPlaceholders = (params) => {
    return axios.get(API_URL + "platzhalter", { 
        headers: authHeader(), 
        params 
    });
};

// Platzhalter-Kategorien abrufen
const getPlaceholderCategories = () => {
    return axios.get(API_URL + "platzhalter/categories", { 
        headers: authHeader() 
    });
};

const VereinbarungService = {
    getAllAgreements,
    getAgreementById,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    createAgreementVersion,
    downloadAgreementPdf,
    getAgreementHistory,
    getAgreementLog,
    getAllAgreementTitles,
    getAllPlaceholders,
    getPlaceholderCategories
};

export default VereinbarungService;
```

---

### 2. Komponente: `S8MyAgreements.js` (Übersichtsliste)

**Pfad:** `react-redux-login-example/src/components/S8MyAgreements.js`

**Funktionalität:**
- Zeigt alle Vereinbarungen des aktuellen Benutzers (als Ersteller oder Empfänger)
- Status-Badges (Entwurf, Unterzeichnet, Archiviert)
- Aktionen: Details anzeigen, Bearbeiten, Löschen
- Button zum Erstellen einer neuen Vereinbarung

**Wichtige Code-Abschnitte:**

```javascript
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Container, Table, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { useSelector } from "react-redux";
import VereinbarungService from "../services/vereinbarung.service";

const S8MyAgreements = () => {
    const [agreements, setAgreements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { user: currentUser } = useSelector((state) => state.auth);

    useEffect(() => {
        setLoading(true);
        VereinbarungService.getAllAgreements()
            .then(response => {
                setAgreements(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message);
                setLoading(false);
            });
    }, []);

    const handleDelete = (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diese Vereinbarung löschen möchten?')) {
            VereinbarungService.deleteAgreement(id)
                .then(() => {
                    setAgreements(agreements.filter(
                        agreement => agreement.vereinbarung_id !== id
                    ));
                })
                .catch(err => {
                    setError(err.response?.data?.message || "Fehler beim Löschen.");
                });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Entwurf':
                return <Badge bg="secondary">Entwurf</Badge>;
            case 'Unterzeichnet':
                return <Badge bg="success">Unterzeichnet</Badge>;
            case 'Archiviert':
                return <Badge bg="warning" text="dark">Archiviert</Badge>;
            default:
                return <Badge bg="info">{status}</Badge>;
        }
    };

    return (
        <Container>
            <div className="d-flex justify-content-between align-items-center my-3">
                <h1>Meine Vereinbarungen</h1>
                <Button as={Link} to="/agreements/new" variant="success">
                    + Neue Vereinbarung
                </Button>
            </div>
            {/* Tabelle mit Vereinbarungen */}
        </Container>
    );
};

export default S8MyAgreements;
```

---

### 3. Komponente: `VereinbarungErstellen.js`

**Pfad:** `react-redux-login-example/src/components/VereinbarungErstellen.js`

**Funktionalität:**
- Formular zum Erstellen einer neuen Vereinbarung
- Rich-Text-Editor (ReactQuill)
- Platzhalter-Auswahl-Modal
- Validierung der Pflichtfelder

**Wichtige Code-Abschnitte:**

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Spinner, Alert, Card, Row, Col } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import VereinbarungService from '../services/vereinbarung.service';
import PlatzhalterAuswahlModal from './PlatzhalterAuswahlModal';

const VereinbarungErstellen = () => {
    const [titelId, setTitelId] = useState('');
    const [partnerId, setPartnerId] = useState('');
    const [inhalt, setInhalt] = useState('');
    const [bearbeiterVon, setBearbeiterVon] = useState('');
    const [bearbeiterAn, setBearbeiterAn] = useState('');
    const [zusammenfassung, setZusammenfassung] = useState('');
    const [anlagen, setAnlagen] = useState('');
    const [gueltigkeitVon, setGueltigkeitVon] = useState('');
    const [gueltigkeitBis, setGueltigkeitBis] = useState('');
    const [kuendigungsfristWert, setKuendigungsfristWert] = useState('');
    const [kuendigungsfristEinheit, setKuendigungsfristEinheit] = useState('Tag(e)');
    const [titelList, setTitelList] = useState([]);
    const [partnerList, setPartnerList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalShow, setModalShow] = useState(false);
    const quillRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            VereinbarungService.getAllAgreementTitles(),
            UserService.getAllAds({ page: 1, search: '', sort: 'company_name', order: 'asc' })
        ])
        .then(([titelResponse, partnerResponse]) => {
            setTitelList(titelResponse.data);
            setPartnerList(partnerResponse.data.ads);
            setLoading(false);
        })
        .catch(err => {
            setError("Fehler beim Laden der Formulardaten.");
            setLoading(false);
        });
    }, []);

    const handleSelectPlaceholder = (placeholderKey) => {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.insertText(range.index, placeholderKey, 'user');
    };

    const handleSave = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!titelId || !partnerId || !inhalt) {
            setError("Bitte füllen Sie die Pflichtfelder aus.");
            return;
        }

        setSubmitting(true);
        
        const data = {
            titel_id: titelId,
            empfaenger_user_id: partnerId,
            inhalt: inhalt,
            bearbeiter_von: bearbeiterVon,
            bearbeiter_an: bearbeiterAn,
            kurze_zusammenfassung: zusammenfassung,
            anlagen: anlagen,
            gueltigkeit_von: gueltigkeitVon || null,
            gueltigkeit_bis: gueltigkeitBis || null,
            kuendigungsfrist_wert: kuendigungsfristWert || null,
            kuendigungsfrist_einheit: kuendigungsfristWert ? kuendigungsfristEinheit : null
        };

        VereinbarungService.createAgreement(data)
            .then(() => {
                setSuccess("Vereinbarung erfolgreich erstellt!");
                setTimeout(() => {
                    navigate('/agreements');
                }, 2000);
            })
            .catch(err => {
                setError(err.response?.data?.message || "Ein Fehler ist aufgetreten.");
                setSubmitting(false);
            });
    };

    // Styles (siehe vollständige Datei)
    const styles = { /* ... */ };

    return (
        <div style={styles.pageContainer}>
            <Container style={styles.mainContainer}>
                <h1 style={styles.header}>✨ Neue Vereinbarung erstellen</h1>
                <Card style={styles.mainCard}>
                    {/* Formular */}
                </Card>
            </Container>
            <PlatzhalterAuswahlModal 
                show={modalShow}
                onHide={() => setModalShow(false)}
                onSelectPlaceholder={handleSelectPlaceholder}
            />
        </div>
    );
};

export default VereinbarungErstellen;
```

---

### 4. Komponente: `VereinbarungBearbeiten.js`

**Pfad:** `react-redux-login-example/src/components/VereinbarungBearbeiten.js`

**Funktionalität:**
- Formular zum Bearbeiten einer bestehenden Vereinbarung
- Lädt vorhandene Daten
- Status kann geändert werden
- Gleiche Felder wie beim Erstellen

**Unterschiede zu VereinbarungErstellen:**
- Lädt Daten beim Mount (`useEffect` mit `id` aus `useParams`)
- Verwendet `updateAgreement` statt `createAgreement`
- Zeigt aktuellen Status an

---

### 5. Komponente: `VereinbarungDetail.js`

**Pfad:** `react-redux-login-example/src/components/VereinbarungDetail.js`

**Funktionalität:**
- Zeigt Details einer Vereinbarung
- Platzhalter sind bereits ersetzt
- PDF-Download-Button
- Versionshistorie-Tab
- Aktionsprotokoll-Tab

**Wichtige Code-Abschnitte:**

```javascript
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Spinner, Alert, Row, Col, Badge, Tabs, Tab, Table } from 'react-bootstrap';
import VereinbarungService from '../services/vereinbarung.service';

const VereinbarungDetail = () => {
    const { id } = useParams();
    const [agreement, setAgreement] = useState(null);
    const [history, setHistory] = useState([]);
    const [log, setLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            VereinbarungService.getAgreementById(id),
            VereinbarungService.getAgreementHistory(id),
            VereinbarungService.getAgreementLog(id)
        ]).then(([agreementRes, historyRes, logRes]) => {
            setAgreement(agreementRes.data);
            setHistory(historyRes.data);
            setLog(logRes.data);
            setLoading(false);
        }).catch(error => {
            setError(error.message);
            setLoading(false);
        });
    }, [id]);

    const handleDownloadPdf = () => {
        VereinbarungService.downloadAgreementPdf(id)
            .then(response => {
                const pdfBlob = response.data instanceof Blob 
                    ? response.data 
                    : new Blob([new Uint8Array(Object.values(response.data))], { 
                        type: 'application/pdf' 
                    });
                
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `vereinbarung_${id}_v${agreement?.version || 'unbekannt'}.pdf`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                setError(err.response?.data?.message || "Fehler beim PDF-Download.");
            });
    };

    return (
        <Container>
            {/* Header mit Buttons */}
            {/* Details-Card */}
            {/* Inhalt-Card */}
            {/* Versionshistorie & Protokoll-Tabs */}
        </Container>
    );
};

export default VereinbarungDetail;
```

---

### 6. Komponente: `PlatzhalterAuswahlModal.js`

**Pfad:** `react-redux-login-example/src/components/PlatzhalterAuswahlModal.js`

**Funktionalität:**
- Modal zum Auswählen von Platzhaltern
- Suche nach Platzhaltern
- Kategorie-Filter
- Paginierung

**Wichtige Code-Abschnitte:**

```javascript
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Badge, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import VereinbarungService from '../services/vereinbarung.service';

const PlatzhalterAuswahlModal = ({ show, onHide, onSelectPlaceholder }) => {
    const [placeholders, setPlaceholders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        if (show) {
            setLoading(true);
            const params = { 
                page: currentPage, 
                size: 10, 
                search: debouncedSearchTerm, 
                category: selectedCategory 
            };
            VereinbarungService.getAllPlaceholders(params)
                .then(response => {
                    setPlaceholders(response.data.placeholders);
                    setTotalPages(response.data.totalPages);
                })
                .catch(err => setError('Platzhalter konnten nicht geladen werden.'))
                .finally(() => setLoading(false));
        }
    }, [show, currentPage, debouncedSearchTerm, selectedCategory]);

    const handleSelectItem = (key) => {
        onSelectPlaceholder(key);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header>
                <Modal.Title>🏷️ Platzhalter auswählen</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control 
                    type="text" 
                    placeholder="Suchen..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                {/* Kategorien */}
                {/* Platzhalter-Liste */}
            </Modal.Body>
            <Modal.Footer>
                {/* Paginierung */}
                <Button variant="secondary" onClick={onHide}>Schließen</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PlatzhalterAuswahlModal;
```

---

### 7. Route-Definitionen in `App.js`

**Pfad:** `react-redux-login-example/src/App.js`

```javascript
import S8MyAgreements from "./components/S8MyAgreements";
import VereinbarungErstellen from "./components/VereinbarungErstellen";
import VereinbarungBearbeiten from "./components/VereinbarungBearbeiten";
import VereinbarungDetail from "./components/VereinbarungDetail";

// In der Routes-Komponente:
<Route path="/agreements" element={<S8MyAgreements />} />
<Route path="/agreements/new" element={<VereinbarungErstellen />} />
<Route path="/agreements/:id/edit" element={<VereinbarungBearbeiten />} />
<Route path="/agreements/:id" element={<VereinbarungDetail />} />
```

---

## 🏷️ Platzhalter-System

### Funktionsweise

1. **Platzhalter-Format:** `{{kontext.feld}}`
   - Beispiel: `{{ersteller.username}}`, `{{empfaenger.email}}`

2. **Ersetzung im Backend:**
   - Beim Abrufen einer Vereinbarung (`findOne`) werden Platzhalter durch echte Werte ersetzt
   - Platzhalter werden aus der Tabelle `t_platzhalter_definitionen` geladen
   - Werte werden aus den verknüpften Objekten (ersteller, empfaenger) geholt

3. **Platzhalter-Definitionen:**
   - Werden in `t_platzhalter_definitionen` gespeichert
   - Enthalten: Schlüssel, Beschreibung, Quelltabelle, Quellspalte, erlaubte Rollen

4. **Synchronisierung:**
   - Platzhalter können automatisch aus Datenbankstruktur synchronisiert werden
   - Endpoint: `POST /api/test/platzhalter/synchronize`

---

## 📄 PDF-Generierung

### Technologie

- **Puppeteer:** Headless-Browser für PDF-Generierung
- **Format:** A4
- **Header/Footer:** Dynamisch mit Vereinbarungsnummer, Titel, Datum, Seitenzahl

### PDF-Styles

```css
@page {
    size: A4;
}
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    line-height: 1.2;
    color: #333;
    margin: 0;
    padding: 20px;
}
h1 {
    color: #2c3e50;
    font-size: 18pt;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid #3498db;
}
/* Weitere Styles... */
```

### PDF-Margins

- Top: 20mm
- Bottom: 15mm
- Left: 15mm
- Right: 15mm

---

## 📚 Versionsverwaltung

### Funktionsweise

1. **Erste Version:**
   - `version = 1`
   - `parent_vereinbarung_id = NULL`

2. **Neue Version erstellen:**
   - Kopiert alle Daten der Original-Vereinbarung
   - Erhöht `version` um 1
   - Setzt `parent_vereinbarung_id` auf die erste Version der Kette
   - Setzt Status auf 'Entwurf'
   - Archiviert die alte Version (Status = 'Archiviert')

3. **Versionshistorie:**
   - Alle Versionen einer Vereinbarung werden über `parent_vereinbarung_id` verknüpft
   - Abruf über `getVersionHistory` gibt alle Versionen zurück

---

## 🎨 Styling & CSS

### Inline-Styles in Komponenten

Die Komponenten verwenden hauptsächlich **Inline-Styles** (JavaScript-Objekte) statt separater CSS-Dateien.

**Beispiel aus VereinbarungErstellen.js:**

```javascript
const styles = {
    pageContainer: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        paddingTop: '40px',
        paddingBottom: '60px'
    },
    mainContainer: {
        maxWidth: '1200px',
        margin: '0 auto'
    },
    header: {
        color: '#ffffff',
        fontSize: '42px',
        fontWeight: '700',
        marginBottom: '40px',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        letterSpacing: '-0.5px'
    },
    mainCard: {
        borderRadius: '25px',
        border: 'none',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        background: '#ffffff'
    },
    cardHeader: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '25px 35px',
        borderBottom: 'none'
    },
    cardBody: {
        padding: '40px 35px',
        background: '#ffffff'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#667eea',
        marginBottom: '25px',
        marginTop: '35px',
        paddingBottom: '10px',
        borderBottom: '2px solid #f0f2ff',
        display: 'flex',
        alignItems: 'center'
    },
    formControl: {
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        padding: '12px 16px',
        fontSize: '15px',
        transition: 'all 0.3s ease',
        backgroundColor: '#f7fafc'
    },
    submitButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        padding: '14px 40px',
        fontSize: '16px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease',
        marginTop: '30px'
    }
    // ... weitere Styles
};
```

### Farbpalette

- **Primärfarbe:** `#667eea` (Lila-Blau)
- **Sekundärfarbe:** `#764ba2` (Lila)
- **Erfolg:** `#27ae60` (Grün)
- **Warnung:** `#f39c12` (Orange)
- **Fehler:** `#e53e3e` (Rot)
- **Hintergrund:** `#f7fafc` (Hellgrau)

### ReactQuill-Editor

- **Theme:** `snow`
- **Minimale Höhe:** 300px
- **Container:** Abgerundete Ecken, Border, Hintergrundfarbe

---

## 📡 API-Dokumentation

### Base URL

```
http://localhost:8080/api/test
```

### Authentifizierung

Alle Endpoints erfordern JWT-Token im Header:
```
x-access-token: <JWT_TOKEN>
```

---

### Endpoints

#### 1. Vereinbarungen erstellen

**POST** `/vereinbarungen`

**Request Body:**
```json
{
  "titel_id": 1,
  "empfaenger_user_id": 2,
  "inhalt": "<p>Vereinbarungstext mit {{ersteller.username}}</p>",
  "bearbeiter_von": "Max Mustermann",
  "bearbeiter_an": "Anna Schmidt",
  "kurze_zusammenfassung": "Zusammenfassung",
  "anlagen": "Anlage 1\nAnlage 2",
  "gueltigkeit_von": "2025-01-01",
  "gueltigkeit_bis": "2025-12-31",
  "kuendigungsfrist_wert": 3,
  "kuendigungsfrist_einheit": "Monat(e)"
}
```

**Response:** `201 Created`
```json
{
  "vereinbarung_id": 1,
  "titel_id": 1,
  "inhalt": "...",
  "status": "Entwurf",
  "version": 1,
  ...
}
```

---

#### 2. Alle Vereinbarungen abrufen

**GET** `/vereinbarungen`

**Response:** `200 OK`
```json
[
  {
    "vereinbarung_id": 1,
    "titel": { "titel": "Mietvertrag" },
    "ersteller": { "id": 1, "username": "user1" },
    "empfaenger": { "id": 2, "username": "user2" },
    "status": "Entwurf",
    "version": 1,
    ...
  }
]
```

---

#### 3. Einzelne Vereinbarung abrufen

**GET** `/vereinbarungen/:id`

**Response:** `200 OK`
```json
{
  "vereinbarung_id": 1,
  "titel": { "titel": "Mietvertrag" },
  "inhalt": "<p>Vereinbarungstext mit user1</p>", // Platzhalter ersetzt
  "ersteller": { "id": 1, "username": "user1", "email": "user1@example.com" },
  "empfaenger": { "id": 2, "username": "user2", "email": "user2@example.com" },
  "status": "Entwurf",
  "version": 1,
  ...
}
```

---

#### 4. Vereinbarung aktualisieren

**PUT** `/vereinbarungen/:id`

**Request Body:** (gleiche Struktur wie beim Erstellen)

**Response:** `200 OK`
```json
{
  "message": "Vereinbarung erfolgreich aktualisiert."
}
```

---

#### 5. Vereinbarung löschen

**DELETE** `/vereinbarungen/:id`

**Response:** `200 OK`
```json
{
  "message": "Vereinbarung erfolgreich gelöscht."
}
```

---

#### 6. Neue Version erstellen

**POST** `/vereinbarungen/:id/version`

**Request Body:** (optional, überschreibt Felder der Original-Vereinbarung)

**Response:** `200 OK`
```json
{
  "vereinbarung_id": 2,
  "version": 2,
  "parent_vereinbarung_id": 1,
  "status": "Entwurf",
  ...
}
```

---

#### 7. PDF herunterladen

**GET** `/vereinbarungen/:id/pdf`

**Response:** `200 OK`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="vereinbarung_1_v1.pdf"`
- Body: PDF-Binary

---

#### 8. Versionshistorie abrufen

**GET** `/vereinbarungen/:id/history`

**Response:** `200 OK`
```json
[
  {
    "vereinbarung_id": 2,
    "version": 2,
    "status": "Entwurf",
    "createdAt": "2025-11-19T10:00:00.000Z"
  },
  {
    "vereinbarung_id": 1,
    "version": 1,
    "status": "Archiviert",
    "createdAt": "2025-11-18T10:00:00.000Z"
  }
]
```

---

#### 9. Aktionsprotokoll abrufen

**GET** `/vereinbarungen/:id/log`

**Response:** `200 OK`
```json
[
  {
    "log_id": 1,
    "vereinbarung_id": 1,
    "user_id": 1,
    "aktion": "ERSTELLT",
    "details": null,
    "createdAt": "2025-11-18T10:00:00.000Z",
    "user": { "username": "user1" }
  },
  {
    "log_id": 2,
    "vereinbarung_id": 1,
    "user_id": 1,
    "aktion": "PDF_EXPORTIERT",
    "details": null,
    "createdAt": "2025-11-18T11:00:00.000Z",
    "user": { "username": "user1" }
  }
]
```

---

## 🚀 Installation & Setup

### Backend-Dependencies

**Pfad:** `node-js-jwt-auth/package.json`

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "mysql2": "^3.6.0",
    "puppeteer": "^21.0.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  }
}
```

**Installation:**
```bash
cd node-js-jwt-auth
npm install
```

---

### Frontend-Dependencies

**Pfad:** `react-redux-login-example/package.json`

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-bootstrap": "^2.7.0",
    "react-quill": "^2.0.0",
    "axios": "^1.3.0",
    "redux": "^4.2.0"
  }
}
```

**Installation:**
```bash
cd react-redux-login-example
npm install
```

---

### Datenbank-Setup

**SQL-Script zum Erstellen der Tabellen:**

```sql
-- Tabelle: t_vereinbarungstitel
CREATE TABLE IF NOT EXISTS `t_vereinbarungstitel` (
  `titel_id` INT NOT NULL AUTO_INCREMENT,
  `titel` VARCHAR(255) NOT NULL,
  `beschreibung` TEXT NULL,
  `erstellt_von_user_id` INT NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`titel_id`),
  INDEX `fk_vereinbarungstitel_user_idx` (`erstellt_von_user_id` ASC),
  CONSTRAINT `fk_vereinbarungstitel_user`
    FOREIGN KEY (`erstellt_von_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- Tabelle: t_vereinbarungen
CREATE TABLE IF NOT EXISTS `t_vereinbarungen` (
  `vereinbarung_id` INT NOT NULL AUTO_INCREMENT,
  `titel_id` INT NOT NULL,
  `inhalt` TEXT('long') NOT NULL,
  `ersteller_user_id` INT NOT NULL,
  `empfaenger_user_id` INT NOT NULL,
  `status` VARCHAR(45) NULL DEFAULT 'Entwurf',
  `version` INT NOT NULL DEFAULT 1,
  `parent_vereinbarung_id` INT NULL,
  `unterzeichnet_am` DATE NULL,
  `bearbeiter_von` VARCHAR(255) NULL,
  `bearbeiter_an` VARCHAR(255) NULL,
  `kurze_zusammenfassung` TEXT NULL,
  `anlagen` TEXT NULL,
  `unterzeichnungsdatum_ersteller` DATE NULL,
  `unterzeichnungsdatum_empfaenger` DATE NULL,
  `gueltigkeit_von` DATE NULL,
  `gueltigkeit_bis` DATE NULL,
  `kuendigungsfrist_wert` INT NULL,
  `kuendigungsfrist_einheit` ENUM('Tag(e)', 'Woche(n)', 'Monat(e)', 'Jahre') NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`vereinbarung_id`),
  INDEX `fk_vereinbarung_titel_idx` (`titel_id` ASC),
  INDEX `fk_vereinbarung_ersteller_idx` (`ersteller_user_id` ASC),
  INDEX `fk_vereinbarung_empfaenger_idx` (`empfaenger_user_id` ASC),
  INDEX `fk_vereinbarung_parent_idx` (`parent_vereinbarung_id` ASC),
  CONSTRAINT `fk_vereinbarung_titel`
    FOREIGN KEY (`titel_id`)
    REFERENCES `t_vereinbarungstitel` (`titel_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_vereinbarung_ersteller`
    FOREIGN KEY (`ersteller_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_vereinbarung_empfaenger`
    FOREIGN KEY (`empfaenger_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_vereinbarung_parent`
    FOREIGN KEY (`parent_vereinbarung_id`)
    REFERENCES `t_vereinbarungen` (`vereinbarung_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- Tabelle: t_vereinbarungs_logs
CREATE TABLE IF NOT EXISTS `t_vereinbarungs_logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `vereinbarung_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `aktion` VARCHAR(255) NOT NULL,
  `details` JSON NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`log_id`),
  INDEX `fk_log_vereinbarung_idx` (`vereinbarung_id` ASC),
  INDEX `fk_log_user_idx` (`user_id` ASC),
  CONSTRAINT `fk_log_vereinbarung`
    FOREIGN KEY (`vereinbarung_id`)
    REFERENCES `t_vereinbarungen` (`vereinbarung_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_log_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

-- Tabelle: t_platzhalter_definitionen
CREATE TABLE IF NOT EXISTS `t_platzhalter_definitionen` (
  `platzhalter_id` INT NOT NULL AUTO_INCREMENT,
  `platzhalter_schluessel` VARCHAR(255) NOT NULL,
  `beschreibung` TEXT NOT NULL,
  `quell_tabelle` VARCHAR(255) NOT NULL,
  `quell_spalte` VARCHAR(255) NOT NULL,
  `zulaessige_rollen` JSON NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`platzhalter_id`),
  UNIQUE INDEX `unique_platzhalter_schluessel` (`platzhalter_schluessel` ASC)
) ENGINE = InnoDB;
```

---

### Umgebungsvariablen

**Backend (.env):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=googlereview_v1
DB_PORT=3306
JWT_SECRET=your_jwt_secret
PORT=8080
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:8080/api/test/
```

---

## 🔨 Nachbau-Anleitung

### Schritt 1: Datenbank erstellen

1. Führen Sie das SQL-Script aus (siehe oben)
2. Stellen Sie sicher, dass die Tabelle `users` existiert

---

### Schritt 2: Backend einrichten

1. **Modelle erstellen:**
   - Kopieren Sie die Model-Dateien in `node-js-jwt-auth/app/models/`
   - Registrieren Sie die Modelle in `app/models/index.js`
   - Definieren Sie die Beziehungen

2. **Controller erstellen:**
   - Kopieren Sie `vereinbarung.controller.js` nach `app/controllers/`
   - Installieren Sie Puppeteer: `npm install puppeteer`

3. **Routes erstellen:**
   - Kopieren Sie `vereinbarung.routes.js` nach `app/routes/`
   - Registrieren Sie die Routes in `server.js`

---

### Schritt 3: Frontend einrichten

1. **Service erstellen:**
   - Kopieren Sie `vereinbarung.service.js` nach `src/services/`

2. **Komponenten erstellen:**
   - Kopieren Sie alle Komponenten nach `src/components/`
   - Installieren Sie ReactQuill: `npm install react-quill`

3. **Routes definieren:**
   - Fügen Sie die Routes in `App.js` hinzu

---

### Schritt 4: Abhängigkeiten installieren

**Backend:**
```bash
npm install puppeteer
```

**Frontend:**
```bash
npm install react-quill
```

---

### Schritt 5: Testen

1. Backend starten: `npm start` (in `node-js-jwt-auth`)
2. Frontend starten: `npm start` (in `react-redux-login-example`)
3. Navigieren Sie zu `http://localhost:8081/agreements`

---

## 📝 Zusammenfassung

Das Agreements-Modul ist ein vollständiges CRUD-System mit folgenden Features:

✅ **Vollständige CRUD-Operationen**  
✅ **Versionsverwaltung**  
✅ **Platzhalter-System**  
✅ **PDF-Export**  
✅ **Aktionsprotokollierung**  
✅ **Rich-Text-Editor**  
✅ **Responsive Design**  
✅ **JWT-Authentifizierung**

Alle Dateien sind vollständig dokumentiert und können 1:1 nachgebaut werden.

---

**Ende der Dokumentation**

