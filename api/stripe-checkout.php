<?php
/**
 * Stripe Checkout API
 * Lokale PHP-API für Stripe Checkout Sessions
 * Ersetzt die Supabase Edge Function
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth-helper.php';

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    $pdo = getDbConnection();
    $user = getCurrentUserFromAuth($pdo);
    
    /**
     * Hole Stripe API-Key aus payment_providers Konfiguration
     */
    function getStripeConfig($pdo) {
        $stmt = $pdo->prepare("SELECT config, is_test_mode FROM payment_providers WHERE code = 'stripe' AND is_active = 1 LIMIT 1");
        $stmt->execute();
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$provider) {
            throw new Exception('Stripe ist nicht konfiguriert oder nicht aktiv');
        }
        
        $config = is_string($provider['config']) ? json_decode($provider['config'], true) : ($provider['config'] ?: []);
        $isTestMode = (bool)($provider['is_test_mode'] ?? true);
        
        // Wähle Test- oder Live-Keys
        $secretKey = $isTestMode 
            ? ($config['test_secret_key'] ?? null)
            : ($config['live_secret_key'] ?? null);
            
        $publishableKey = $isTestMode
            ? ($config['test_publishable_key'] ?? null)
            : ($config['live_publishable_key'] ?? null);
        
        if (empty($secretKey)) {
            throw new Exception('Stripe API-Key nicht konfiguriert. Bitte konfigurieren Sie Stripe im Admin-Dashboard.');
        }
        
        return [
            'secret_key' => $secretKey,
            'publishable_key' => $publishableKey,
            'is_test_mode' => $isTestMode
        ];
    }
    
    switch ($action) {
        case 'create-checkout-session':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Method not allowed']);
                exit;
            }
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Nicht angemeldet']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $amount = floatval($data['amount'] ?? 0);
            $currency = strtolower($data['currency'] ?? 'eur');
            $description = $data['description'] ?? 'Konto-Aufladung';
            $appUrl = $data['appUrl'] ?? 'http://localhost:5173';
            
            // Validierung
            if ($amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Ungültiger Betrag']);
                exit;
            }
            
            if ($amount > 10000) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Betrag zu hoch (max. 10.000 EUR)']);
                exit;
            }
            
            // Stripe-Konfiguration holen
            $stripeConfig = getStripeConfig($pdo);
            
            // Stripe API aufrufen
            $stripeApiUrl = 'https://api.stripe.com/v1/checkout/sessions';
            
            $postData = [
                'mode' => 'payment',
                'success_url' => $appUrl . '/payment-success?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $appUrl . '/payment-cancelled',
                'line_items[0][price_data][currency]' => $currency,
                'line_items[0][price_data][product_data][name]' => $description,
                'line_items[0][price_data][unit_amount]' => (int)($amount * 100), // Stripe erwartet Cents
                'line_items[0][quantity]' => 1,
                'customer_email' => $user['email'] ?? null,
                'metadata[user_id]' => $user['id'],
                'metadata[amount_eur]' => $amount,
            ];
            
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $stripeApiUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $stripeConfig['secret_key'],
                'Content-Type: application/x-www-form-urlencoded',
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);
            
            if ($curlError) {
                error_log("Stripe cURL Fehler: $curlError");
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Netzwerkfehler bei Stripe-Kommunikation']);
                exit;
            }
            
            $stripeResponse = json_decode($response, true);
            
            if ($httpCode >= 400) {
                $errorMessage = $stripeResponse['error']['message'] ?? 'Stripe-Fehler';
                error_log("Stripe API Fehler: $errorMessage | Response: $response");
                http_response_code($httpCode);
                echo json_encode(['success' => false, 'error' => $errorMessage]);
                exit;
            }
            
            // Erfolg
            echo json_encode([
                'success' => true,
                'sessionId' => $stripeResponse['id'],
                'url' => $stripeResponse['url']
            ]);
            exit;
            
        case 'verify-session':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Method not allowed']);
                exit;
            }
            
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'error' => 'Nicht angemeldet']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $sessionId = $data['sessionId'] ?? '';
            
            if (empty($sessionId)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Session ID erforderlich']);
                exit;
            }
            
            // Stripe-Konfiguration holen
            $stripeConfig = getStripeConfig($pdo);
            
            // Session von Stripe abrufen
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.stripe.com/v1/checkout/sessions/' . urlencode($sessionId));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: Bearer ' . $stripeConfig['secret_key'],
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            $stripeResponse = json_decode($response, true);
            
            if ($httpCode >= 400) {
                $errorMessage = $stripeResponse['error']['message'] ?? 'Stripe-Fehler';
                http_response_code($httpCode);
                echo json_encode(['success' => false, 'error' => $errorMessage]);
                exit;
            }
            
            // Prüfe ob Zahlung erfolgreich
            $paymentStatus = $stripeResponse['payment_status'] ?? '';
            $verified = $paymentStatus === 'paid';
            
            // Betrag aus Metadata oder amount_total
            $amountTotal = ($stripeResponse['amount_total'] ?? 0) / 100; // Von Cents zu EUR
            $currency = strtoupper($stripeResponse['currency'] ?? 'EUR');
            
            echo json_encode([
                'success' => true,
                'verified' => $verified,
                'amount' => $amountTotal,
                'currency' => $currency,
                'status' => $paymentStatus,
                'metadata' => $stripeResponse['metadata'] ?? []
            ]);
            exit;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ungültige Aktion: ' . $action]);
            exit;
    }
    
} catch (Exception $e) {
    error_log("Stripe Checkout API Fehler: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
?>
