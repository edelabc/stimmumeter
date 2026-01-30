/*
  # Add prepaid_purchase transaction type

  1. Changes
    - Drops existing check constraint on account_transactions.transaction_type
    - Creates new check constraint including 'prepaid_purchase' type
  
  2. Purpose
    - Allows double-entry bookkeeping for prepaid credit purchases
    - Enables proper accounting: HABEN (prepaid_purchase) + SOLL (payment)
  
  3. Transaction Types
    - payment: Payment received (SOLL/Debit)
    - charge: Service charge/usage (HABEN/Credit)
    - refund: Refund issued (SOLL/Debit)
    - adjustment: Manual adjustment
    - prepaid_purchase: Prepaid credit acquired (HABEN/Credit) - NEW
*/

-- Drop existing constraint
ALTER TABLE account_transactions 
DROP CONSTRAINT IF EXISTS account_transactions_transaction_type_check;

-- Create new constraint with prepaid_purchase type
ALTER TABLE account_transactions 
ADD CONSTRAINT account_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['payment'::text, 'charge'::text, 'refund'::text, 'adjustment'::text, 'prepaid_purchase'::text]));