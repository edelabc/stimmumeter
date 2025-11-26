/*
  # User Agreement Consents (MySQL Version)
  
  ## Overview
  This migration creates a table to store user consent for agreements (AGB, Datenschutz, Cookies, etc.)
  during registration. This ensures GDPR compliance and tracks which version of each agreement
  the user has accepted.
*/

-- Create user_agreement_consents table
CREATE TABLE IF NOT EXISTS user_agreement_consents (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  agreement_id CHAR(36) NOT NULL,
  agreement_version INT NOT NULL,
  consent_type ENUM('AGB', 'Datenschutz', 'Cookies', 'DSGVO', 'Impressum', 'Widerruf') NOT NULL,
  consented_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_agreement_consents_user_id (user_id),
  INDEX idx_user_agreement_consents_agreement_id (agreement_id),
  INDEX idx_user_agreement_consents_consent_type (consent_type),
  INDEX idx_user_agreement_consents_consented_at (consented_at DESC),
  UNIQUE KEY idx_user_agreement_consents_unique (user_id, agreement_id, agreement_version),
  FOREIGN KEY (user_id) REFERENCES users_profile(id) ON DELETE CASCADE,
  FOREIGN KEY (agreement_id) REFERENCES t_vereinbarungen(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




