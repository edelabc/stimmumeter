# Stimmungsindikatoren – kategorisiert nach 3 psychologischen Hauptzuständen

| Icon | Eigenschaft | Kategorie |
|------|-------------|-----------|
| ⚠️ | abschreckend | negativ |
| 🚫 | abstoßend | negativ |
| ⚡ | aktiv | positiv |
| 📚 | allwissend | neutral |
| 😬 | angespannt | negativ |
| ✨ | anziehend | positiv |
| 👀 | aufmerksam | neutral |
| 🧘 | ausgeglichen | neutral |
| 🤩 | begeistert | positiv |
| 🤲 | behutsam | positiv |
| 💪 | belastbar | positiv |
| 🎲 | chaotisch | neutral |
| 😔 | depressiv | negativ |
| ❓ | desorientiert | negativ |
| 🏃 | dynamisch | positiv |
| 📦 | einfach gestrickt | neutral |
| 🤝 | empathisch | positiv |
| 🔥 | energisch | positiv |
| 📌 | engagiert | positiv |
| 😴 | ermüdet | negativ |
| 🔥 | erotisch | positiv |
| 🌈 | fantasievoll | neutral |
| 🧹 | fleißig | positiv |
| 😊 | freundlich | positiv |
| 😄 | fröhlich | positiv |
| 👶 | fürsorglich | positiv |
| ⌛ | geduldig | positiv |
| 🌍 | geerdet | neutral |
| 🥣 | genügsam | neutral |
| 🦊 | gerissen | negativ |
| 🕺 | gesellig | positiv |
| 🗣️ | gesprächig | positiv |
| 📋 | gewissenhaft | positiv |
| 🎁 | großzügig | positiv |
| 🆘 | hilfsbereit | positiv |
| 😂 | humorvoll | positiv |
| 🧠 | intelligent | positiv |
| 🎨 | kreativ | positiv |
| ❤️ | liebevoll | positiv |
| 🤣 | lustig | positiv |
| 😒 | lustlos | negativ |
| 🌧️ | melancholisch | negativ |
| 🚀 | motiviert | positiv |
| 😟 | nervös | negativ |
| 🌞 | optimistisch | positiv |
| 🛌 | passiv | neutral |
| 📊 | rational | neutral |
| 🎯 | realistisch | neutral |
| 🤲 | respektvoll | positiv |
| 🌿 | ruhig | positiv |
| 🪶 | rückgratlos | negativ |
| 💢 | rücksichtslos | negativ |
| 🤝 | rücksichtsvoll | positiv |
| 🔪 | scharfsinnig | positiv |
| 🪫 | schwach | negativ |
| 🙈 | schüchtern | neutral |
| 🤲 | selbstlos | positiv |
| 💼 | selbstsicher | positiv |
| 🌸 | sensibel | neutral |
| 🔥 | sexy | positiv |
| 👑 | souverän | positiv |
| 🚫 | spielverderberisch | negativ |
| 🤗 | sympathisch | positiv |
| 😢 | traurig | negativ |
| 🌑 | trostlos | negativ |
| ⚖️ | unausgeglichen | negativ |
| ⏳ | ungeduldig | neutral |
| 🧊 | unnahbar | neutral |
| 🙅 | unsympathisch | negativ |
| 📘 | verantwortungsbewusst | positiv |
| 💘 | verliebt | positiv |
| 🧠 | verständnisvoll | positiv |
| 🌙 | verträumt | neutral |
| 🗑️ | wertlos | negativ |
| 💎 | wertvoll | positiv |
| 🔍 | wissbegierig | positiv |
| ⏱️ | zuverlässig | positiv |
| 🌈 | zuversichtlich | positiv |
| 😨 | ängstlich | negativ |
| 🎉 | übermütig | neutral |



from pathlib import Path

# create combined list with icon, word, category from previous data and new categories mapping
# Definition of lists (reuse icons from earlier, mapping categories from prior answer)

items = {
"ängstlich":"😨",
"aktiv":"⚡",
"angespannt":"😬",
"aufmerksam":"👀",
"ausgeglichen":"🧘",
"begeistert":"🤩",
"belastbar":"💪",
"chaotisch":"🎲",
"depressiv":"😔",
"dynamisch":"🏃",
"empathisch":"🤝",
"energisch":"🔥",
"engagiert":"📌",
"ermüdet":"😴",
"fantasievoll":"🌈",
"fleißig":"🧹",
"freundlich":"😊",
"fröhlich":"😄",
"geduldig":"⌛",
"geerdet":"🌍",
"gesellig":"🕺",
"gesprächig":"🗣️",
"gewissenhaft":"📋",
"großzügig":"🎁",
"hilfsbereit":"🆘",
"humorvoll":"😂",
"intelligent":"🧠",
"kreativ":"🎨",
"liebevoll":"❤️",
"lustig":"🤣",
"lustlos":"😒",
"melancholisch":"🌧️",
"motiviert":"🚀",
"nervös":"😟",
"optimistisch":"🌞",
"passiv":"🛌",
"rational":"📊",
"respektvoll":"🤲",
"ruhig":"🌿",
"schüchtern":"🙈",
"schwach":"🪫",
"selbstlos":"🤲",
"selbstsicher":"💼",
"sensibel":"🌸",
"sexy":"🔥",
"souverän":"👑",
"sympathisch":"🤗",
"traurig":"😢",
"unnahbar":"🧊",
"übermütig":"🎉",
"verliebt":"💘",
"verantwortungsbewusst":"📘",
"verständnisvoll":"🧠",
"verträumt":"🌙",
"zuverlässig":"⏱️",
"zuversichtlich":"🌈",
"erotisch":"🔥",
"anziehend":"✨",
"abstoßend":"🚫",
"abschreckend":"⚠️",
"unsympathisch":"🙅",
"gerissen":"🦊",
"scharfsinnig":"🔪",
"desorientiert":"❓",
"unausgeglichen":"⚖️",
"ungeduldig":"⏳",
"allwissend":"📚",
"wissbegierig":"🔍",
"einfach gestrickt":"📦",
"genügsam":"🥣",
"behutsam":"🤲",
"fürsorglich":"👶",
"rücksichtslos":"💢",
"rücksichtsvoll":"🤝",
"wertvoll":"💎",
"wertlos":"🗑️",
"spielverderberisch":"🚫",
"realistisch":"🎯",
"trostlos":"🌑",
"rückgratlos":"🪶"
}

# categories mapping
categories = {
"abstoßend":"negativ","abschreckend":"negativ","aktiv":"positiv","ängstlich":"negativ",
"anziehend":"positiv","angespannt":"negativ","aufmerksam":"neutral","ausgeglichen":"neutral",
"allwissend":"neutral","belastbar":"positiv","begeistert":"positiv","behutsam":"positiv",
"chaotisch":"neutral","depressiv":"negativ","desorientiert":"negativ","dynamisch":"positiv",
"empathisch":"positiv","energisch":"positiv","engagiert":"positiv","einfach gestrickt":"neutral",
"ermüdet":"negativ","erotisch":"positiv","fantasievoll":"neutral","fürsorglich":"positiv",
"fleißig":"positiv","freundlich":"positiv","fröhlich":"positiv","geduldig":"positiv",
"genügsam":"neutral","geerdet":"neutral","gerissen":"negativ","gesellig":"positiv",
"gesprächig":"positiv","gewissenhaft":"positiv","großzügig":"positiv","hilfsbereit":"positiv",
"humorvoll":"positiv","intelligent":"positiv","kreativ":"positiv","liebevoll":"positiv",
"lustig":"positiv","lustlos":"negativ","melancholisch":"negativ","motiviert":"positiv",
"nervös":"negativ","optimistisch":"positiv","passiv":"neutral","rational":"neutral",
"realistisch":"neutral","respektvoll":"positiv","ruhig":"positiv","rücksichtslos":"negativ",
"rücksichtsvoll":"positiv","rückgratlos":"negativ","scharfsinnig":"positiv","schwach":"negativ",
"schüchtern":"neutral","selbstlos":"positiv","selbstsicher":"positiv","sensibel":"neutral",
"sexy":"positiv","souverän":"positiv","sympathisch":"positiv","spielverderberisch":"negativ",
"traurig":"negativ","trostlos":"negativ","unnahbar":"neutral","unausgeglichen":"negativ",
"unsympathisch":"negativ","übermütig":"neutral","verliebt":"positiv",
"verantwortungsbewusst":"positiv","verständnisvoll":"positiv","verträumt":"neutral",
"wertlos":"negativ","wertvoll":"positiv","wissbegierig":"positiv","zuverlässig":"positiv",
"zuversichtlich":"positiv"
}

# Build markdown
content = "# Stimmungsindikatoren – mit Kategorien\n\n| Icon | Eigenschaft | Kategorie |\n|------|-------------|-----------|\n"

for word in sorted(items.keys(), key=lambda x: x.lower()):
    icon = items[word]
    cat = categories.get(word, "neutral")
    content += f"| {icon} | {word} | {cat} |\n"

path = Path("/mnt/data/stimmungsindikatoren_kategorisiert.md")
path.write_text(content, encoding="utf-8")

path



from pathlib import Path

# Define items with icons
items = {
"ängstlich":"😨","aktiv":"⚡","angespannt":"😬","aufmerksam":"👀","ausgeglichen":"🧘",
"begeistert":"🤩","belastbar":"💪","chaotisch":"🎲","depressiv":"😔","dynamisch":"🏃",
"empathisch":"🤝","energisch":"🔥","engagiert":"📌","ermüdet":"😴","fantasievoll":"🌈",
"fleißig":"🧹","freundlich":"😊","fröhlich":"😄","geduldig":"⌛","geerdet":"🌍",
"gesellig":"🕺","gesprächig":"🗣️","gewissenhaft":"📋","großzügig":"🎁","hilfsbereit":"🆘",
"humorvoll":"😂","intelligent":"🧠","kreativ":"🎨","liebevoll":"❤️","lustig":"🤣",
"lustlos":"😒","melancholisch":"🌧️","motiviert":"🚀","nervös":"😟","optimistisch":"🌞",
"passiv":"🛌","rational":"📊","respektvoll":"🤲","ruhig":"🌿","schüchtern":"🙈",
"schwach":"🪫","selbstlos":"🤲","selbstsicher":"💼","sensibel":"🌸","sexy":"🔥",
"souverän":"👑","sympathisch":"🤗","traurig":"😢","unnahbar":"🧊","übermütig":"🎉",
"verliebt":"💘","verantwortungsbewusst":"📘","verständnisvoll":"🧠","verträumt":"🌙",
"zuverlässig":"⏱️","zuversichtlich":"🌈","erotisch":"🔥","anziehend":"✨",
"abstoßend":"🚫","abschreckend":"⚠️","unsympathisch":"🙅","gerissen":"🦊",
"scharfsinnig":"🔪","desorientiert":"❓","unausgeglichen":"⚖️","ungeduldig":"⏳",
"allwissend":"📚","wissbegierig":"🔍","einfach gestrickt":"📦","genügsam":"🥣",
"behutsam":"🤲","fürsorglich":"👶","rücksichtslos":"💢","rücksichtsvoll":"🤝",
"wertvoll":"💎","wertlos":"🗑️","spielverderberisch":"🚫","realistisch":"🎯",
"trostlos":"🌑","rückgratlos":"🪶"
}

# Category mapping
categories = {
"abstoßend":"negativ","abschreckend":"negativ","aktiv":"positiv","ängstlich":"negativ",
"anziehend":"positiv","angespannt":"negativ","aufmerksam":"neutral","ausgeglichen":"neutral",
"allwissend":"neutral","belastbar":"positiv","begeistert":"positiv","behutsam":"positiv",
"chaotisch":"neutral","depressiv":"negativ","desorientiert":"negativ","dynamisch":"positiv",
"empathisch":"positiv","energisch":"positiv","engagiert":"positiv","einfach gestrickt":"neutral",
"ermüdet":"negativ","erotisch":"positiv","fantasievoll":"neutral","fürsorglich":"positiv",
"fleißig":"positiv","freundlich":"positiv","fröhlich":"positiv","geduldig":"positiv",
"genügsam":"neutral","geerdet":"neutral","gerissen":"negativ","gesellig":"positiv",
"gesprächig":"positiv","gewissenhaft":"positiv","großzügig":"positiv","hilfsbereit":"positiv",
"humorvoll":"positiv","intelligent":"positiv","kreativ":"positiv","liebevoll":"positiv",
"lustig":"positiv","lustlos":"negativ","melancholisch":"negativ","motiviert":"positiv",
"nervös":"negativ","optimistisch":"positiv","passiv":"neutral","rational":"neutral",
"realistisch":"neutral","respektvoll":"positiv","ruhig":"positiv","rücksichtslos":"negativ",
"rücksichtsvoll":"positiv","rückgratlos":"negativ","scharfsinnig":"positiv","schwach":"negativ",
"schüchtern":"neutral","selbstlos":"positiv","selbstsicher":"positiv","sensibel":"neutral",
"sexy":"positiv","souverän":"positiv","sympathisch":"positiv","spielverderberisch":"negativ",
"traurig":"negativ","trostlos":"negativ","unnahbar":"neutral","unausgeglichen":"negativ",
"unsympathisch":"negativ","übermütig":"neutral","verliebt":"positiv",
"verantwortungsbewusst":"positiv","verständnisvoll":"positiv","verträumt":"neutral",
"wertlos":"negativ","wertvoll":"positiv","wissbegierig":"positiv","zuverlässig":"positiv",
"zuversichtlich":"positiv"
}

# Build markdown content
content = "# Stimmungsindikatoren – kategorisiert nach 3 psychologischen Hauptzuständen\n\n| Icon | Eigenschaft | Kategorie |\n|------|-------------|-----------|\n"

for word in sorted(items.keys(), key=lambda x: x.lower()):
    icon = items[word]
    cat = categories.get(word, "neutral")
    content += f"| {icon} | {word} | {cat} |\n"

# Write to file
path = Path("/mnt/data/stimmungsindikatoren_kategorisiert.md")
path.write_text(content, encoding="utf-8")

path



