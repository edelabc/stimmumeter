/*
  # Assign Categories to Standard Indicators
  
  ## Overview
  This migration assigns the 3 psychological categories to all standard indicators
  based on the categorization provided in the documentation.
  
  ## Category Mapping
  - Positive Stimmung (VALENZ POSITIV): aktiv, anziehend, begeistert, etc.
  - Neutrale / Ambivalente Stimmung (VALENZ NEUTRAL / GEMISCHT): allwissend, aufmerksam, ausgeglichen, etc.
  - Negative Stimmung (VALENZ NEGATIV): abschreckend, abstoßend, angespannt, etc.
*/

-- Update standard indicators with their categories
-- Note: Names in database include emojis, so we match by substring after emoji

-- Positive Stimmung
UPDATE mood_indicators
SET category_id = (SELECT id FROM indicator_categories WHERE name = 'Positive Stimmung (VALENZ POSITIV)')
WHERE user_id IS NULL
AND (
  name LIKE '% aktiv' OR name LIKE '% anziehend' OR name LIKE '% begeistert' OR 
  name LIKE '% behutsam' OR name LIKE '% belastbar' OR name LIKE '% dynamisch' OR 
  name LIKE '% empathisch' OR name LIKE '% energisch' OR name LIKE '% engagiert' OR 
  name LIKE '% erotisch' OR name LIKE '% fleißig' OR name LIKE '% freundlich' OR 
  name LIKE '% fröhlich' OR name LIKE '% fürsorglich' OR name LIKE '% geduldig' OR 
  name LIKE '% gesellig' OR name LIKE '% gesprächig' OR name LIKE '% gewissenhaft' OR 
  name LIKE '% großzügig' OR name LIKE '% hilfsbereit' OR name LIKE '% humorvoll' OR 
  name LIKE '% intelligent' OR name LIKE '% kreativ' OR name LIKE '% liebevoll' OR 
  name LIKE '% lustig' OR name LIKE '% motiviert' OR name LIKE '% optimistisch' OR 
  name LIKE '% respektvoll' OR name LIKE '% ruhig' OR name LIKE '% rücksichtsvoll' OR 
  name LIKE '% scharfsinnig' OR name LIKE '% selbstlos' OR name LIKE '% selbstsicher' OR 
  name LIKE '% sexy' OR name LIKE '% souverän' OR name LIKE '% sympathisch' OR 
  name LIKE '% verantwortungsbewusst' OR name LIKE '% verliebt' OR name LIKE '% verständnisvoll' OR 
  name LIKE '% wertvoll' OR name LIKE '% wissbegierig' OR 
  name LIKE '% zuverlässig' OR name LIKE '% zuversichtlich'
);

-- Neutrale / Ambivalente Stimmung
UPDATE mood_indicators
SET category_id = (SELECT id FROM indicator_categories WHERE name = 'Neutrale / Ambivalente Stimmung (VALENZ NEUTRAL / GEMISCHT)')
WHERE user_id IS NULL
AND (
  name LIKE '% allwissend' OR name LIKE '% aufmerksam' OR name LIKE '% ausgeglichen' OR 
  name LIKE '% chaotisch' OR name LIKE '% einfach gestrickt' OR 
  name LIKE '% fantasievoll' OR name LIKE '% geerdet' OR name LIKE '% genügsam' OR 
  name LIKE '% passiv' OR name LIKE '% rational' OR name LIKE '% realistisch' OR 
  name LIKE '% schüchtern' OR name LIKE '% sensibel' OR name LIKE '% ungeduldig' OR 
  name LIKE '% unnahbar' OR name LIKE '% verträumt' OR name LIKE '% übermütig'
);

-- Negative Stimmung
UPDATE mood_indicators
SET category_id = (SELECT id FROM indicator_categories WHERE name = 'Negative Stimmung (VALENZ NEGATIV)')
WHERE user_id IS NULL
AND (
  name LIKE '% abschreckend' OR name LIKE '% abstoßend' OR name LIKE '% angespannt' OR 
  name LIKE '% depressiv' OR name LIKE '% desorientiert' OR 
  name LIKE '% ermüdet' OR name LIKE '% gerissen' OR name LIKE '% lustlos' OR 
  name LIKE '% melancholisch' OR name LIKE '% nervös' OR name LIKE '% rückgratlos' OR 
  name LIKE '% rücksichtslos' OR name LIKE '% schwach' OR name LIKE '% spielverderberisch' OR 
  name LIKE '% traurig' OR name LIKE '% trostlos' OR 
  name LIKE '% unausgeglichen' OR name LIKE '% unsympathisch' OR name LIKE '% wertlos' OR 
  name LIKE '% ängstlich'
);