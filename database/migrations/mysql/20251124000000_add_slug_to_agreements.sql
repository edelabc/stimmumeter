/*
  # Add Slug Field to Agreements Table

  ## Overview
  This migration adds a `slug` field to the `t_vereinbarungen` table and implements
  automatic slug generation when an agreement status is set to "Unterzeichnet".

  ## Changes

  1. Add `slug` column to `t_vereinbarungen`
  2. Create function to generate slug from agreement title
  3. Create trigger to auto-generate slug when status changes to "Unterzeichnet"
  4. Add unique index on slug
*/

-- Add slug column to t_vereinbarungen
ALTER TABLE `t_vereinbarungen` 
ADD COLUMN IF NOT EXISTS `slug` VARCHAR(255) NULL;

-- Create unique index on slug (allowing NULL)
CREATE UNIQUE INDEX IF NOT EXISTS `idx_vereinbarungen_slug_unique` 
  ON `t_vereinbarungen`(`slug`) 
  WHERE `slug` IS NOT NULL;

-- Create function to generate slug from agreement title
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS `generate_agreement_slug`(agreement_title VARCHAR(255), agreement_id CHAR(36))
RETURNS VARCHAR(255)
DETERMINISTIC
BEGIN
  DECLARE base_slug VARCHAR(255);
  DECLARE final_slug VARCHAR(255);
  DECLARE counter INT DEFAULT 0;
  
  -- Generate base slug from title
  SET base_slug = LOWER(agreement_title);
  SET base_slug = REPLACE(base_slug, 'ä', 'ae');
  SET base_slug = REPLACE(base_slug, 'ö', 'oe');
  SET base_slug = REPLACE(base_slug, 'ü', 'ue');
  SET base_slug = REPLACE(base_slug, 'ß', 'ss');
  SET base_slug = REGEXP_REPLACE(base_slug, '[^a-z0-9]+', '-');
  SET base_slug = TRIM(BOTH '-' FROM base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    SET base_slug = CONCAT('vereinbarung-', SUBSTRING(agreement_id, 1, 8));
  END IF;
  
  -- Check for uniqueness and append counter if needed
  SET final_slug = base_slug;
  WHILE EXISTS (SELECT 1 FROM `t_vereinbarungen` WHERE `slug` = final_slug AND `id` != agreement_id) DO
    SET counter = counter + 1;
    SET final_slug = CONCAT(base_slug, '-', counter);
  END WHILE;
  
  RETURN final_slug;
END$$

DELIMITER ;

-- Create trigger to auto-generate slug
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS `trigger_auto_generate_agreement_slug`
BEFORE INSERT ON `t_vereinbarungen`
FOR EACH ROW
BEGIN
  DECLARE agreement_title VARCHAR(255);
  
  -- Only generate slug if status is "Unterzeichnet" and slug is empty
  IF NEW.`status` = 'Unterzeichnet' AND (NEW.`slug` IS NULL OR NEW.`slug` = '') THEN
    -- Get title from related titel
    SELECT `titel` INTO agreement_title
    FROM `t_vereinbarungstitel`
    WHERE `id` = NEW.`titel_id`;
    
    -- Generate slug if title exists
    IF agreement_title IS NOT NULL THEN
      SET NEW.`slug` = `generate_agreement_slug`(agreement_title, NEW.`id`);
    END IF;
  END IF;
END$$

CREATE TRIGGER IF NOT EXISTS `trigger_auto_generate_agreement_slug_update`
BEFORE UPDATE ON `t_vereinbarungen`
FOR EACH ROW
BEGIN
  DECLARE agreement_title VARCHAR(255);
  
  -- Only generate slug if status changes to "Unterzeichnet" and slug is empty
  IF NEW.`status` = 'Unterzeichnet' AND (NEW.`slug` IS NULL OR NEW.`slug` = '') AND OLD.`status` != 'Unterzeichnet' THEN
    -- Get title from related titel
    SELECT `titel` INTO agreement_title
    FROM `t_vereinbarungstitel`
    WHERE `id` = NEW.`titel_id`;
    
    -- Generate slug if title exists
    IF agreement_title IS NOT NULL THEN
      SET NEW.`slug` = `generate_agreement_slug`(agreement_title, NEW.`id`);
    END IF;
  END IF;
END$$

DELIMITER ;

-- Update existing "Unterzeichnet" agreements to have slugs
UPDATE `t_vereinbarungen` v
INNER JOIN `t_vereinbarungstitel` t ON v.`titel_id` = t.`id`
SET v.`slug` = `generate_agreement_slug`(t.`titel`, v.`id`)
WHERE v.`status` = 'Unterzeichnet' AND (v.`slug` IS NULL OR v.`slug` = '');





