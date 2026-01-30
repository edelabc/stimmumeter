/*
  # Add 'gesperrt' field to Vereinbarungstitel

  1. Changes
    - Add `gesperrt` (boolean) field to t_vereinbarungstitel table
    - Default value is false (not locked)
    - Locked titles cannot be deleted or used in new agreements

  2. Purpose
    - Allow administrators to lock important document titles
    - Prevent accidental deletion of titles in use
*/

-- Add gesperrt field to t_vereinbarungstitel
ALTER TABLE t_vereinbarungstitel 
ADD COLUMN IF NOT EXISTS gesperrt boolean DEFAULT false NOT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN t_vereinbarungstitel.gesperrt IS 'Indicates if the title is locked and cannot be deleted or modified';

