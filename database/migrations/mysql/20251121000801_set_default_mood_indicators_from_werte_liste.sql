/*
  # Set Default Mood Indicators from werte_liste.md and werte_liste_erweitert.md
  
  ## Overview
  This migration sets all values from werte_liste.md and werte_liste_erweitert.md 
  as default mood indicators that all users can access. These indicators are shared 
  (user_id = NULL) and visible to all authenticated users.
  
  ## New Default Indicators
  All properties from both lists with their corresponding emojis:
  - abschreckend, abstoßend, aktiv, allwissend, angespannt, anziehend, aufmerksam,
    ausgeglichen, begeistert, behutsam, belastbar, chaotisch, depressiv, desorientiert,
    dynamisch, einfach gestrickt, empathisch, energisch, engagiert, ermüdet, erotisch,
    fantasievoll, fleißig, freundlich, fröhlich, fürsorglich, geduldig, geerdet,
    genügsam, gerissen, gesellig, gesprächig, gewissenhaft, großzügig, hilfsbereit,
    humorvoll, intelligent, kreativ, liebevoll, lustig, lustlos, melancholisch,
    motiviert, nervös, optimistisch, passiv, rational, realistisch, respektvoll,
    ruhig, rückgratlos, rücksichtslos, rücksichtsvoll, scharfsinnig, schwach,
    schüchtern, selbstlos, selbstsicher, sensibel, sexy, souverän, spielverderberisch,
    sympathisch, traurig, trostlos, unausgeglichen, ungeduldig, unnahbar, unsympathisch,
    verantwortungsbewusst, verliebt, verständnisvoll, verträumt, wertlos, wertvoll,
    wissbegierig, zuverlässig, zuversichtlich, ängstlich, übermütig
  
  ## Scale Configuration
  - All indicators use a 0-10 scale with 0.5 step increments
  - Color gradients from red (low) to green (high) for positive traits
  - Color gradients from green (low) to red (high) for negative traits
  
  ## Important Notes
  1. These are global indicators (user_id = NULL)
  2. Users can still create their own custom indicators
  3. Existing default indicators are replaced
*/

-- Delete existing null user_id indicators to avoid conflicts
DELETE FROM mood_indicators WHERE user_id IS NULL;

-- Insert all default indicators from werte_liste.md and werte_liste_erweitert.md
INSERT INTO mood_indicators (name, color, sort_order, is_active, min_value, max_value, step_value, color_start, color_end, user_id) VALUES
  ('⚠️ abschreckend', '#ef4444', 1, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🚫 abstoßend', '#ef4444', 2, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('⚡ aktiv', '#84cc16', 3, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('📚 allwissend', '#6366f1', 4, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😨 ängstlich', '#ef4444', 5, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('😬 angespannt', '#f59e0b', 6, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('✨ anziehend', '#ec4899', 7, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('👀 aufmerksam', '#3b82f6', 8, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🧘 ausgeglichen', '#10b981', 9, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🤩 begeistert', '#eab308', 10, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🤲 behutsam', '#06b6d4', 11, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('💪 belastbar', '#06b6d4', 12, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🎲 chaotisch', '#f97316', 13, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('😔 depressiv', '#64748b', 14, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('❓ desorientiert', '#6b7280', 15, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🏃 dynamisch', '#22c55e', 16, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('📦 einfach gestrickt', '#78716c', 17, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🤝 empathisch', '#06b6d4', 18, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🔥 energisch', '#f59e0b', 19, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('📌 engagiert', '#3b82f6', 20, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😴 ermüdet', '#64748b', 21, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🔥 erotisch', '#ec4899', 22, true, 0, 10, 0.5, '#ef4444', '#ec4899', NULL),
  ('🌈 fantasievoll', '#a855f7', 23, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🧹 fleißig', '#10b981', 24, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😊 freundlich', '#10b981', 25, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😄 fröhlich', '#eab308', 26, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('👶 fürsorglich', '#f43f5e', 27, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('⌛ geduldig', '#6366f1', 28, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🌍 geerdet', '#059669', 29, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🥣 genügsam', '#10b981', 30, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🦊 gerissen', '#f59e0b', 31, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🕺 gesellig', '#ec4899', 32, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🗣️ gesprächig', '#3b82f6', 33, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('📋 gewissenhaft', '#6366f1', 34, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🎁 großzügig', '#f43f5e', 35, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🆘 hilfsbereit', '#06b6d4', 36, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😂 humorvoll', '#eab308', 37, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🧠 intelligent', '#6366f1', 38, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🎨 kreativ', '#a855f7', 39, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('❤️ liebevoll', '#f43f5e', 40, true, 0, 10, 0.5, '#ef4444', '#f43f5e', NULL),
  ('🤣 lustig', '#eab308', 41, true, 0, 10, 0.5, '#ef4444', '#eab308', NULL),
  ('😒 lustlos', '#78716c', 42, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🌧️ melancholisch', '#64748b', 43, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🚀 motiviert', '#f59e0b', 44, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😟 nervös', '#f59e0b', 45, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🌞 optimistisch', '#eab308', 46, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🛌 passiv', '#737373', 47, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('📊 rational', '#6366f1', 48, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🎯 realistisch', '#6366f1', 49, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🤲 respektvoll', '#06b6d4', 50, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🌿 ruhig', '#10b981', 51, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🪶 rückgratlos', '#6b7280', 52, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('💢 rücksichtslos', '#ef4444', 53, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🤝 rücksichtsvoll', '#06b6d4', 54, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🔪 scharfsinnig', '#6366f1', 55, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🪫 schwach', '#6b7280', 56, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🙈 schüchtern', '#a855f7', 57, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🤲 selbstlos', '#06b6d4', 58, true, 0, 10, 0.5, '#ef4444', '#06b6d4', NULL),
  ('💼 selbstsicher', '#6366f1', 59, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🌸 sensibel', '#f43f5e', 60, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🔥 sexy', '#ec4899', 61, true, 0, 10, 0.5, '#ef4444', '#ec4899', NULL),
  ('👑 souverän', '#f59e0b', 62, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🚫 spielverderberisch', '#ef4444', 63, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🤗 sympathisch', '#3b82f6', 64, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('😢 traurig', '#64748b', 65, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🌑 trostlos', '#475569', 66, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('⚖️ unausgeglichen', '#f59e0b', 67, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('⏳ ungeduldig', '#f59e0b', 68, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🧊 unnahbar', '#6b7280', 69, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('🙅 unsympathisch', '#ef4444', 70, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('📘 verantwortungsbewusst', '#6366f1', 71, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('💘 verliebt', '#f43f5e', 72, true, 0, 10, 0.5, '#ef4444', '#f43f5e', NULL),
  ('🧠 verständnisvoll', '#6366f1', 73, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🌙 verträumt', '#a855f7', 74, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🗑️ wertlos', '#6b7280', 75, true, 0, 10, 0.5, '#10b981', '#ef4444', NULL),
  ('💎 wertvoll', '#eab308', 76, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🔍 wissbegierig', '#6366f1', 77, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('⏱️ zuverlässig', '#10b981', 78, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🌈 zuversichtlich', '#eab308', 79, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL),
  ('🎉 übermütig', '#eab308', 80, true, 0, 10, 0.5, '#ef4444', '#10b981', NULL);