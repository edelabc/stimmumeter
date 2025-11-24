<?php
// api/assessments.php
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
$requiredFields = ['sessionId', 'symbolType', 'latitude', 'longitude', 'mood'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

try {
    $pdo->beginTransaction();

    // 1. Calculate Reward (Simple logic for now, matching SQL function)
    $rewardType = 'mood_assessment';
    $stmt = $pdo->prepare("SELECT min_amount, max_amount FROM yra_rewards_config WHERE reward_type = ? AND is_active = 1");
    $stmt->execute([$rewardType]);
    $config = $stmt->fetch();

    $min = $config['min_amount'] ?? 5;
    $max = $config['max_amount'] ?? 15;
    $yraEarned = rand($min, $max);

    // 2. Insert Assessment
    $stmt = $pdo->prepare("
        INSERT INTO mood_assessments (
            id, session_id, symbol_type, latitude, longitude, mood, intensity, 
            device_fingerprint, user_agent, ip_address, created_at
        ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $input['sessionId'],
        $input['symbolType'],
        $input['latitude'],
        $input['longitude'],
        $input['mood'],
        $input['intensity'] ?? 1,
        $input['deviceFingerprint'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);

    // 3. Update Session Balance
    $stmt = $pdo->prepare("
        UPDATE session_yra 
        SET yra_balance = yra_balance + ?, 
            assessments_count = assessments_count + 1,
            last_activity = NOW()
        WHERE session_id = ?
    ");
    $stmt->execute([$yraEarned, $input['sessionId']]);

    // If session doesn't exist (shouldn't happen if initialized, but safe to handle), create it
    if ($stmt->rowCount() === 0) {
        $stmt = $pdo->prepare("
            INSERT INTO session_yra (session_id, yra_balance, assessments_count, created_at, last_activity)
            VALUES (?, ?, 1, NOW(), NOW())
        ");
        $stmt->execute([$input['sessionId'], $yraEarned]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'yraEarned' => $yraEarned
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
