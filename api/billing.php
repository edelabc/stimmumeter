<?php
/**
 * Billing System API
 * Ersetzt Supabase-Aufrufe für Billing-Funktionen
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get action from query string
$action = $_GET['action'] ?? '';

try {
    $pdo = getDbConnection();
    $user = getCurrentUserFromAuth($pdo);
    
    // Helper function to generate UUID
    function generateUuid() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    // Helper function to format response
    function successResponse($data) {
        return json_encode(['data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE);
    }
    
    function errorResponse($message, $code = 400) {
        http_response_code($code);
        return json_encode(['data' => null, 'error' => $message], JSON_UNESCAPED_UNICODE);
    }
    
    switch ($action) {
        // ============================================
        // CURRENCIES
        // ============================================
        case 'currencies':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->query("SELECT * FROM currencies ORDER BY code");
                $currencies = $stmt->fetchAll(PDO::FETCH_ASSOC);
                // Convert TINYINT to boolean
                foreach ($currencies as &$currency) {
                    $currency['is_base'] = (bool)$currency['is_base'];
                    $currency['is_active'] = (bool)$currency['is_active'];
                }
                echo successResponse($currencies);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO currencies (code, name, symbol, is_base, is_active) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['code'],
                    $data['name'],
                    $data['symbol'],
                    $data['is_base'] ? 1 : 0,
                    $data['is_active'] ? 1 : 0
                ]);
                $currency = $pdo->query("SELECT * FROM currencies WHERE code = '{$data['code']}'")->fetch(PDO::FETCH_ASSOC);
                $currency['is_base'] = (bool)$currency['is_base'];
                $currency['is_active'] = (bool)$currency['is_active'];
                echo successResponse($currency);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        case 'currency':
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $code = $_GET['code'] ?? '';
                $data = json_decode(file_get_contents('php://input'), true);
                $updates = [];
                $params = [];
                if (isset($data['name'])) { $updates[] = "name = ?"; $params[] = $data['name']; }
                if (isset($data['symbol'])) { $updates[] = "symbol = ?"; $params[] = $data['symbol']; }
                if (isset($data['is_base'])) { $updates[] = "is_base = ?"; $params[] = $data['is_base'] ? 1 : 0; }
                if (isset($data['is_active'])) { $updates[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }
                $updates[] = "updated_at = NOW()";
                $params[] = $code;
                $stmt = $pdo->prepare("UPDATE currencies SET " . implode(', ', $updates) . " WHERE code = ?");
                $stmt->execute($params);
                $currency = $pdo->query("SELECT * FROM currencies WHERE code = '$code'")->fetch(PDO::FETCH_ASSOC);
                if ($currency) {
                    $currency['is_base'] = (bool)$currency['is_base'];
                    $currency['is_active'] = (bool)$currency['is_active'];
                    echo successResponse($currency);
                } else {
                    echo errorResponse('Currency not found', 404);
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $code = $_GET['code'] ?? '';
                $stmt = $pdo->prepare("DELETE FROM currencies WHERE code = ?");
                $stmt->execute([$code]);
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // EXCHANGE RATES
        // ============================================
        case 'exchange-rates':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->query("SELECT * FROM exchange_rates ORDER BY valid_from DESC");
                $rates = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo successResponse($rates);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO exchange_rates (id, from_currency, to_currency, rate, valid_from, created_by) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $data['from_currency'],
                    $data['to_currency'],
                    $data['rate'],
                    $data['valid_from'],
                    $user['id']
                ]);
                $rate = $pdo->query("SELECT * FROM exchange_rates WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                echo successResponse($rate);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PRICING PLANS
        // ============================================
        case 'pricing-plans':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $activeOnly = $_GET['active_only'] ?? false;
                $query = "SELECT * FROM pricing_plans";
                if ($activeOnly) {
                    $query .= " WHERE is_active = 1";
                }
                $query .= " ORDER BY sort_order";
                $stmt = $pdo->query($query);
                $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($plans as &$plan) {
                    $plan['is_active'] = (bool)$plan['is_active'];
                }
                echo successResponse($plans);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO pricing_plans (id, name, description, is_active, sort_order, color, version) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $data['name'],
                    $data['description'] ?? null,
                    $data['is_active'] ? 1 : 0,
                    $data['sort_order'] ?? 0,
                    $data['color'] ?? '#000000',
                    $data['version'] ?? 1
                ]);
                $plan = $pdo->query("SELECT * FROM pricing_plans WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $plan['is_active'] = (bool)$plan['is_active'];
                echo successResponse($plan);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        case 'pricing-plan':
            $planId = $_GET['id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $updates = [];
                $params = [];
                if (isset($data['name'])) { $updates[] = "name = ?"; $params[] = $data['name']; }
                if (isset($data['description'])) { $updates[] = "description = ?"; $params[] = $data['description']; }
                if (isset($data['is_active'])) { $updates[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }
                if (isset($data['sort_order'])) { $updates[] = "sort_order = ?"; $params[] = $data['sort_order']; }
                if (isset($data['color'])) { $updates[] = "color = ?"; $params[] = $data['color']; }
                if (isset($data['version'])) { $updates[] = "version = ?"; $params[] = $data['version']; }
                $updates[] = "updated_at = NOW()";
                $params[] = $planId;
                $stmt = $pdo->prepare("UPDATE pricing_plans SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                $plan = $pdo->query("SELECT * FROM pricing_plans WHERE id = '$planId'")->fetch(PDO::FETCH_ASSOC);
                if ($plan) {
                    $plan['is_active'] = (bool)$plan['is_active'];
                    echo successResponse($plan);
                } else {
                    echo errorResponse('Plan not found', 404);
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM pricing_plans WHERE id = ?");
                $stmt->execute([$planId]);
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PLAN TRIAL CONFIG
        // ============================================
        case 'plan-trial-config':
            $planId = $_GET['plan_id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->prepare("SELECT * FROM plan_trial_config WHERE plan_id = ?");
                $stmt->execute([$planId]);
                $config = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($config) {
                    $config['is_enabled'] = (bool)$config['is_enabled'];
                    $config['is_permanent'] = (bool)$config['is_permanent'];
                    echo successResponse($config);
                } else {
                    echo successResponse(null);
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM plan_trial_config WHERE plan_id = ?");
                $stmt->execute([$planId]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE plan_trial_config SET is_enabled = ?, duration_value = ?, duration_unit = ?, is_permanent = ? WHERE plan_id = ?");
                    $stmt->execute([
                        $data['is_enabled'] ? 1 : 0,
                        $data['duration_value'] ?? null,
                        $data['duration_unit'] ?? null,
                        $data['is_permanent'] ? 1 : 0,
                        $planId
                    ]);
                    $config = $pdo->query("SELECT * FROM plan_trial_config WHERE plan_id = '$planId'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO plan_trial_config (id, plan_id, is_enabled, duration_value, duration_unit, is_permanent) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $planId,
                        $data['is_enabled'] ? 1 : 0,
                        $data['duration_value'] ?? null,
                        $data['duration_unit'] ?? null,
                        $data['is_permanent'] ? 1 : 0
                    ]);
                    $config = $pdo->query("SELECT * FROM plan_trial_config WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                $config['is_enabled'] = (bool)$config['is_enabled'];
                $config['is_permanent'] = (bool)$config['is_permanent'];
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PLAN TRIAL LIMITS
        // ============================================
        case 'plan-trial-limits':
            $trialConfigId = $_GET['trial_config_id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->prepare("SELECT * FROM plan_trial_limits WHERE trial_config_id = ?");
                $stmt->execute([$trialConfigId]);
                $limits = $stmt->fetch(PDO::FETCH_ASSOC);
                echo successResponse($limits ?: null);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM plan_trial_limits WHERE trial_config_id = ?");
                $stmt->execute([$trialConfigId]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE plan_trial_limits SET limit_period_value = ?, limit_period_unit = ?, pseudonym_limit = ?, entry_limit = ?, ai_integration_limit = ? WHERE trial_config_id = ?");
                    $stmt->execute([
                        $data['limit_period_value'],
                        $data['limit_period_unit'],
                        $data['pseudonym_limit'] ?? null,
                        $data['entry_limit'] ?? null,
                        $data['ai_integration_limit'] ?? null,
                        $trialConfigId
                    ]);
                    $limits = $pdo->query("SELECT * FROM plan_trial_limits WHERE trial_config_id = '$trialConfigId'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO plan_trial_limits (id, trial_config_id, limit_period_value, limit_period_unit, pseudonym_limit, entry_limit, ai_integration_limit) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $trialConfigId,
                        $data['limit_period_value'],
                        $data['limit_period_unit'],
                        $data['pseudonym_limit'] ?? null,
                        $data['entry_limit'] ?? null,
                        $data['ai_integration_limit'] ?? null
                    ]);
                    $limits = $pdo->query("SELECT * FROM plan_trial_limits WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                echo successResponse($limits);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PLAN SUBSCRIPTION CONFIG
        // ============================================
        case 'plan-subscription-config':
            $planId = $_GET['plan_id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->prepare("SELECT * FROM plan_subscription_config WHERE plan_id = ?");
                $stmt->execute([$planId]);
                $config = $stmt->fetch(PDO::FETCH_ASSOC);
                echo successResponse($config ?: null);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM plan_subscription_config WHERE plan_id = ?");
                $stmt->execute([$planId]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE plan_subscription_config SET is_enabled = ?, billing_type = ?, contract_period_value = ?, contract_period_unit = ?, notice_period_value = ?, notice_period_unit = ?, billing_cycle_value = ?, billing_cycle_unit = ?, base_fee = ? WHERE plan_id = ?");
                    $stmt->execute([
                        $data['is_enabled'] ? 1 : 0,
                        $data['billing_type'],
                        $data['contract_period_value'],
                        $data['contract_period_unit'],
                        $data['notice_period_value'],
                        $data['notice_period_unit'],
                        $data['billing_cycle_value'],
                        $data['billing_cycle_unit'],
                        $data['base_fee'] ?? null,
                        $planId
                    ]);
                    $config = $pdo->query("SELECT * FROM plan_subscription_config WHERE plan_id = '$planId'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO plan_subscription_config (id, plan_id, is_enabled, billing_type, contract_period_value, contract_period_unit, notice_period_value, notice_period_unit, billing_cycle_value, billing_cycle_unit, base_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $planId,
                        $data['is_enabled'] ? 1 : 0,
                        $data['billing_type'],
                        $data['contract_period_value'],
                        $data['contract_period_unit'],
                        $data['notice_period_value'],
                        $data['notice_period_unit'],
                        $data['billing_cycle_value'],
                        $data['billing_cycle_unit'],
                        $data['base_fee'] ?? null
                    ]);
                    $config = $pdo->query("SELECT * FROM plan_subscription_config WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                $config['is_enabled'] = (bool)$config['is_enabled'];
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PLAN SUBSCRIPTION LIMITS
        // ============================================
        case 'plan-subscription-limits':
            $subscriptionConfigId = $_GET['subscription_config_id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->prepare("SELECT * FROM plan_subscription_limits WHERE subscription_config_id = ?");
                $stmt->execute([$subscriptionConfigId]);
                $limits = $stmt->fetch(PDO::FETCH_ASSOC);
                echo successResponse($limits ?: null);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM plan_subscription_limits WHERE subscription_config_id = ?");
                $stmt->execute([$subscriptionConfigId]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE plan_subscription_limits SET limit_period_value = ?, limit_period_unit = ?, pseudonym_limit = ?, entry_limit = ?, ai_integration_limit = ? WHERE subscription_config_id = ?");
                    $stmt->execute([
                        $data['limit_period_value'],
                        $data['limit_period_unit'],
                        $data['pseudonym_limit'] ?? null,
                        $data['entry_limit'] ?? null,
                        $data['ai_integration_limit'] ?? null,
                        $subscriptionConfigId
                    ]);
                    $limits = $pdo->query("SELECT * FROM plan_subscription_limits WHERE subscription_config_id = '$subscriptionConfigId'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO plan_subscription_limits (id, subscription_config_id, limit_period_value, limit_period_unit, pseudonym_limit, entry_limit, ai_integration_limit) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $subscriptionConfigId,
                        $data['limit_period_value'],
                        $data['limit_period_unit'],
                        $data['pseudonym_limit'] ?? null,
                        $data['entry_limit'] ?? null,
                        $data['ai_integration_limit'] ?? null
                    ]);
                    $limits = $pdo->query("SELECT * FROM plan_subscription_limits WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                echo successResponse($limits);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // BILLING ITEM TYPES
        // ============================================
        case 'billing-item-types':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->query("SELECT * FROM billing_item_types ORDER BY sort_order");
                $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($types as &$type) {
                    $type['is_active'] = (bool)$type['is_active'];
                }
                echo successResponse($types);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PLAN BILLING ITEMS
        // ============================================
        case 'plan-billing-items':
            $planId = $_GET['plan_id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->prepare("
                    SELECT pbi.*, bit.* as item_type
                    FROM plan_billing_items pbi
                    LEFT JOIN billing_item_types bit ON pbi.billing_item_type_id = bit.id
                    WHERE pbi.plan_id = ?
                ");
                $stmt->execute([$planId]);
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo successResponse($items);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM plan_billing_items WHERE plan_id = ? AND billing_item_type_id = ?");
                $stmt->execute([$planId, $data['billing_item_type_id']]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE plan_billing_items SET price_per_unit = ?, currency_code = ?, is_active = ? WHERE plan_id = ? AND billing_item_type_id = ?");
                    $stmt->execute([
                        $data['price_per_unit'],
                        $data['currency_code'],
                        $data['is_active'] ? 1 : 0,
                        $planId,
                        $data['billing_item_type_id']
                    ]);
                    $item = $pdo->query("SELECT * FROM plan_billing_items WHERE plan_id = '$planId' AND billing_item_type_id = '{$data['billing_item_type_id']}'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO plan_billing_items (id, plan_id, billing_item_type_id, price_per_unit, currency_code, is_active) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $planId,
                        $data['billing_item_type_id'],
                        $data['price_per_unit'],
                        $data['currency_code'],
                        $data['is_active'] ? 1 : 0
                    ]);
                    $item = $pdo->query("SELECT * FROM plan_billing_items WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                $item['is_active'] = (bool)$item['is_active'];
                echo successResponse($item);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        case 'plan-billing-item':
            $itemId = $_GET['id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM plan_billing_items WHERE id = ?");
                $stmt->execute([$itemId]);
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // USER SUBSCRIPTIONS
        // ============================================
        case 'user-subscription':
            $userId = $_GET['user_id'] ?? ($user['id'] ?? '');
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Users can only view their own subscription
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("
                    SELECT us.*, pp.* as plan
                    FROM user_subscriptions us
                    LEFT JOIN pricing_plans pp ON us.plan_id = pp.id
                    WHERE us.user_id = ? AND us.status IN ('trial', 'active')
                    LIMIT 1
                ");
                $stmt->execute([$userId]);
                $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
                echo successResponse($subscription ?: null);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // INVOICES
        // ============================================
        case 'invoices':
            $userId = $_GET['user_id'] ?? ($user['id'] ?? '');
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Users can only view their own invoices
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("
                    SELECT i.*, 
                           (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                               'id', ii.id,
                               'invoice_id', ii.invoice_id,
                               'item_type_id', ii.item_type_id,
                               'description', ii.description,
                               'quantity', ii.quantity,
                               'unit_price', ii.unit_price,
                               'line_total', ii.line_total,
                               'sort_order', ii.sort_order
                           )) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items
                    FROM invoices i
                    WHERE i.user_id = ?
                    ORDER BY i.issue_date DESC
                ");
                $stmt->execute([$userId]);
                $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
                // Parse JSON items
                foreach ($invoices as &$invoice) {
                    $invoice['items'] = json_decode($invoice['items'] ?? '[]', true);
                }
                echo successResponse($invoices);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // USAGE RECORDS
        // ============================================
        case 'usage-records':
            $userId = $_GET['user_id'] ?? ($user['id'] ?? '');
            $startDate = $_GET['start_date'] ?? '';
            $endDate = $_GET['end_date'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Users can only view their own usage
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $query = "
                    SELECT ur.*, bit.* as item_type
                    FROM usage_records ur
                    LEFT JOIN billing_item_types bit ON ur.item_type_id = bit.id
                    WHERE ur.user_id = ?
                ";
                $params = [$userId];
                if ($startDate) {
                    $query .= " AND ur.recorded_at >= ?";
                    $params[] = $startDate;
                }
                if ($endDate) {
                    $query .= " AND ur.recorded_at <= ?";
                    $params[] = $endDate;
                }
                $query .= " ORDER BY ur.recorded_at DESC";
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($records as &$record) {
                    $record['is_billed'] = (bool)$record['is_billed'];
                }
                echo successResponse($records);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // HELP TEXTS
        // ============================================
        case 'help-texts':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $code = $_GET['code'] ?? '';
                if ($code) {
                    $stmt = $pdo->prepare("SELECT * FROM help_texts WHERE code = ? AND is_active = 1");
                    $stmt->execute([$code]);
                    $helpText = $stmt->fetch(PDO::FETCH_ASSOC);
                    echo successResponse($helpText ?: null);
                } else {
                    $stmt = $pdo->query("SELECT * FROM help_texts ORDER BY code");
                    $helpTexts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($helpTexts as &$helpText) {
                        $helpText['is_active'] = (bool)$helpText['is_active'];
                    }
                    echo successResponse($helpTexts);
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO help_texts (id, code, title, content, context, is_active) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $data['code'],
                    $data['title'],
                    $data['content'],
                    $data['context'] ?? null,
                    $data['is_active'] ? 1 : 0
                ]);
                $helpText = $pdo->query("SELECT * FROM help_texts WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $helpText['is_active'] = (bool)$helpText['is_active'];
                echo successResponse($helpText);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        case 'help-text':
            $helpTextId = $_GET['id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $updates = [];
                $params = [];
                if (isset($data['code'])) { $updates[] = "code = ?"; $params[] = $data['code']; }
                if (isset($data['title'])) { $updates[] = "title = ?"; $params[] = $data['title']; }
                if (isset($data['content'])) { $updates[] = "content = ?"; $params[] = $data['content']; }
                if (isset($data['context'])) { $updates[] = "context = ?"; $params[] = $data['context']; }
                if (isset($data['is_active'])) { $updates[] = "is_active = ?"; $params[] = $data['is_active'] ? 1 : 0; }
                $updates[] = "updated_at = NOW()";
                $params[] = $helpTextId;
                $stmt = $pdo->prepare("UPDATE help_texts SET " . implode(', ', $updates) . " WHERE id = ?");
                $stmt->execute($params);
                $helpText = $pdo->query("SELECT * FROM help_texts WHERE id = '$helpTextId'")->fetch(PDO::FETCH_ASSOC);
                if ($helpText) {
                    $helpText['is_active'] = (bool)$helpText['is_active'];
                    echo successResponse($helpText);
                } else {
                    echo errorResponse('Help text not found', 404);
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM help_texts WHERE id = ?");
                $stmt->execute([$helpTextId]);
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // USER ACCOUNT CONFIG
        // ============================================
        case 'user-account-config':
            $userId = $_GET['user_id'] ?? ($user['id'] ?? '');
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Users can only view their own config
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM user_account_config WHERE user_id = ?");
                $stmt->execute([$userId]);
                $config = $stmt->fetch(PDO::FETCH_ASSOC);
                echo successResponse($config ?: null);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Users can only update their own config
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM user_account_config WHERE user_id = ?");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE user_account_config SET account_type = ?, current_plan_id = ?, balance = ?, updated_at = NOW() WHERE user_id = ?");
                    $stmt->execute([
                        $data['account_type'],
                        $data['current_plan_id'] ?? null,
                        $data['balance'] ?? 0,
                        $userId
                    ]);
                    $config = $pdo->query("SELECT * FROM user_account_config WHERE user_id = '$userId'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO user_account_config (id, user_id, account_type, current_plan_id, balance) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $userId,
                        $data['account_type'],
                        $data['current_plan_id'] ?? null,
                        $data['balance'] ?? 0
                    ]);
                    $config = $pdo->query("SELECT * FROM user_account_config WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                echo successResponse($config);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // ACCOUNT TRANSACTIONS
        // ============================================
        case 'account-transactions':
            $userId = $_GET['user_id'] ?? ($user['id'] ?? '');
            $limit = $_GET['limit'] ?? 50;
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Users can only view their own transactions
                if ($userId !== $user['id'] && !isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM account_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT ?");
                $stmt->execute([$userId, $limit]);
                $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo successResponse($transactions);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Only admins can create transactions
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO account_transactions (id, user_id, transaction_date, document_number, description, debit, credit, balance_after, transaction_type, related_invoice_id, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id,
                    $data['user_id'],
                    $data['transaction_date'],
                    $data['document_number'] ?? null,
                    $data['description'],
                    $data['debit'] ?? null,
                    $data['credit'] ?? null,
                    $data['balance_after'],
                    $data['transaction_type'],
                    $data['related_invoice_id'] ?? null,
                    $data['stripe_payment_id'] ?? null
                ]);
                $transaction = $pdo->query("SELECT * FROM account_transactions WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                echo successResponse($transaction);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // PREPAID RECHARGE AMOUNTS
        // ============================================
        case 'prepaid-recharge-amounts':
            $activeOnly = $_GET['active_only'] ?? false;
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $query = "SELECT * FROM prepaid_recharge_amounts";
                if ($activeOnly) {
                    $query .= " WHERE is_active = 1";
                }
                $query .= " ORDER BY sort_order";
                $stmt = $pdo->query($query);
                $amounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($amounts as &$amount) {
                    $amount['is_active'] = (bool)$amount['is_active'];
                    // Convert DECIMAL to float for JavaScript
                    $amount['amount'] = (float)$amount['amount'];
                    $amount['bonus_percentage'] = (float)$amount['bonus_percentage'];
                    $amount['sort_order'] = (int)$amount['sort_order'];
                }
                echo successResponse($amounts);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $data = json_decode(file_get_contents('php://input'), true);
                // Check if exists
                $stmt = $pdo->prepare("SELECT id FROM prepaid_recharge_amounts WHERE amount = ? AND currency_code = ?");
                $stmt->execute([$data['amount'], $data['currency_code']]);
                $existing = $stmt->fetch();
                if ($existing) {
                    // Update
                    $stmt = $pdo->prepare("UPDATE prepaid_recharge_amounts SET is_active = ?, sort_order = ?, bonus_percentage = ?, updated_at = NOW() WHERE amount = ? AND currency_code = ?");
                    $stmt->execute([
                        $data['is_active'] ? 1 : 0,
                        $data['sort_order'] ?? 0,
                        $data['bonus_percentage'] ?? 0,
                        $data['amount'],
                        $data['currency_code']
                    ]);
                    $amount = $pdo->query("SELECT * FROM prepaid_recharge_amounts WHERE amount = '{$data['amount']}' AND currency_code = '{$data['currency_code']}'")->fetch(PDO::FETCH_ASSOC);
                } else {
                    // Insert
                    $id = generateUuid();
                    $stmt = $pdo->prepare("INSERT INTO prepaid_recharge_amounts (id, amount, currency_code, is_active, sort_order, bonus_percentage) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $id,
                        $data['amount'],
                        $data['currency_code'],
                        $data['is_active'] ? 1 : 0,
                        $data['sort_order'] ?? 0,
                        $data['bonus_percentage'] ?? 0
                    ]);
                    $amount = $pdo->query("SELECT * FROM prepaid_recharge_amounts WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                }
                $amount['is_active'] = (bool)$amount['is_active'];
                echo successResponse($amount);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        case 'prepaid-recharge-amount':
            $amountId = $_GET['id'] ?? '';
            if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                if (!isAdmin($pdo, $user['id'] ?? null)) {
                    echo errorResponse('Unauthorized', 403);
                    exit;
                }
                $stmt = $pdo->prepare("DELETE FROM prepaid_recharge_amounts WHERE id = ?");
                $stmt->execute([$amountId]);
                echo successResponse(['deleted' => true]);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        // ============================================
        // RECORD USAGE
        // ============================================
        case 'record-usage':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                $userId = $data['user_id'] ?? ($user['id'] ?? '');
                
                // Get item type
                $stmt = $pdo->prepare("SELECT id FROM billing_item_types WHERE code = ?");
                $stmt->execute([$data['item_type_code']]);
                $itemType = $stmt->fetch();
                if (!$itemType) {
                    echo errorResponse("Billing item type {$data['item_type_code']} not found", 404);
                    exit;
                }
                
                // Get user subscription
                $stmt = $pdo->prepare("SELECT id FROM user_subscriptions WHERE user_id = ? AND status IN ('trial', 'active') LIMIT 1");
                $stmt->execute([$userId]);
                $subscription = $stmt->fetch();
                
                // Calculate billing period (current month)
                $now = new DateTime();
                $periodStart = new DateTime($now->format('Y-m-01'));
                $periodEnd = new DateTime($now->format('Y-m-t 23:59:59'));
                
                $id = generateUuid();
                $stmt = $pdo->prepare("INSERT INTO usage_records (id, user_id, subscription_id, item_type_id, quantity, reference_id, billing_period_start, billing_period_end, is_billed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)");
                $stmt->execute([
                    $id,
                    $userId,
                    $subscription ? $subscription['id'] : null,
                    $itemType['id'],
                    $data['quantity'] ?? 1,
                    $data['reference_id'] ?? null,
                    $periodStart->format('Y-m-d H:i:s'),
                    $periodEnd->format('Y-m-d H:i:s')
                ]);
                $record = $pdo->query("SELECT * FROM usage_records WHERE id = '$id'")->fetch(PDO::FETCH_ASSOC);
                $record['is_billed'] = (bool)$record['is_billed'];
                echo successResponse($record);
            } else {
                echo errorResponse('Method not allowed', 405);
            }
            break;
            
        default:
            echo errorResponse("Unknown action: $action", 400);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'data' => null,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>



