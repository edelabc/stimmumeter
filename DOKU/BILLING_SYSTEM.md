# Comprehensive Billing System Documentation

## Overview

This application now includes a complete, professional-grade billing and subscription management system with the following features:

### Core Features

1. **Multi-Currency Support**
   - EUR, USD, and custom YRA currency
   - Historical exchange rate tracking
   - Automatic currency conversion

2. **Flexible Pricing Plans**
   - Trial periods (days, months, or permanent/free)
   - Usage limits during trial
   - Postpaid vs Prepaid billing
   - Contract duration and cancellation periods
   - Configurable billing cycles (hourly, daily, monthly, yearly)
   - Base fees (one-time and recurring)

3. **Usage-Based Billing**
   - Per-unit pricing for different actions:
     - Pseudonym creation
     - Mood entries
     - AI integrations
     - Data analysis
     - Export/Import operations
     - Storage
     - API calls
   - Automatic usage tracking
   - Real-time usage monitoring

4. **Invoice Management**
   - Automatic invoice generation
   - PDF export capability
   - Payment tracking
   - Invoice history

5. **Contextual Help System**
   - Admin-editable help texts
   - Tooltip-based help throughout the UI
   - Context-aware assistance

## Database Schema

### Tables Created

1. **currencies** - Currency definitions (EUR, USD, YRA)
2. **exchange_rates** - Historical exchange rates with timestamps
3. **pricing_plans** - Pricing plan definitions
4. **plan_trial_config** - Trial period configuration per plan
5. **plan_trial_limits** - Usage limits during trial
6. **plan_subscription_config** - Subscription billing configuration
7. **plan_subscription_limits** - Usage limits during subscription
8. **billing_item_types** - Types of billable actions
9. **plan_billing_items** - Per-unit pricing for each plan
10. **user_subscriptions** - User's current subscription status
11. **usage_records** - Historical usage data
12. **invoices** - Generated invoices
13. **invoice_items** - Line items on invoices
14. **help_texts** - Contextual help content

## Admin Interface

### Accessing the Billing Admin

1. Log in as an admin user
2. Navigate to Admin Dashboard
3. Click on "Billing & Tarife" in the sidebar

### Managing Pricing Plans

#### Creating a Plan

1. Go to Billing Management → Pricing Plans
2. Click "Create New Plan"
3. Configure Basic Info:
   - Name (e.g., "Starter", "Pro", "Enterprise")
   - Description
   - Color (for UI display)
   - Sort Order (display order in plan comparison)
   - Active status

#### Configuring Trial Period

1. Select a plan from the list
2. Click "Trial" tab
3. Enable trial period
4. Set duration (e.g., 30 days, 3 months)
5. OR mark as "Permanent" for free plans
6. Configure trial limits:
   - Limit period (e.g., per month)
   - Max pseudonyms (blank = unlimited)
   - Max entries (blank = unlimited)
   - Max AI integrations (blank = unlimited)

#### Configuring Subscription

1. Select a plan → "Subscription" tab
2. Choose billing type:
   - **Postpaid**: Users pay after usage
   - **Prepaid**: Users pay upfront
3. Set contract duration (e.g., 12 months)
4. Set cancellation period (e.g., 30 days before renewal)
5. Choose billing cycle:
   - Hourly (for testing/special cases)
   - Daily
   - Monthly (most common)
   - Yearly
6. Set base fees:
   - One-time setup fee
   - Recurring base fee per billing cycle
7. Configure usage limits (same as trial limits)

#### Setting Usage-Based Pricing

1. Select a plan → "Items" tab
2. For each billing item type, set price per unit
3. Choose currency (EUR, USD, YRA)
4. Example pricing:
   - Pseudonym: €0.50 per pseudonym
   - Mood Entry: €0.10 per entry
   - AI Integration: €1.00 per call
   - Export: €0.25 per export

### Managing Currencies

1. Go to Billing Management → Currencies & Exchange Rates
2. **Add Currency**:
   - Code (ISO 4217, e.g., EUR, USD)
   - Name
   - Symbol (€, $, etc.)
   - Mark as "Base" if this is your primary currency
3. **Add Exchange Rate**:
   - From Currency → To Currency
   - Rate (e.g., 1.0850 for EUR to USD)
   - Valid From timestamp
   - Rates are historical - old rates are preserved

### Managing Help Texts

1. Go to Billing Management → Help Texts
2. **Create Help Text**:
   - Code: Unique identifier (e.g., `billing_plan_overview`)
   - Title: Short title for tooltip
   - Content: Detailed explanation
   - Context: Where it's used (optional)
   - Active: Make visible to users
3. Help texts appear as question mark icons with tooltips throughout the admin interface

## User Billing Portal

Users can access their billing information from their account settings.

### Features for Users

1. **Subscription Overview**
   - Current plan name and status
   - Trial or subscription dates
   - Auto-renewal status
   - Quick actions (change plan, cancel)

2. **Invoice History**
   - List of all invoices
   - Download PDF invoices
   - Payment status

3. **Usage Tracking**
   - Summary of usage (last 30 days)
   - Detailed usage history
   - Per-feature usage counts

### User Actions

- **Change Plan**: Upgrade or downgrade at any time
- **Cancel Subscription**: Stop auto-renewal
- **Download Invoices**: PDF export for accounting
- **View Usage**: Monitor consumption against limits

## API Integration

### Tracking Usage Programmatically

The system includes a `recordUsage()` function in `src/lib/billing.ts`:

```typescript
import { recordUsage } from './lib/billing';

// Record a mood entry
await recordUsage(userId, 'mood_entry', 1, entryId);

// Record an AI call
await recordUsage(userId, 'ai_integration', 1, null);

// Record pseudonym creation
await recordUsage(userId, 'pseudonym', 1, pseudonymId);
```

### Automatic Usage Tracking

To automatically track usage, add calls to `recordUsage()` when users perform actions:

**Example: Track Mood Entry Creation**

```typescript
// In your mood entry creation code
const { data: entry } = await supabase
  .from('mood_entries')
  .insert({ ...entryData })
  .select()
  .single();

if (entry) {
  // Track usage for billing
  await recordUsage(user.id, 'mood_entry', 1, entry.id);
}
```

## Billing Item Types

### Default Item Types (seeded automatically)

| Code | Name | Icon | Description |
|------|------|------|-------------|
| `pseudonym` | Pseudonym | User | Cost per pseudonym created |
| `mood_entry` | Mood Entry | Heart | Cost per mood entry recorded |
| `ai_integration` | AI Integration | Brain | Cost per AI analysis or forecast |
| `analysis` | Analysis | BarChart3 | Cost per data analysis performed |
| `export` | Export | Download | Cost per data export (PDF, CSV, Image) |
| `import` | Import | Upload | Cost per data import |
| `storage` | Storage | Database | Monthly storage cost |
| `api_call` | API Call | Zap | Cost per API request |

## Migration Instructions

### Applying the Migrations

The billing system requires two migrations to be applied:

1. **Core Schema** (`20251109210000_create_comprehensive_billing_system.sql`)
   - Creates all tables, policies, functions, and triggers
   - Must be applied first

2. **Seed Data** (`20251109210001_seed_billing_data.sql`)
   - Populates default currencies (EUR, USD, YRA)
   - Adds default billing item types
   - Inserts default help texts

### Manual Migration Application

If using Supabase dashboard:

1. Go to SQL Editor
2. Copy contents of migration file
3. Run the SQL
4. Repeat for seed data file

### Using Supabase CLI (if available)

```bash
supabase db push
```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Admins**: Full access to all billing configuration
- **Users**: Can only view their own subscriptions, invoices, and usage
- **Public**: Can view active pricing plans (for plan comparison)

### Data Protection

- Invoices are immutable once issued
- Usage records are append-only
- Exchange rates are historical (never updated, only new rates added)
- Plan changes don't affect existing subscribers (versioning)

## Best Practices

### For Admins

1. **Set Base Currency**: Mark one currency as base (usually EUR or USD)
2. **Regular Exchange Rate Updates**: Update rates monthly or as needed
3. **Test Plans First**: Create inactive plans for testing before making them public
4. **Clear Help Texts**: Write simple, user-friendly help content
5. **Monitor Usage**: Check usage records to ensure tracking works correctly

### For Developers

1. **Always Track Usage**: Call `recordUsage()` for every billable action
2. **Handle Limits**: Check user limits before allowing actions
3. **Test Billing Flow**: Test trial → subscription → renewal flow thoroughly
4. **Error Handling**: Gracefully handle billing errors (don't block user actions)
5. **Invoice Generation**: Implement automated invoice generation (cron job recommended)

## Future Enhancements

### Planned Features

1. **Payment Integration**
   - Stripe integration for card payments
   - PayPal support
   - Bank transfer tracking

2. **Advanced Analytics**
   - Revenue dashboards
   - Churn analysis
   - Usage forecasting

3. **Automated Billing**
   - Automatic invoice generation at end of billing cycle
   - Payment reminders
   - Dunning management (handling failed payments)

4. **Plan Comparison Page**
   - Public-facing plan comparison
   - Feature matrix
   - Pricing calculator

5. **Webhooks**
   - Subscription events
   - Payment events
   - Usage alerts

## Troubleshooting

### Common Issues

**Q: Users can't see their subscription**
A: Ensure user_subscriptions record exists and has status 'trial' or 'active'

**Q: Exchange rates not working**
A: Check that `valid_from` date is set correctly and currency codes match

**Q: Usage not being tracked**
A: Verify `recordUsage()` is being called and billing_item_types exist

**Q: Help tooltips not showing**
A: Ensure help_texts are marked as active and codes match what's used in components

### Database Queries for Debugging

```sql
-- Check active subscriptions
SELECT * FROM user_subscriptions WHERE status IN ('trial', 'active');

-- View recent usage
SELECT * FROM usage_records
ORDER BY recorded_at DESC
LIMIT 50;

-- Check pricing plans
SELECT * FROM pricing_plans WHERE is_active = true;

-- View exchange rates
SELECT * FROM exchange_rates
ORDER BY valid_from DESC
LIMIT 10;
```

## Support

For issues or questions about the billing system:

1. Check this documentation
2. Review help texts in admin panel
3. Examine database policies and triggers
4. Contact system administrator

---

**Last Updated**: 2025-11-09
**Version**: 1.0.0
